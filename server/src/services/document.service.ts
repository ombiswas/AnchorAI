import { Types } from 'mongoose';
import { uploadFileBuffer } from '../config/cloudinary';
import { DocumentModel, IDocument } from '../models/document.model';
import { NotFoundError, ValidationError } from '../utils/errors';
import { extractionService } from './extraction.service';
import { ocrService } from './ocr.service';

export interface UploadDocumentDto {
  title?: string;
  subject?: string;
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
   * Lists all documents belonging to a user, sorted by most recent first.
   */
  public async getUserDocuments(userId: string): Promise<IDocument[]> {
    return DocumentModel.find({ userId: new Types.ObjectId(userId) })
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
    }).exec();

    if (!doc) {
      throw new NotFoundError('Document not found or access denied');
    }

    return doc;
  }
}

export const documentService = new DocumentService();
