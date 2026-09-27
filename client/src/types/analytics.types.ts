export interface WeakTopic {
  topicTag: string;
  rollingAccuracy: number;
  totalAttemptsCount: number;
  totalQuestionsSeen: number;
  lastAttemptedAt: string;
  status: 'critical' | 'moderate' | 'mastered';
}

export interface SubjectSummary {
  subject: string;
  documentCount: number;
  quizCount: number;
}

export interface RecentAttemptSummary {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  attemptedAt: string;
}

export interface DashboardStats {
  totalQuizzesTaken: number;
  averageScore: number;
  topicsTrackedCount: number;
  weakTopicsCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  subjects: SubjectSummary[];
  weakTopics: WeakTopic[];
  recentAttempts: RecentAttemptSummary[];
}

export interface GenerateFocusedQuizRequest {
  documentIds?: string[];
  questionCount?: number;
  targetTopics?: string[];
}
