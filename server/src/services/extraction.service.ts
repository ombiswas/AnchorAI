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
      if (!doc) {
        throw new Error(`Document ${documentId} not found in database`);
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

      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorReason: errorMessage,
      });
    }
  }

  /**
   * Shared chunking + embedding + vector storage pipeline.
   * Feeds both PDF and OCR image text into token-aware chunking, batch embeddings,
   * MongoDB vector storage, and updates the document status to 'ready'.
   */
  public async ingestExtractedText(
    documentId: string | Types.ObjectId,
    rawText: string,
    pageCount = 1,
    extraUpdates: ExtraIngestionUpdates = {}
  ): Promise<void> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found in database`);
    }

    // 1. Clean extracted text using heuristic cleaner
    const cleaned = cleanExtractedText(rawText);

    if (!cleaned.trim()) {
      throw new Error('Processed document text is empty after cleaning.');
    }

    // 2. Idempotency: Remove existing chunks if re-processing this document
    await ChunkModel.deleteMany({ documentId: doc._id });

    // 3. Token-aware chunking (~400 tokens with ~50 token overlap)
    const tokenChunks = chunkTextWithTiktoken(cleaned, {
      chunkSize: 400,
      chunkOverlap: 50,
    });

    console.log(
      `[chunking] Document ${documentId} split into ${tokenChunks.length} chunks (from ${pageCount} pages)`
    );

    // 4. Generate vector embeddings in batches via OpenAI text-embedding-3-small
    const chunkTexts = tokenChunks.map((c) => c.text);
    const { embeddings, totalTokens } = await embeddingService.generateBatchEmbeddings(chunkTexts);

    // 5. Assemble and insert chunks with embeddings into MongoDB
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

    // 6. Update Document status to ready with chunk count, token usage, and optional OCR metadata
    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'ready',
      extractedText: cleaned,
      chunkCount: tokenChunks.length,
      totalTokensUsed: totalTokens,
      errorReason: undefined,
      ...extraUpdates,
    });

    console.log(
      `[ingestion] Complete for document ${documentId}: ${tokenChunks.length} chunks stored, ${totalTokens} tokens used`
    );
  }
}

export const extractionService = new ExtractionService();
