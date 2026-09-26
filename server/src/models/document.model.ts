import { Document, Model, Schema, Types, model } from 'mongoose';

export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface IDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  subject: string;
  fileType: string;
  fileUrl: string;
  status: DocumentStatus;
  chunkCount: number;
  extractedText?: string;
  errorReason?: string;
  createdAt: Date;
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
    chunkCount: {
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
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
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
