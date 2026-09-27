import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IQuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topicTag: string;
}

export interface IQuiz extends Document {
  userId: Types.ObjectId;
  title: string;
  subject: string;
  sourceDocumentIds: Types.ObjectId[];
  questions: IQuizQuestion[];
  createdAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length === 4,
        message: 'A question must contain exactly 4 options',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: [true, 'Correct option index is required'],
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
    },
    topicTag: {
      type: String,
      required: [true, 'Topic tag is required'],
      trim: true,
    },
  },
  { _id: false }
);

const quizSchema = new Schema<IQuiz>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
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
    sourceDocumentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
      },
    ],
    questions: {
      type: [quizQuestionSchema],
      required: [true, 'Quiz questions are required'],
      validate: {
        validator: (v: IQuizQuestion[]) => Array.isArray(v) && v.length >= 1,
        message: 'Quiz must have at least one question',
      },
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

// Compound index for querying user quizzes ordered by creation date
quizSchema.index({ userId: 1, createdAt: -1 });

export const QuizModel: Model<IQuiz> = model<IQuiz>('Quiz', quizSchema);
