import { Document, Model, Schema, Types, model } from 'mongoose';

export type DocumentStatus = 'processing' | 'ready' | 'failed';
export type DocumentFileType = 'pdf' | 'image' | 'primer';

export interface IDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  subject: string;
  fileType: DocumentFileType;
  fileUrl: string;
  status: DocumentStatus;
  isDeleted: boolean;
  chunkCount: number;
  totalTokensUsed?: number;
  extractedText?: string;
  errorReason?: string;
  ocrConfidence?: number;
  ocrEngine?: 'tesseract' | 'vision-llm';
  hasLowConfidenceWarning?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
      type: String,
      required: false,
      default: 'General',
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      default: 'pdf',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      required: false,
      select: false, // Omit large text in list queries by default for performance
    },
    errorReason: {
      type: String,
      required: false,
    },
    ocrConfidence: {
      type: Number,
      required: false,
    },
    ocrEngine: {
      type: String,
      enum: ['tesseract', 'vision-llm'],
      required: false,
    },
    hasLowConfidenceWarning: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for querying user documents sorted by createdAt
documentSchema.index({ userId: 1, createdAt: -1 });

export const DocumentModel: Model<IDocument> = model<IDocument>('Document', documentSchema);
