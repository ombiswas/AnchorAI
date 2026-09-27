import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IQuestionAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface ITopicResult {
  topicTag: string;
  totalQuestions: number;
  correctCount: number;
  masteryPercentage: number;
}

export interface IQuizAttempt extends Document {
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: IQuestionAnswer[];
  score: number;
  perTopicResult: ITopicResult[];
  attemptedAt: Date;
}

const questionAnswerSchema = new Schema<IQuestionAnswer>(
  {
    questionIndex: {
      type: Number,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const topicResultSchema = new Schema<ITopicResult>(
  {
    topicTag: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    masteryPercentage: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    answers: {
      type: [questionAnswerSchema],
      required: [true, 'Answers array is required'],
    },
    score: {
      type: Number,
      required: [true, 'Score percentage is required'],
      min: 0,
      max: 100,
    },
    perTopicResult: {
      type: [topicResultSchema],
      required: [true, 'Per topic result breakdown is required'],
    },
    attemptedAt: {
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

// Compound index for querying user quiz attempts
quizAttemptSchema.index({ userId: 1, attemptedAt: -1 });
quizAttemptSchema.index({ quizId: 1, userId: 1 });

export const QuizAttemptModel: Model<IQuizAttempt> = model<IQuizAttempt>(
  'QuizAttempt',
  quizAttemptSchema
);
