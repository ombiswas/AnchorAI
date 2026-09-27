import React from 'react';
import type { QuizAttempt, QuizFull } from '../types/quiz.types';

interface QuizResultsViewProps {
  attempt: QuizAttempt;
  quiz: QuizFull;
  onRetake: () => void;
  onNewQuiz: () => void;
  onBackToLibrary: () => void;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({
  attempt,
  quiz,
  onRetake,
  onNewQuiz,
  onBackToLibrary,
}) => {
  const totalQuestions = quiz.questions.length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const scorePercent = attempt.score;

  // Rating badge and message
  const getRatingInfo = (score: number) => {
    if (score >= 90) {
      return {
        badge: 'Mastery Achieved',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        message: 'Outstanding! You have a solid grasp over this material.',
      };
    }
    if (score >= 70) {
      return {
        badge: 'Proficient',
        color: 'text-indigo-700 bg-indigo-50 border-indigo-300',
        message: 'Great job! A few concepts could use a quick review.',
      };
    }
    if (score >= 50) {
      return {
        badge: 'Developing',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        message: 'Moderate comprehension. Check the explanations below to reinforce weak spots.',
      };
    }
    return {
      badge: 'Needs Review',
      color: 'text-rose-700 bg-rose-50 border-rose-300',
      message: 'Keep going! Review the material and explanations to strengthen understanding.',
    };
  };

  const rating = getRatingInfo(scorePercent);
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Score Summary Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4 sm:pb-6">
          <div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 font-mono text-xs font-semibold ${rating.color}`}
            >
              {rating.badge}
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              Quiz Evaluation Results
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">{rating.message}</p>
          </div>

          <div className="flex items-center justify-between sm:flex-col sm:items-end">
            <div className="text-left sm:text-right">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
                {scorePercent}%
              </span>
              <p className="font-mono text-xs text-neutral-500">
                {correctCount} / {totalQuestions} Correct
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={onBackToLibrary}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-50 w-full sm:w-auto"
          >
            &larr; Back to Library
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              onClick={onRetake}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800 transition hover:bg-neutral-100 shadow-2xs text-center"
            >
              Retake Quiz
            </button>
            <button
              onClick={onNewQuiz}
              className="rounded-md bg-[#010120] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 shadow-2xs text-center"
            >
              Generate New Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Per-Topic Mastery Breakdown Card */}
      {attempt.perTopicResult && attempt.perTopicResult.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            Curriculum Breakdown
          </span>
          <h2 className="mt-0.5 text-base font-bold text-neutral-950">Per-Topic Mastery</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {attempt.perTopicResult.map((topic, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-semibold text-xs text-neutral-900">
                    {topic.topicTag}
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-800">
                    {topic.masteryPercentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      topic.masteryPercentage >= 75
                        ? 'bg-emerald-600'
                        : topic.masteryPercentage >= 50
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${topic.masteryPercentage}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-neutral-500">
                  <span>
                    {topic.correctQuestions} of {topic.totalQuestions} correct
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-neutral-950">Answer Review & Explanations</h2>
          <span className="font-mono text-xs text-neutral-500">
            {totalQuestions} Questions Evaluated
          </span>
        </div>

        {quiz.questions.map((question, qIdx) => {
          const evalAnswer = attempt.answers.find((a) => a.questionIndex === qIdx);
          const isCorrect = evalAnswer?.isCorrect ?? false;
          const userSelectedIndex = evalAnswer?.selectedOptionIndex ?? -1;

          return (
            <div
              key={qIdx}
              className={`rounded-xl border bg-white p-6 shadow-sm transition ${
                isCorrect ? 'border-neutral-200' : 'border-rose-200 bg-rose-50/10'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-500">Q{qIdx + 1}</span>
                  <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700">
                    {question.topicTag}
                  </span>
                </div>

                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
                    <svg
                      className="h-3.5 w-3.5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Correct (+1)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-rose-800">
                    <svg
                      className="h-3.5 w-3.5 text-rose-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Incorrect
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="mt-3 text-sm font-semibold text-neutral-950 leading-relaxed">
                {question.questionText}
              </h3>

              {/* Options Breakdown */}
              <div className="mt-4 space-y-2">
                {question.options.map((optText, optIdx) => {
                  const isUserSelection = userSelectedIndex === optIdx;
                  const isRightAnswer = question.correctOptionIndex === optIdx;

                  let optClass = 'border-neutral-200 bg-neutral-50/40 text-neutral-700';
                  let badgeText = '';

                  if (isRightAnswer) {
                    optClass =
                      'border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-400';
                    badgeText = 'Correct Answer';
                  } else if (isUserSelection && !isCorrect) {
                    optClass = 'border-rose-300 bg-rose-50 text-rose-950 ring-1 ring-rose-400';
                    badgeText = 'Your Choice';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`flex items-start justify-between rounded-lg border p-3 text-xs ${optClass}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono font-bold">{optionLetters[optIdx]}.</span>
                        <span>{optText}</span>
                      </div>
                      {badgeText && (
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 pl-2">
                          {badgeText}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {question.explanation && (
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    <span>💡</span>
                    <span>Explanation</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-700 leading-normal">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
