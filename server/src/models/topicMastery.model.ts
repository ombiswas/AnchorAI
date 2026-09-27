import { Document, Model, Schema, Types, model } from 'mongoose';
import { AttemptRecord } from '../utils/masteryCalculator';

export interface ITopicMastery extends Document {
  userId: Types.ObjectId;
  topicTag: string;
  rollingAccuracy: number;
  recentAttempts: AttemptRecord[];
  totalAttemptsCount: number;
  lastAttemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attemptRecordSchema = new Schema<AttemptRecord>(
  {
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const topicMasterySchema = new Schema<ITopicMastery>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    topicTag: {
      type: String,
      required: [true, 'Topic tag is required'],
      trim: true,
    },
    rollingAccuracy: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    recentAttempts: {
      type: [attemptRecordSchema],
      default: [],
    },
    totalAttemptsCount: {
      type: Number,
      default: 0,
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique compound index: one mastery record per user per topic
topicMasterySchema.index({ userId: 1, topicTag: 1 }, { unique: true });

// Index for fast sorting by weakest topics
topicMasterySchema.index({ userId: 1, rollingAccuracy: 1 });

export const TopicMasteryModel: Model<ITopicMastery> = model<ITopicMastery>(
  'TopicMastery',
  topicMasterySchema
);
