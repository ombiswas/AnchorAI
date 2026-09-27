import { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { documentService } from '../services/document.service';

const appendSectionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { message: 'Text to append cannot be empty' })
    .max(50000, { message: 'Text cannot exceed 50,000 characters' }),
});

export class DocumentController {
  /**
   * POST /api/documents/upload
   */
  public async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.uploadDocument(
        req.userId as string,
        req.file as Express.Multer.File,
        req.body
      );
      res.status(201).json({
        message: 'Document uploaded successfully and extraction initiated',
        document: doc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/primer
   * Generates a structured academic study primer from a topic name.
   */
  public async createPrimer(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doc = await documentService.createPrimer(req.userId as string, req.body);
      res.status(201).json({
        message: 'Study primer generation initiated successfully',
        document: doc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents
   */
  public async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await documentService.getUserDocuments(req.userId as string);
      res.status(200).json({ documents });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id
   */
  public async getById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const document = await documentService.getDocumentById(
        req.userId as string,
        req.params.id as string
      );
      res.status(200).json({ document });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/append
   * Appends an AI general knowledge explanation to the document and re-indexes chunks.
   */
  public async appendSection(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = appendSectionSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        res.status(400).json({
          error: {
            message: issue ? issue.message : 'Invalid request payload',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      const { text } = parseResult.data;
      const documentId = req.params.id as string;

      const updatedDoc = await documentService.appendSection(
        req.userId as string,
        documentId,
        text
      );

      res.status(200).json({
        message: 'Section appended to study guide and re-embedded successfully',
        document: updatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/documents/:id
   * Removes a document, with cascade-by-default to associated quizzes, attempts,
   * and topic mastery scores unless preserveHistory=true is specified.
   */
  public async delete(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const preserveHistoryParam = req.query.preserveHistory;
      const preserveHistoryBody = req.body?.preserveHistory;
      const preserveHistory =
        preserveHistoryParam === 'true' ||
        preserveHistoryParam === '1' ||
        preserveHistoryBody === true;

      const result = await documentService.deleteDocument(
        req.userId as string,
        req.params.id as string,
        preserveHistory
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
