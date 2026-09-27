export interface AttemptRecord {
  totalQuestions: number;
  correctCount: number;
  attemptedAt: Date;
}

export interface MasteryCalculationResult {
  updatedRecentAttempts: AttemptRecord[];
  rollingAccuracy: number; // 0 - 100 integer percentage
  totalQuestionsSeen: number;
  totalCorrect: number;
}

export const DEFAULT_ROLLING_WINDOW = 5;

/**
 * Pure, testable function that computes rolling accuracy over the last N attempts for a given topic.
 *
 * @param previousAttempts - Existing list of recent attempt records for this topic
 * @param newAttempt - New attempt data with total questions and correct count
 * @param windowSize - Maximum number of recent attempts to keep (defaults to 5)
 * @returns Updated attempt list and rolling accuracy percentage (0-100)
 */
export function calculateRollingMastery(
  previousAttempts: AttemptRecord[] = [],
  newAttempt: { totalQuestions: number; correctCount: number; attemptedAt?: Date },
  windowSize: number = DEFAULT_ROLLING_WINDOW
): MasteryCalculationResult {
  const sanitizedNewAttempt: AttemptRecord = {
    totalQuestions: Math.max(0, newAttempt.totalQuestions),
    correctCount: Math.max(0, Math.min(newAttempt.correctCount, newAttempt.totalQuestions)),
    attemptedAt: newAttempt.attemptedAt || new Date(),
  };

  // Append new attempt and keep only the latest windowSize elements (ring buffer)
  const combined = [...previousAttempts, sanitizedNewAttempt];
  const updatedRecentAttempts =
    combined.length > windowSize ? combined.slice(combined.length - windowSize) : combined;

  // Compute rolling totals across the window
  const totalQuestionsSeen = updatedRecentAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
  const totalCorrect = updatedRecentAttempts.reduce((sum, a) => sum + a.correctCount, 0);

  const rollingAccuracy =
    totalQuestionsSeen > 0 ? Math.round((totalCorrect / totalQuestionsSeen) * 100) : 0;

  return {
    updatedRecentAttempts,
    rollingAccuracy,
    totalQuestionsSeen,
    totalCorrect,
  };
}
