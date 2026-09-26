import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { documentService } from '../services/document.service';

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
}

export const documentController = new DocumentController();
