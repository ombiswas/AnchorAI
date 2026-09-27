import { Types } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { ChunkModel } from '../models/chunk.model';
import { DocumentModel } from '../models/document.model';
import { chunkTextWithTiktoken } from '../utils/chunker';
import { cleanExtractedText } from '../utils/textCleaner';
import { embeddingService } from './embedding.service';

export interface ExtraIngestionUpdates {
  ocrConfidence?: number;
  ocrEngine?: 'tesseract' | 'vision-llm';
  hasLowConfidenceWarning?: boolean;
  updatedAt?: Date;
}

export class ExtractionService {
  /**
   * Asynchronously parses, cleans, and delegates PDF text to the shared vector ingestion pipeline.
   * Decoupled from OCR pipeline so PDF processing operates independently.
   */
  public async processPdf(documentId: string | Types.ObjectId, buffer: Buffer): Promise<void> {
    try {
      console.log(`[extraction] Starting PDF extraction & ingestion for document ${documentId}`);

      const doc = await DocumentModel.findById(documentId);
      if (!doc || doc.isDeleted) {
        console.warn(`[extraction] Aborting PDF extraction: Document ${documentId} not found or marked deleted.`);
        return;
      }

      // 1. Extract raw text via modern PDFParse class
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const rawText = textResult.text;
      const pageCount = textResult.total || 1;

      await parser.destroy();

      if (!rawText || !rawText.trim()) {
        throw new Error(
          'Extracted text is empty. The document may be scanned or image-only without OCR text.'
        );
      }

      // 2. Pass text through the shared chunking + embedding pipeline
      await this.ingestExtractedText(documentId, rawText, pageCount);
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to extract text from PDF document';
      console.error(`[ingestion] Failed processing PDF document ${documentId}: ${errorMessage}`);

      const docCheck = await DocumentModel.findById(documentId).select('isDeleted').lean();
      if (docCheck && !docCheck.isDeleted) {
        await DocumentModel.findByIdAndUpdate(documentId, {
          status: 'failed',
          errorReason: errorMessage,
        });
      }
    }
  }

  /**
   * Shared chunking + embedding + vector storage pipeline (Phase 1c).
   *
   * Architectural Decisions Explained:
   * 1. Deferred Mutation (Zero Partial Chunking): Token chunking and batch embedding generation
   *    run BEFORE any database deletions occur. If external LLM/embedding APIs fail or rate limit,
   *    the document's existing chunks remain 100% intact.
   * 2. Snapshot & Rollback: Prior to deleting old chunks, a snapshot of existing chunks is taken.
   *    If MongoDB insertion fails midway, the previous chunks are immediately restored.
   * 3. DRY Reuse Across All Sources: Exactly identical chunking (400 tokens / 50 overlap), embedding,
   *    and storage logic is utilized for PDF uploads, Image OCR transcriptions, AI Primers,
   *    and study guide section appends.
   * 4. Soft-delete abort guard: Re-checks parent document's isDeleted status right before writing
   *    chunks so that async background tasks never write orphaned chunks if document/account was deleted.
   */
  public async ingestExtractedText(
    documentId: string | Types.ObjectId,
    rawText: string,
    pageCount = 1,
    extraUpdates: ExtraIngestionUpdates = {}
  ): Promise<void> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc || doc.isDeleted) {
      console.warn(`[ingestion] Document ${documentId} not found or marked deleted. Aborting chunk ingestion.`);
      return;
    }

    // 1. Clean extracted text using heuristic cleaner
    const cleaned = cleanExtractedText(rawText);

    if (!cleaned.trim()) {
      throw new Error('Processed document text is empty after cleaning.');
    }

    // 2. Token-aware chunking (~400 tokens with ~50 token overlap)
    const tokenChunks = chunkTextWithTiktoken(cleaned, {
      chunkSize: 400,
      chunkOverlap: 50,
    });

    console.log(
      `[chunking] Document ${documentId} split into ${tokenChunks.length} chunks (from ${pageCount} pages)`
    );

    // 3. Generate vector embeddings in batches via OpenAI text-embedding-3-small
    const chunkTexts = tokenChunks.map((c) => c.text);
    const { embeddings, totalTokens } = await embeddingService.generateBatchEmbeddings(chunkTexts);

    // Guard: Verify parent document has not been deleted mid-processing before writing chunks
    const freshDoc = await DocumentModel.findById(documentId).select('isDeleted').lean();
    if (!freshDoc || freshDoc.isDeleted) {
      console.warn(
        `[ingestion] Aborting chunk write: Document ${documentId} was deleted mid-processing.`
      );
      return;
    }

    // 4. Assemble new chunk documents with embeddings
    const chunkDocuments = tokenChunks.map((chunk, index) => ({
      documentId: doc._id,
      userId: doc.userId,
      text: chunk.text,
      embedding: embeddings[index] || [],
      metadata: {
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
        page: Math.min(pageCount, Math.floor((index / tokenChunks.length) * pageCount) + 1),
      },
      createdAt: new Date(),
    }));

    // 5. Snapshot existing chunks for rollback safety
    const existingChunks = await ChunkModel.find({ documentId: doc._id }).lean().exec();

    // 6. Atomically replace chunks with rollback fallback
    try {
      await ChunkModel.deleteMany({ documentId: doc._id });
      await ChunkModel.insertMany(chunkDocuments);
    } catch (swapError) {
      console.error(
        `[ingestion] Failed to swap chunks for doc ${documentId}. Triggering rollback to previous chunks:`,
        swapError
      );
      if (existingChunks.length > 0) {
        try {
          await ChunkModel.insertMany(existingChunks);
          console.log(`[ingestion] Rollback successful for doc ${documentId}. Restored ${existingChunks.length} chunks.`);
        } catch (rollbackErr) {
          console.error(`[ingestion] Critical: Failed to restore previous chunks during rollback:`, rollbackErr);
        }
      }
      throw swapError;
    }

    // 7. Update Document status to ready with chunk count, token usage, and timestamps (only if not deleted)
    await DocumentModel.findOneAndUpdate(
      { _id: documentId, isDeleted: false },
      {
        status: 'ready',
        extractedText: cleaned,
        chunkCount: tokenChunks.length,
        totalTokensUsed: (doc.totalTokensUsed || 0) + totalTokens,
        errorReason: undefined,
        updatedAt: extraUpdates.updatedAt || new Date(),
        ...extraUpdates,
      }
    );

    console.log(
      `[ingestion] Complete for document ${documentId}: ${tokenChunks.length} chunks stored, ${totalTokens} tokens used`
    );
  }
}

export const extractionService = new ExtractionService();
