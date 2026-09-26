import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IChunkMetadata {
  page?: number;
  chunkIndex: number;
  tokenCount: number;
}

export interface IChunk extends Document {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  embedding: number[];
  metadata: IChunkMetadata;
  createdAt: Date;
}

const chunkSchema = new Schema<IChunk>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Chunk text is required'],
    },
    embedding: {
      type: [Number],
      required: [true, 'Vector embedding is required'],
      // 1536 dimensions for text-embedding-3-small
    },
    metadata: {
      page: {
        type: Number,
        required: false,
      },
      chunkIndex: {
        type: Number,
        required: true,
      },
      tokenCount: {
        type: Number,
        required: true,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound indexes for vector search filtering and user document cleanup
chunkSchema.index({ documentId: 1, userId: 1 });
chunkSchema.index({ userId: 1 });

export const ChunkModel: Model<IChunk> = model<IChunk>('Chunk', chunkSchema);
