import { Types } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { ChunkModel } from '../models/chunk.model';
import { DocumentModel } from '../models/document.model';
import { chunkTextWithTiktoken } from '../utils/chunker';
import { cleanExtractedText } from '../utils/textCleaner';
import { embeddingService } from './embedding.service';

export class ExtractionService {
  /**
   * Asynchronously parses, cleans, chunks, embeds, and stores document vectors in MongoDB.
   */
  public async processPdf(documentId: string | Types.ObjectId, buffer: Buffer): Promise<void> {
    try {
      console.log(`[extraction] Starting extraction & ingestion for document ${documentId}`);

      const doc = await DocumentModel.findById(documentId);
      if (!doc) {
        throw new Error(`Document ${documentId} not found in database`);
      }

      // 1. Extract raw text via modern PDFParse class
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const rawText = textResult.text;
      const pageCount = textResult.total;

      await parser.destroy();

      if (!rawText || !rawText.trim()) {
        throw new Error(
          'Extracted text is empty. The document may be scanned or image-only without OCR text.'
        );
      }

      // 2. Clean extracted text using heuristic cleaner
      const cleaned = cleanExtractedText(rawText);

      // 3. Idempotency: Remove existing chunks if re-processing this document
      await ChunkModel.deleteMany({ documentId: doc._id });

      // 4. Token-aware chunking (~400 tokens with ~50 token overlap)
      const tokenChunks = chunkTextWithTiktoken(cleaned, {
        chunkSize: 400,
        chunkOverlap: 50,
      });

      console.log(
        `[chunking] Document ${documentId} split into ${tokenChunks.length} chunks (from ${pageCount} pages)`
      );

      // 5. Generate vector embeddings in batches via OpenAI text-embedding-3-small
      const chunkTexts = tokenChunks.map((c) => c.text);
      const { embeddings, totalTokens } =
        await embeddingService.generateBatchEmbeddings(chunkTexts);

      // 6. Assemble and insert chunks with embeddings into MongoDB
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

      await ChunkModel.insertMany(chunkDocuments);

      // 7. Update Document status to ready with chunk count and total tokens
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'ready',
        extractedText: cleaned,
        chunkCount: tokenChunks.length,
        totalTokensUsed: totalTokens,
        errorReason: undefined,
      });

      console.log(
        `[ingestion] Complete for document ${documentId}: ${tokenChunks.length} chunks stored, ${totalTokens} tokens used`
      );
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to extract text from PDF document';
      console.error(`[ingestion] Failed processing document ${documentId}: ${errorMessage}`);

      // Graceful error handling: ensure document is never left stuck in 'processing'
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorReason: errorMessage,
      });
    }
  }
}

export const extractionService = new ExtractionService();
