export interface QuizQuestionMasked {
  questionText: string;
  options: string[];
  topicTag: string;
}

export interface QuizQuestionFull extends QuizQuestionMasked {
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizForTaking {
  _id: string;
  title: string;
  subject: string;
  sourceDocumentIds: string[];
  questions: QuizQuestionMasked[];
}

export interface QuizFull {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  sourceDocumentIds: string[];
  questions: QuizQuestionFull[];
  createdAt: string;
  updatedAt: string;
}

export interface AnswerSubmission {
  questionIndex: number;
  selectedOptionIndex: number;
}

export interface EvaluatedAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface TopicResult {
  topicTag: string;
  totalQuestions: number;
  correctQuestions: number;
  masteryPercentage: number;
}

export interface QuizAttempt {
  _id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: EvaluatedAnswer[];
  perTopicResult: TopicResult[];
  attemptedAt: string;
}

export interface GenerateQuizRequest {
  documentIds: string[];
  questionCount?: number;
}

export interface GenerateQuizResponse {
  message: string;
  quiz: QuizFull;
}

export interface SubmitQuizResponse {
  message: string;
  attempt: QuizAttempt;
  quiz: QuizFull;
}

export interface QuizListResponse {
  quizzes: QuizFull[];
}
