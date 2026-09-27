import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import { uploadFileBuffer } from '../config/cloudinary';
import { ChunkModel } from '../models/chunk.model';
import { DocumentModel, IDocument } from '../models/document.model';
import { QuizModel } from '../models/quiz.model';
import { QuizAttemptModel } from '../models/quizAttempt.model';
import { NotFoundError, ValidationError } from '../utils/errors';
import { recalculateTopicMastery } from './analytics.service';
import { extractionService } from './extraction.service';
import { llmService } from './llm.service';
import { ocrService } from './ocr.service';

export interface UploadDocumentDto {
  title?: string;
  subject?: string;
}

export interface CreatePrimerDto {
  topic: string;
  subject?: string;
}

export interface DeleteDocumentResult {
  message: string;
  deletedDocumentId: string;
  deletedDocumentTitle: string;
  preservedHistory: boolean;
  deletedChunksCount: number;
  deletedQuizzesCount: number;
  deletedAttemptsCount: number;
  affectedTopicsCount: number;
  affectedTopicTags: string[];
}

export class DocumentService {
  /**
   * Uploads a document (PDF or Image), creates a DB entry in 'processing' status,
   * and triggers asynchronous text extraction/OCR without blocking the HTTP response.
   */
  public async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto
  ): Promise<IDocument> {
    if (!file) {
      throw new ValidationError('No file provided for upload');
    }

    // Validate supported file types (PDF and images)
    const isPdf =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isImage =
      file.mimetype.startsWith('image/') ||
      /\.(jpe?g|png|webp)$/i.test(file.originalname.toLowerCase());

    if (!isPdf && !isImage) {
      throw new ValidationError(
        'Unsupported file format. Only PDF documents and images (.jpg, .jpeg, .png, .webp) are supported.'
      );
    }

    // Validate size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new ValidationError('File size exceeds the 20MB limit');
    }

    const documentTitle = dto.title?.trim() || file.originalname.replace(/\.[^/.]+$/, '').trim();
    const documentSubject = dto.subject?.trim() || 'General';
    const determinedFileType = isImage ? 'image' : 'pdf';

    // 1. Upload raw file to storage (Cloudinary or local dev fallback)
    const uploadResult = await uploadFileBuffer(file.buffer, file.originalname);

    // 2. Create document record with 'processing' status
    const doc = await DocumentModel.create({
      userId: new Types.ObjectId(userId),
      title: documentTitle,
      subject: documentSubject,
      fileType: determinedFileType,
      fileUrl: uploadResult.url,
      status: 'processing',
      chunkCount: 0,
      createdAt: new Date(),
    });

    // 3. Kick off extraction / OCR asynchronously (DO NOT AWAIT - return response immediately)
    setImmediate(() => {
      if (isImage) {
        ocrService.processImage(doc._id, file.buffer, file.mimetype).catch((err) => {
          console.error(`Unhandled error in async image OCR for ${doc._id}:`, err);
        });
      } else {
        extractionService.processPdf(doc._id, file.buffer).catch((err) => {
          console.error(`Unhandled error in async PDF extraction for ${doc._id}:`, err);
        });
      }
    });

    return doc;
  }

  /**
   * Generates a structured study primer for any academic topic without requiring an uploaded file.
   *
   * Architectural Decisions Explained:
   * 1. Markdown Headings for Clean Chunk Boundaries: The LLM prompt enforces clear Markdown headings
   *    (## 1. Core Definitions, ## 2. Key Mechanisms, ## 3. Common Pitfalls, ## 4. Worked Examples).
   *    When processed by chunkTextWithTiktoken, these natural conceptual boundaries prevent key definitions
   *    from getting sliced in half mid-sentence.
   * 2. Pipeline Reuse (DRY): Reuses `extractionService.ingestExtractedText()` directly so that
   *    chunking (~400 tokens, 50-token overlap), vector embedding generation, and MongoDB storage
   *    remain 100% identical across PDFs, Images, and Primers.
   * 3. Graceful Failure Lifecycle: If generation or vectorization fails, the document status is
   *    explicitly marked 'failed' with errorReason rather than leaving orphaned records in 'processing'.
   */
  public async createPrimer(userId: string, dto: CreatePrimerDto): Promise<IDocument> {
    const rawTopic = dto.topic?.trim();
    if (!rawTopic || rawTopic.length < 2) {
      throw new ValidationError('Topic must be at least 2 characters long.');
    }
    if (rawTopic.length > 150) {
      throw new ValidationError('Topic title cannot exceed 150 characters.');
    }

    const sanitizedTopic = llmService.sanitizeUserInput(rawTopic);
    const sanitizedSubject = dto.subject?.trim()
      ? llmService.sanitizeUserInput(dto.subject.trim().slice(0, 100))
      : 'General';

    // 1. Create document entry with 'processing' status
    const doc = await DocumentModel.create({
      userId: new Types.ObjectId(userId),
      title: `${sanitizedTopic} (Study Primer)`,
      subject: sanitizedSubject,
      fileType: 'primer',
      fileUrl: 'internal://primer',
      status: 'processing',
      chunkCount: 0,
      createdAt: new Date(),
    });

    // 2. Run LLM generation and vectorization asynchronously without blocking HTTP response
    setImmediate(async () => {
      try {
        const initialCheck = await DocumentModel.findById(doc._id).select('isDeleted').lean();
        if (!initialCheck || initialCheck.isDeleted) {
          console.warn(`[primer] Aborting primer generation: Document ${doc._id} not found or marked deleted.`);
          return;
        }

        const systemPrompt = `You are an elite university professor and curriculum author.
Your task is to generate a comprehensive, highly structured academic study primer for students.
Structure your notes with clear Markdown headings (##), bullet points, and code/formula blocks:

## 1. Executive Summary & Core Definitions
Define key terms, fundamental equations/theorems, and essential background context.

## 2. Key Architecture & Mechanisms
Explain how the system/concept works under the hood step-by-step.

## 3. Common Pitfalls & Exam Misconceptions
Highlight frequent student mistakes, subtle edge cases, and anti-patterns.

## 4. Worked Examples & Practical Scenarios
Provide concrete, step-by-step worked examples or code demonstrations illustrating the concepts.

Rules:
- Write detailed, academically rigorous material (around 1,000 to 1,500 words).
- Use clear Markdown formatting with prominent headings.
- Avoid generic conversational introductions or conclusions.`;

        const userPrompt = `Topic: ${sanitizedTopic}\nSubject: ${sanitizedSubject}\n\nGenerate the complete structured study primer now.`;

        let primerText = await llmService.generateCompletion({
          systemPrompt,
          userPrompt,
          temperature: 0.2,
          maxTokens: 3500,
        });

        // Offline dev mock fallback
        if (primerText.startsWith('[Dev Mode Response]')) {
          primerText =
            `# ${sanitizedTopic}: Comprehensive Study Primer\n\n` +
            `## 1. Executive Summary & Core Definitions\n` +
            `**${sanitizedTopic}** is a core conceptual foundation in ${sanitizedSubject}.\n\n` +
            `## 2. Key Architecture & Mechanisms\n` +
            `Under the hood, the system coordinates state transitions through deterministic processing.\n\n` +
            `## 3. Common Pitfalls & Exam Misconceptions\n` +
            `- **Pitfall 1:** Confusing synchronous blocking calls with event-driven background queues.\n` +
            `- **Pitfall 2:** Failing to validate partition boundaries under high load.\n\n` +
            `## 4. Worked Examples & Practical Scenarios\n` +
            `Consider an application processing requests with logarithmic asymptotic bounds O(log N).`;
        }

        // 3. Feed directly into shared chunking + embedding pipeline from Phase 1c
        await extractionService.ingestExtractedText(doc._id, primerText, 1);
      } catch (err) {
        console.error(`[primer] Generation/ingestion failed for document ${doc._id}:`, err);
        const docCheck = await DocumentModel.findById(doc._id).select('isDeleted').lean();
        if (docCheck && !docCheck.isDeleted) {
          await DocumentModel.findByIdAndUpdate(doc._id, {
            status: 'failed',
            errorReason: (err as Error).message || 'Study primer generation failed.',
          });
        }
      }
    });

    return doc;
  }

  /**
   * Lists all documents belonging to a user, sorted by most recent first.
   */
  public async getUserDocuments(userId: string): Promise<IDocument[]> {
    return DocumentModel.find({
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    })
      .select('-extractedText')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Retrieves a single document by ID, rigorously verifying user ownership.
   */
  public async getDocumentById(userId: string, documentId: string): Promise<IDocument> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new ValidationError('Invalid document ID format');
    }

    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    }).exec();

    if (!doc) {
      throw new NotFoundError('Document not found or access denied');
    }

    return doc;
  }

  /**
   * Appends an AI-generated general knowledge concept to an existing study document/guide.
   *
   * Architectural Decisions Explained:
   * 1. Ownership & Boundary Check: Only the authenticated document owner can append to their document.
   * 2. Full Document Re-indexing: Rather than trying to surgically insert or re-embed a single chunk
   *    (which would cause semantic fragmentation and chunk boundary misalignment), the full document text
   *    is updated and re-processed through the Phase 1c pipeline.
   * 3. Idempotent Duplicate Guard: Checks if the trimmed text already exists in the document text to prevent
   *    students accidentally double-clicking or duplicate-appending the same explanation.
   * 4. Atomic Replacement & Rollback: Relies on `extractionService.ingestExtractedText` which snapshots
   *    existing chunks and ensures zero loss if an embedding API error occurs.
   */
  public async appendSection(
    userId: string,
    documentId: string,
    text: string
  ): Promise<IDocument> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new ValidationError('Invalid document ID format');
    }

    const trimmedText = text?.trim();
    if (!trimmedText) {
      throw new ValidationError('Text to append cannot be empty.');
    }

    if (trimmedText.length > 50000) {
      throw new ValidationError('Text to append exceeds 50,000 characters limit.');
    }

    // 1. Verify document exists and belongs to the current user, fetching full extractedText
    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    })
      .select('+extractedText')
      .exec();

    if (!doc) {
      throw new NotFoundError('Document not found or access denied');
    }

    if (doc.status !== 'ready') {
      throw new ValidationError(
        `Cannot append to document while status is '${doc.status}'. Document must be 'ready'.`
      );
    }

    // 2. Retrieve existing source text or reconstruct from chunks if missing
    let currentText = doc.extractedText?.trim() || '';
    if (!currentText) {
      const existingChunks = await ChunkModel.find({ documentId: doc._id })
        .sort({ 'metadata.chunkIndex': 1 })
        .lean()
        .exec();
      currentText = existingChunks.map((c) => c.text).join('\n\n');
    }

    // 3. Simple duplicate guard: check if this text has already been appended
    if (currentText.includes(trimmedText)) {
      throw new ValidationError('This explanation has already been appended to this study guide.');
    }

    // 4. Format supplementary section with Markdown headers for chunk alignment
    const updatedText = `${currentText}\n\n---\n\n## Supplementary Study Guide Note\n\n${trimmedText}\n`;

    // 5. Re-run Phase 1c chunking + embedding pipeline against the entire updated text
    await extractionService.ingestExtractedText(doc._id, updatedText, 1, {
      updatedAt: new Date(),
    });

    // 6. Return the refreshed document
    const updatedDoc = await DocumentModel.findById(doc._id).exec();
    if (!updatedDoc) {
      throw new NotFoundError('Failed to retrieve updated document');
    }

    return updatedDoc;
  }

  /**
   * Deletes a study document and cascades deletion to vector chunks, and optionally
   * to associated quizzes, attempts, and recalculated topic mastery.
   *
   * Architectural Decisions Explained:
   * 1. Strict Ownership Enforcement: Verifies documentId belongs to the requesting userId before
   *    executing any mutation.
   * 2. Cascade by Default with History Preservation Opt-out:
   *    - When preserveHistory is false (default): Deletes the document, its vector chunks,
   *      any Quiz documents where sourceDocumentIds contains this document, and all associated
   *      QuizAttempts. Then re-derives rolling accuracy for all affected topicTags via recalculateTopicMastery.
   *    - When preserveHistory is true: Deletes only the document and chunks, leaving quizzes, attempts,
   *      and analytics untouched.
   * 3. Transaction Safety with Standalone Fallback:
   *    Executes the deletion within a MongoDB multi-document transaction session if supported by the cluster
   *    (e.g., MongoDB Atlas / replica sets). If the deployment is a local standalone MongoDB instance without
   *    replica set support, gracefully falls back to sequential deletion so operations never fail arbitrarily.
   * 4. Single Mutation Point for Mastery:
   *    Delegates directly to recalculateTopicMastery, keeping all mastery calculation and pruning logic in
   *    one single source of truth without duplication.
   */
  public async deleteDocument(
    userId: string,
    documentId: string,
    preserveHistory: boolean = false
  ): Promise<DeleteDocumentResult> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new ValidationError('Invalid document ID format');
    }

    const userObjectId = new Types.ObjectId(userId);
    const docObjectId = new Types.ObjectId(documentId);

    // Ownership check: Verify document belongs to the requesting user and is not already deleted
    const doc = await DocumentModel.findOne({
      _id: docObjectId,
      userId: userObjectId,
      isDeleted: { $ne: true },
    });

    if (!doc) {
      throw new NotFoundError('Document not found or access denied');
    }

    // Immediately flag document as deleted to abort any in-flight background processing tasks
    await DocumentModel.findByIdAndUpdate(docObjectId, { $set: { isDeleted: true } });

    // Branch 1: History preserved (opt-out of cascade)
    if (preserveHistory) {
      const chunkDeleteResult = await ChunkModel.deleteMany({ documentId: doc._id });
      await DocumentModel.deleteOne({ _id: doc._id });

      console.log(
        `[document] Deleted document ${documentId} (userId: ${userId}) preserving quiz history. Deleted ${chunkDeleteResult.deletedCount} chunks.`
      );

      return {
        message:
          'Document deleted successfully. Related quizzes, attempts, and topic scores were preserved.',
        deletedDocumentId: documentId,
        deletedDocumentTitle: doc.title,
        preservedHistory: true,
        deletedChunksCount: chunkDeleteResult.deletedCount || 0,
        deletedQuizzesCount: 0,
        deletedAttemptsCount: 0,
        affectedTopicsCount: 0,
        affectedTopicTags: [],
      };
    }

    // Branch 2: Cascade by default
    // 1. Identify all related quizzes belonging to this user that reference this document
    const relatedQuizzes = await QuizModel.find({
      userId: userObjectId,
      sourceDocumentIds: doc._id,
    }).exec();

    const relatedQuizIds = relatedQuizzes.map((q) => q._id);

    // 2. Identify all quiz attempts for these quizzes
    const relatedAttempts =
      relatedQuizIds.length > 0
        ? await QuizAttemptModel.find({
            userId: userObjectId,
            quizId: { $in: relatedQuizIds },
          }).exec()
        : [];

    // 3. Collect affected topic tags before records are deleted
    const affectedTopicsSet = new Set<string>();
    for (const quiz of relatedQuizzes) {
      for (const question of quiz.questions) {
        if (question.topicTag && question.topicTag.trim()) {
          affectedTopicsSet.add(question.topicTag.trim());
        }
      }
    }
    for (const attempt of relatedAttempts) {
      for (const topicResult of attempt.perTopicResult) {
        if (topicResult.topicTag && topicResult.topicTag.trim()) {
          affectedTopicsSet.add(topicResult.topicTag.trim());
        }
      }
    }
    const affectedTopicTags = Array.from(affectedTopicsSet);

    // 4. Execute atomic deletion within a transaction if supported, else fallback gracefully
    let deletedChunksCount = 0;
    let deletedQuizzesCount = 0;
    let deletedAttemptsCount = 0;

    let session: mongoose.ClientSession | null = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch {
      // Standalone MongoDB without replica set
      session = null;
      useTransaction = false;
    }

    try {
      if (useTransaction && session) {
        try {
          const chunkRes = await ChunkModel.deleteMany({ documentId: doc._id }, { session });
          deletedChunksCount = chunkRes.deletedCount || 0;

          if (relatedQuizIds.length > 0) {
            const attemptRes = await QuizAttemptModel.deleteMany(
              { quizId: { $in: relatedQuizIds } },
              { session }
            );
            deletedAttemptsCount = attemptRes.deletedCount || 0;

            const quizRes = await QuizModel.deleteMany(
              { _id: { $in: relatedQuizIds } },
              { session }
            );
            deletedQuizzesCount = quizRes.deletedCount || 0;
          }

          await DocumentModel.deleteOne({ _id: doc._id }, { session });
          await session.commitTransaction();
        } catch (txError) {
          await session.abortTransaction();
          const errorMsg = (txError as Error).message || '';
          if (
            errorMsg.includes('replica set') ||
            errorMsg.includes('Transaction numbers are only allowed')
          ) {
            console.warn(
              '[document] Standalone MongoDB detected. Falling back to non-transactional cascade deletion.'
            );
            useTransaction = false;
          } else {
            throw txError;
          }
        }
      }

      // Fallback if transaction was not supported
      if (!useTransaction) {
        const chunkRes = await ChunkModel.deleteMany({ documentId: doc._id });
        deletedChunksCount = chunkRes.deletedCount || 0;

        if (relatedQuizIds.length > 0) {
          const attemptRes = await QuizAttemptModel.deleteMany({
            quizId: { $in: relatedQuizIds },
          });
          deletedAttemptsCount = attemptRes.deletedCount || 0;

          const quizRes = await QuizModel.deleteMany({
            _id: { $in: relatedQuizIds },
          });
          deletedQuizzesCount = quizRes.deletedCount || 0;
        }

        await DocumentModel.deleteOne({ _id: doc._id });
      }
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    // 5. Call recalculateTopicMastery for each affected topic tag
    for (const tag of affectedTopicTags) {
      try {
        await recalculateTopicMastery(userId, tag);
      } catch (recalcError) {
        console.error(
          `[document] Error recalculating mastery for topic "${tag}" (userId: ${userId}):`,
          recalcError
        );
      }
    }

    console.log(
      `[document] Cascade deleted document ${documentId}: ${deletedChunksCount} chunks, ${deletedQuizzesCount} quizzes, ${deletedAttemptsCount} attempts, ${affectedTopicTags.length} topics updated/pruned.`
    );

    const message =
      deletedQuizzesCount > 0
        ? `Document deleted along with ${deletedQuizzesCount} related quiz${deletedQuizzesCount === 1 ? '' : 'zes'} and ${deletedAttemptsCount} attempt${deletedAttemptsCount === 1 ? '' : 's'}. Associated topic mastery scores were recalculated.`
        : 'Document and vector chunks deleted successfully.';

    return {
      message,
      deletedDocumentId: documentId,
      deletedDocumentTitle: doc.title,
      preservedHistory: false,
      deletedChunksCount,
      deletedQuizzesCount,
      deletedAttemptsCount,
      affectedTopicsCount: affectedTopicTags.length,
      affectedTopicTags,
    };
  }

  /**
   * Manually re-triggers extraction, chunking, and embedding for a document currently in 'failed' status.
   * Reuses the existing ingestion pipeline functions directly without duplicating chunking/embedding logic.
   */
  public async reprocessDocument(userId: string, documentId: string): Promise<IDocument> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new ValidationError('Invalid document ID format');
    }

    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    }).select('+extractedText');

    if (!doc) {
      throw new NotFoundError('Document not found or access denied');
    }

    if (doc.status !== 'failed') {
      throw new ValidationError(
        `Only documents in 'failed' status can be reprocessed. Current status is '${doc.status}'.`
      );
    }

    // Reset status to processing and clear errorReason
    doc.status = 'processing';
    doc.errorReason = undefined;
    doc.updatedAt = new Date();
    await doc.save();

    // Trigger async ingestion pipeline reusing existing functions
    setImmediate(async () => {
      try {
        const freshDoc = await DocumentModel.findById(doc._id).select('isDeleted').lean();
        if (!freshDoc || freshDoc.isDeleted) {
          console.warn(`[reprocess] Aborting: Document ${doc._id} was deleted before reprocessing started.`);
          return;
        }

        // Case A: Primer document
        if (doc.fileType === 'primer') {
          if (doc.extractedText && doc.extractedText.trim()) {
            await extractionService.ingestExtractedText(doc._id, doc.extractedText, 1);
            return;
          }

          const cleanTopic = doc.title.replace(/\s*\(Study Primer\)\s*$/, '').trim();
          const systemPrompt = `You are an elite university professor and curriculum author.
Your task is to generate a comprehensive, highly structured academic study primer for students.
Structure your notes with clear Markdown headings (##), bullet points, and code/formula blocks:

## 1. Executive Summary & Core Definitions
Define key terms, fundamental equations/theorems, and essential background context.

## 2. Key Architecture & Mechanisms
Explain how the system/concept works under the hood step-by-step.

## 3. Common Pitfalls & Exam Misconceptions
Highlight frequent student mistakes, subtle edge cases, and anti-patterns.

## 4. Worked Examples & Practical Scenarios
Provide concrete, step-by-step worked examples or code demonstrations illustrating the concepts.

Rules:
- Write detailed, academically rigorous material (around 1,000 to 1,500 words).
- Use clear Markdown formatting with prominent headings.
- Avoid generic conversational introductions or conclusions.`;

          const userPrompt = `Topic: ${cleanTopic}\nSubject: ${doc.subject || 'General'}\n\nGenerate the complete structured study primer now.`;

          let primerText = await llmService.generateCompletion({
            systemPrompt,
            userPrompt,
            temperature: 0.2,
            maxTokens: 3500,
          });

          if (primerText.startsWith('[Dev Mode Response]')) {
            primerText =
              `# ${cleanTopic}: Comprehensive Study Primer\n\n` +
              `## 1. Executive Summary & Core Definitions\n` +
              `**${cleanTopic}** is a core conceptual foundation in ${doc.subject || 'General'}.\n\n` +
              `## 2. Key Architecture & Mechanisms\n` +
              `Under the hood, the system coordinates state transitions through deterministic processing.\n\n` +
              `## 3. Common Pitfalls & Exam Misconceptions\n` +
              `- **Pitfall 1:** Confusing synchronous blocking calls with event-driven background queues.\n` +
              `- **Pitfall 2:** Failing to validate partition boundaries under high load.\n\n` +
              `## 4. Worked Examples & Practical Scenarios\n` +
              `Consider an application processing requests with logarithmic asymptotic bounds O(log N).`;
          }

          await extractionService.ingestExtractedText(doc._id, primerText, 1);
          return;
        }

        // Case B: PDF or Image
        // If extracted text was already stored, reuse ingestExtractedText directly
        if (doc.extractedText && doc.extractedText.trim()) {
          await extractionService.ingestExtractedText(doc._id, doc.extractedText, 1);
          return;
        }

        // Retrieve file buffer from local storage or remote URL
        let fileBuffer: Buffer | null = null;
        if (doc.fileUrl.startsWith('/uploads/')) {
          const localPath = path.join(process.cwd(), doc.fileUrl.replace(/^\//, ''));
          if (fs.existsSync(localPath)) {
            fileBuffer = fs.readFileSync(localPath);
          }
        } else if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
          const response = await fetch(doc.fileUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
          }
        }

        if (!fileBuffer) {
          throw new Error('Original file could not be retrieved from storage for reprocessing.');
        }

        if (doc.fileType === 'image') {
          await ocrService.processImage(doc._id, fileBuffer, 'image/jpeg');
        } else {
          await extractionService.processPdf(doc._id, fileBuffer);
        }
      } catch (err) {
        console.error(`[reprocess] Failed reprocessing document ${doc._id}:`, err);
        const check = await DocumentModel.findById(doc._id).select('isDeleted').lean();
        if (check && !check.isDeleted) {
          await DocumentModel.findByIdAndUpdate(doc._id, {
            status: 'failed',
            errorReason: (err as Error).message || 'Reprocessing failed.',
          });
        }
      }
    });

    return doc;
  }
}

export const documentService = new DocumentService();
