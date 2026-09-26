import { Types } from 'mongoose';
import { ChunkModel, IChunk } from '../models/chunk.model';
import { DocumentModel } from '../models/document.model';
import { cosineSimilarity } from '../utils/cosineSimilarity';
import { NotFoundError, ValidationError } from '../utils/errors';
import { embeddingService } from './embedding.service';
import { llmService } from './llm.service';

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
  latency: {
    retrievalMs: number;
    llmMs: number;
    totalMs: number;
  };
}

export class RagService {
  /**
   * Performs semantic retrieval, prompt assembly, and grounded LLM completion.
   */
  public async askQuestion(
    userId: string,
    documentId: string,
    rawQuestion: string
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

    console.log(
      `[rag] Retrieved ${topChunks.length} chunks for doc ${documentId} in ${retrievalMs}ms`
    );

    // 4. Check if relevant context was found
    const hasRelevantContext = topChunks.length > 0 && (topChunks[0]?.score || 0) > 0.15;

    let answer = '';
    const llmStart = Date.now();

    if (!hasRelevantContext) {
      answer = "I don't know based on your notes. No relevant content was found in this document.";
    } else {
      // 5. Construct grounded prompt with strict constraints
      const contextBlocks = topChunks
        .map(
          (item, idx) =>
            `[Source ${idx + 1} | Page ${item.chunk.metadata.page || 'N/A'}]\n${item.chunk.text}`
        )
        .join('\n\n---\n\n');

      const systemPrompt = `You are AnchorAI, a precise and rigorous AI study companion.
Your task is to answer the student's question strictly and exclusively based on the lecture notes and document excerpts provided below.

Strict Grounding Rules:
1. Answer ONLY from the provided context. Do NOT use outside knowledge, speculations, or general assumptions.
2. If the answer cannot be found in or directly inferred from the provided context, you MUST state exactly: "I don't know based on your notes."
3. Cite page numbers or source references whenever citing specific claims or formulas.
4. Keep explanations clear, academic, and well-structured.`;

      const userPrompt = `Document Excerpts:\n${contextBlocks}\n\nStudent Question:\n${question}`;

      answer = await llmService.generateCompletion({
        systemPrompt,
        userPrompt,
        temperature: 0.1, // low temperature for maximum grounding and factual adherence
      });
    }

    const llmMs = Date.now() - llmStart;
    const totalMs = Date.now() - startTime;

    console.log(
      `[rag] Question answered for doc ${documentId}. Retrieval: ${retrievalMs}ms, LLM: ${llmMs}ms, Total: ${totalMs}ms`
    );

    const sources: CitedSource[] = topChunks.map((c) => ({
      chunkIndex: c.chunk.metadata.chunkIndex,
      page: c.chunk.metadata.page,
      textSnippet: c.chunk.text.slice(0, 180) + (c.chunk.text.length > 180 ? '...' : ''),
      similarityScore: Math.round(c.score * 1000) / 1000,
    }));

    return {
      answer,
      sources,
      documentId,
      question,
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
