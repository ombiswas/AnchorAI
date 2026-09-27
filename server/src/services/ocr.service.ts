import { Types } from 'mongoose';
import OpenAI from 'openai';
import { createWorker } from 'tesseract.js';
import { config } from '../config';
import { DocumentModel } from '../models/document.model';
import { extractionService } from './extraction.service';

/**
 * OCR Engine Trade-off Analysis:
 *
 * 1. Tesseract.js:
 *    - Advantage: 100% free, runs entirely locally on server CPU with zero external API dependencies.
 *    - Limitation: Weaker on slanted, messy, or low-contrast handwritten notes; prone to character hallucinations.
 *
 * 2. Vision-Capable LLM (e.g. OpenAI gpt-4o-mini):
 *    - Advantage: State-of-the-art vision perception, seamlessly transcribes complex handwriting, cursive,
 *      whiteboard sketches, and mathematical formulas in context.
 *    - Limitation: Incurs external API token costs and higher latency.
 *
 * Architecture Decision:
 * We employ a tiered hybrid approach. First, we run Tesseract.js for zero-cost local transcription.
 * If Tesseract's confidence is acceptable (>= 60%) and generates meaningful content, we accept it for $0 cost.
 * If confidence is low (< 60%) or output is suspiciously brief, we seamlessly escalate to a vision LLM
 * to accurately transcribe the handwriting, and flag a warning if ambiguity remains.
 */
export class OcrService {
  private openai: OpenAI | null = null;
  private readonly confidenceThreshold = 60; // Percent confidence to consider Tesseract output reliable

  constructor() {
    if (config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }
  }

  /**
   * Processes an uploaded image (PNG, JPG, WebP) through the tiered OCR pipeline
   * and feeds the resulting text into the shared vector ingestion pipeline.
   */
  public async processImage(
    documentId: string | Types.ObjectId,
    buffer: Buffer,
    mimeType: string
  ): Promise<void> {
    try {
      console.log(`[ocr] Starting OCR processing for image document ${documentId}`);

      const doc = await DocumentModel.findById(documentId);
      if (!doc || doc.isDeleted) {
        console.warn(`[ocr] Aborting image OCR: Document ${documentId} not found or marked deleted.`);
        return;
      }

      // Step 1: Execute primary local OCR with Tesseract.js
      let tesseractText = '';
      let tesseractConfidence = 0;

      try {
        console.log('[ocr] Initializing Tesseract.js worker for local OCR...');
        const worker = await createWorker('eng');
        const ret = await worker.recognize(buffer);
        tesseractText = ret.data.text ? ret.data.text.trim() : '';
        tesseractConfidence = Math.round(ret.data.confidence || 0);
        await worker.terminate();

        console.log(
          `[ocr] Tesseract completed with confidence: ${tesseractConfidence}%, extracted ${tesseractText.length} characters`
        );
      } catch (tessErr) {
        console.warn('[ocr] Tesseract.js encountered an issue during recognition:', tessErr);
      }

      let finalText = tesseractText;
      let engineUsed: 'tesseract' | 'vision-llm' = 'tesseract';
      let confidenceScore = tesseractConfidence;
      let lowConfidenceWarning = false;

      // Step 2: Evaluate confidence threshold
      const isLowConfidence =
        tesseractConfidence < this.confidenceThreshold || tesseractText.length < 15;

      if (isLowConfidence) {
        console.log(
          `[ocr] Tesseract confidence (${tesseractConfidence}%) below threshold (${this.confidenceThreshold}%). Escalating to Vision LLM fallback...`
        );

        if (this.openai) {
          try {
            const visionText = await this.transcribeWithVisionLlm(buffer, mimeType);
            if (visionText && visionText.trim().length > 0) {
              finalText = visionText;
              engineUsed = 'vision-llm';
              confidenceScore = 90; // High confidence from vision multimodal synthesis
              lowConfidenceWarning = false;
              console.log('[ocr] Successfully transcribed handwritten notes using OpenAI Vision.');
            }
          } catch (visionErr) {
            console.error(
              '[ocr] Vision LLM fallback failed, reverting to Tesseract text:',
              visionErr
            );
            lowConfidenceWarning = true;
          }
        } else {
          console.warn(
            '[ocr] Vision LLM is not configured (no active OpenAI key). Using Tesseract output with low-confidence flag.'
          );
          lowConfidenceWarning = true;
        }
      }

      if (!finalText || !finalText.trim()) {
        throw new Error(
          'Could not detect any legible text in this image. Please upload a clearer photo of your notes.'
        );
      }

      // Step 3: Forward transcribed text into the shared chunking & embedding pipeline
      await extractionService.ingestExtractedText(documentId, finalText, 1, {
        ocrConfidence: confidenceScore,
        ocrEngine: engineUsed,
        hasLowConfidenceWarning: lowConfidenceWarning,
      });

      console.log(
        `[ocr] Completed image ingestion for doc ${documentId}. Engine: ${engineUsed}, Confidence: ${confidenceScore}%, LowConfidenceWarning: ${lowConfidenceWarning}`
      );
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to perform OCR on image document';
      console.error(`[ocr] Image ingestion failed for doc ${documentId}: ${errorMessage}`);

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
   * Sends image buffer to a vision-capable LLM (OpenAI gpt-4o-mini) for precise handwriting transcription.
   */
  private async transcribeWithVisionLlm(buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized');
    }

    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

    console.log('[ocr] Calling OpenAI gpt-4o-mini vision API for handwriting transcription...');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert OCR transcription assistant for students. Transcribe all text, equations, formulas, labels, and notes from this study document image as accurately and cleanly as possible. Preserve line breaks and bullet structure where applicable. Do not invent or summarize content. Return ONLY the transcribed text.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please transcribe all text visible in this image of study notes.',
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }
}

export const ocrService = new OcrService();
