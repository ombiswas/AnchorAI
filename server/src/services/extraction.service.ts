import { Types } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { DocumentModel } from '../models/document.model';
import { cleanExtractedText } from '../utils/textCleaner';

export class ExtractionService {
  /**
   * Asynchronously parses and cleans text from a PDF buffer, updating the Document status.
   */
  public async processPdf(documentId: string | Types.ObjectId, buffer: Buffer): Promise<void> {
    try {
      console.log(`[extraction] Starting extraction for document ${documentId}`);

      // Extract raw text via modern PDFParse class
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

      // Clean extracted text using heuristic cleaner
      const cleaned = cleanExtractedText(rawText);

      // Estimate initial chunk count (~400 tokens / words heuristic)
      const estimatedWords = cleaned.split(/\s+/).length;
      const initialChunkEstimate = Math.max(1, Math.ceil(estimatedWords / 400));

      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'ready',
        extractedText: cleaned,
        chunkCount: initialChunkEstimate,
        errorReason: undefined,
      });

      console.log(
        `[extraction] Successfully processed document ${documentId} (${pageCount} pages, ~${estimatedWords} words)`
      );
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to extract text from PDF document';
      console.error(`[extraction] Failed processing document ${documentId}: ${errorMessage}`);

      // Graceful error handling: ensure document is never left stuck in 'processing'
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorReason: errorMessage,
      });
    }
  }
}

export const extractionService = new ExtractionService();
