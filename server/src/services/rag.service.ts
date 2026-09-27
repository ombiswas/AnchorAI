import { Types } from 'mongoose';
import { ChunkModel, IChunk } from '../models/chunk.model';
import { DocumentModel } from '../models/document.model';
import { cosineSimilarity } from '../utils/cosineSimilarity';
import { NotFoundError, ValidationError } from '../utils/errors';
import { embeddingService } from './embedding.service';
import { llmService } from './llm.service';

export type ChatResponseMode = 'grounded' | 'general';

/**
 * Cosine similarity threshold to determine whether any retrieved chunk provides
 * sufficient topical grounding for strict RAG answering.
 *
 * Rationale:
 * With OpenAI 'text-embedding-3-small' (or normalized embeddings), relevant semantic matches
 * typically score between 0.38 and 0.85+. Tangential or out-of-domain queries typically drop
 * below 0.30. Setting this threshold at 0.35 reliably distinguishes queries that have at least
 * partial grounding in the student's notes from questions requiring external knowledge.
 */
export const RAG_SIMILARITY_CONFIDENCE_THRESHOLD = 0.35;

/**
 * System prompt for strict document-grounded RAG mode.
 * Constrains the LLM to only state what is directly verifiable in the uploaded context.
 */
export const STRICT_RAG_SYSTEM_PROMPT = `You are AnchorAI, a precise and rigorous AI study companion.
Your task is to answer the student's question strictly and exclusively based on the lecture notes and document excerpts provided below.

Strict Grounding Rules:
1. Answer ONLY from the provided context. Do NOT use outside knowledge, speculations, or general assumptions.
2. If the answer cannot be found in or directly inferred from the provided context, you MUST state exactly: "I don't know based on your notes."
3. Cite page numbers or source references whenever citing specific claims or formulas.

Formatting & Structural Standards:
- Organize your answer with clear Markdown headings (e.g. "### Summary", "### Key Concepts", "### Mechanisms", "### Comparison").
- Maintain generous, clean paragraph spacing with blank lines between logical sections.
- Highlight key terminology and definitions with **bold text**, and use inline code or code blocks for formulas, syntax, or commands.
- Use structured bullet points with bold prefixes for lists, characteristics, or steps.
- Whenever comparing concepts, properties, trade-offs, or criteria, present them in a clean Markdown table (e.g. | Feature | Concept A | Concept B |).`;

/**
 * System prompt for fallback general-knowledge mode.
 * Explicitly directs the LLM to provide high-yield academic assistance without fabricating
 * document citations or pretending the content came from the student's materials.
 */
export const GENERAL_KNOWLEDGE_SYSTEM_PROMPT = `You are AnchorAI, an expert academic tutor and study companion.
The student is studying a document but asked a question that is NOT covered in their uploaded materials or lecture notes.

General Knowledge Rules:
1. Explain the requested concept thoroughly, accurately, and pedagogically using your general academic knowledge.
2. Clearly and honestly clarify at the start that this topic is not in their uploaded notes, but provide the complete conceptual explanation to assist their learning.
3. NEVER pretend, imply, or hallucinate that this explanation came from the student's uploaded document or lecture slides.
4. Do NOT include fake citations or page numbers.

Formatting & Structural Standards:
- Structure the response with clear Markdown headings (e.g. "### Overview & Core Definition", "### Key Mechanisms & Steps", "### Comparative Analysis", "### Practical Example").
- Maintain generous, clean paragraph spacing with blank lines between logical sections.
- Highlight key terminology and definitions with **bold text**, and use inline code or code blocks for formulas, syntax, or commands.
- Use structured bullet points with bold prefixes for lists, characteristics, or steps.
- Whenever comparing concepts, architectures, approaches, or trade-offs, present the comparison in a clean Markdown table (e.g. | Criterion | Option A | Option B |).`;

export interface CitedSource {
  chunkIndex: number;
  page?: number;
  textSnippet: string;
  similarityScore: number;
}

export interface RagResponse {
  answer: string;
  sources: CitedSource[];
  documentId: string;
  question: string;
  mode: ChatResponseMode;
  latency: {
    retrievalMs: number;
    llmMs: number;
    totalMs: number;
  };
}

export class RagService {
  /**
   * Performs semantic retrieval, prompt assembly, and grounded LLM completion.
   * If retrieved chunks do not clear the similarity threshold, falls back to
   * general-knowledge mode (if enabled) with an explicit fallback prompt.
   */
  public async askQuestion(
    userId: string,
    documentId: string,
    rawQuestion: string,
    allowFallback = true
  ): Promise<RagResponse> {
    const startTime = Date.now();

    if (!Types.ObjectId.isValid(documentId)) {
      throw new ValidationError('Invalid document ID format');
    }

    const question = llmService.sanitizeUserInput(rawQuestion);
    if (!question) {
      throw new ValidationError('Question cannot be empty');
    }

    // 1. Verify document exists and belongs to the current user
    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
    });

    if (!doc) {
      throw new NotFoundError('Document not found or access denied');
    }

    if (doc.status !== 'ready') {
      throw new ValidationError(
        `Document is currently '${doc.status}'. Chat is only available once text extraction is 'ready'.`
      );
    }

    // 2. Embed the user question
    const retrievalStart = Date.now();
    const queryEmbedding = await embeddingService.generateQueryEmbedding(question);

    // 3. Retrieve top-k=5 chunks ranked by cosine similarity
    const topChunks = await this.retrieveTopChunks(userId, documentId, queryEmbedding, 5);
    const retrievalMs = Date.now() - retrievalStart;

    const maxScore = topChunks.length > 0 ? (topChunks[0]?.score || 0) : 0;
    const hasGroundedContext =
      topChunks.length > 0 && maxScore >= RAG_SIMILARITY_CONFIDENCE_THRESHOLD;

    console.log(
      `[rag] Retrieved ${topChunks.length} chunks for doc ${documentId} in ${retrievalMs}ms (max similarity: ${maxScore.toFixed(3)})`
    );

    let answer = '';
    let mode: ChatResponseMode = 'grounded';
    let sources: CitedSource[] = [];
    const llmStart = Date.now();

    // 4. Branch strictly between grounded RAG and general-knowledge fallback
    if (hasGroundedContext) {
      // MODE: GROUNDED — At least one chunk cleared the similarity confidence threshold
      mode = 'grounded';
      console.log(
        `[chat] Response mode: GROUNDED (topScore: ${maxScore.toFixed(3)} >= threshold: ${RAG_SIMILARITY_CONFIDENCE_THRESHOLD}) for doc ${documentId}`
      );

      const contextBlocks = topChunks
        .map(
          (item, idx) =>
            `[Source ${idx + 1} | Page ${item.chunk.metadata.page || 'N/A'}]\n${item.chunk.text}`
        )
        .join('\n\n---\n\n');

      const userPrompt = `Document Excerpts:\n${contextBlocks}\n\nStudent Question:\n${question}\n\nFormatting Guidelines: Structure your answer using clear Markdown headings (###), clean paragraph spacing, bullet points, bold key terms, and Markdown tables if comparing concepts or attributes.`;

      answer = await llmService.generateCompletion({
        systemPrompt: STRICT_RAG_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.1, // low temperature for maximum grounding and factual adherence
      });

      sources = topChunks.map((c) => ({
        chunkIndex: c.chunk.metadata.chunkIndex,
        page: c.chunk.metadata.page,
        textSnippet: c.chunk.text.slice(0, 180) + (c.chunk.text.length > 180 ? '...' : ''),
        similarityScore: Math.round(c.score * 1000) / 1000,
      }));
    } else if (allowFallback) {
      // MODE: GENERAL FALLBACK — None cleared the threshold, but fallback is enabled
      mode = 'general';
      console.log(
        `[chat] Response mode: GENERAL (fallback triggered, topScore: ${maxScore.toFixed(3)} < threshold: ${RAG_SIMILARITY_CONFIDENCE_THRESHOLD}) for doc ${documentId}`
      );

      const userPrompt = `Current Document: "${doc.title}" (Subject: ${doc.subject || 'General'})\nStudent Question: ${question}\n\nFormatting Guidelines: Explain this concept clearly. Structure your response using clear Markdown headings (###), clean paragraph spacing, bullet points, bold key terms, and Markdown tables if comparing concepts, features, or trade-offs.`;

      answer = await llmService.generateCompletion({
        systemPrompt: GENERAL_KNOWLEDGE_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.4, // slightly higher temperature for helpful academic tutoring
      });

      // No fake sources or citations are returned in general-knowledge mode
      sources = [];
    } else {
      // Strict mode with no fallback permitted: state inability based on notes
      mode = 'grounded';
      console.log(
        `[chat] Response mode: GROUNDED (fallback disabled by user, topScore: ${maxScore.toFixed(3)} < threshold: ${RAG_SIMILARITY_CONFIDENCE_THRESHOLD}) for doc ${documentId}`
      );
      answer = "I don't know based on your notes. No relevant content was found in this document.";
      sources = [];
    }

    const llmMs = Date.now() - llmStart;
    const totalMs = Date.now() - startTime;

    console.log(
      `[rag] Question completed for doc ${documentId} [mode=${mode}]. Retrieval: ${retrievalMs}ms, LLM: ${llmMs}ms, Total: ${totalMs}ms`
    );

    return {
      answer,
      sources,
      documentId,
      question,
      mode,
      latency: {
        retrievalMs,
        llmMs,
        totalMs,
      },
    };
  }

  /**
   * Performs vector search with Atlas Vector Search or in-memory fallback
   */
  private async retrieveTopChunks(
    userId: string,
    documentId: string,
    queryEmbedding: number[],
    topK = 5
  ): Promise<Array<{ chunk: IChunk; score: number }>> {
    const userObjectId = new Types.ObjectId(userId);
    const docObjectId = new Types.ObjectId(documentId);

    // Try MongoDB Atlas Vector Search aggregation first
    try {
      const atlasResults = await ChunkModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: topK * 10,
            limit: topK,
            filter: {
              $and: [{ userId: { $eq: userObjectId } }, { documentId: { $eq: docObjectId } }],
            },
          },
        },
        {
          $project: {
            text: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]).exec();

      if (atlasResults && atlasResults.length > 0) {
        return atlasResults.map((item) => ({
          chunk: item as IChunk,
          score: item.score || 0,
        }));
      }
    } catch {
      // Atlas Vector Search is not active on local standalone MongoDB or index is building
      // Fallback gracefully to in-memory cosine similarity
    }

    // In-memory fallback for local dev: fetch all document chunks and rank by cosine similarity
    const documentChunks = await ChunkModel.find({
      userId: userObjectId,
      documentId: docObjectId,
    }).exec();

    const scored = documentChunks.map((chunk) => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const ragService = new RagService();
