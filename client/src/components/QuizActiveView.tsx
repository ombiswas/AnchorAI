import React, { useState } from 'react';
import { api } from '../lib/api';
import type { AnswerSubmission, QuizAttempt, QuizForTaking, QuizFull } from '../types/quiz.types';

interface QuizActiveViewProps {
  quiz: QuizForTaking;
  onQuit: () => void;
  onSubmitComplete: (result: { attempt: QuizAttempt; quiz: QuizFull }) => void;
}

export const QuizActiveView: React.FC<QuizActiveViewProps> = ({
  quiz,
  onQuit,
  onSubmitComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const triggerSubmit = () => {
    if (answeredCount < totalQuestions) {
      setShowConfirmModal(true);
    } else {
      executeSubmission();
    }
  };

  const executeSubmission = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const answersPayload: AnswerSubmission[] = quiz.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedOptionIndex: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
      }));

      const res = await api.quiz.submit(quiz._id, answersPayload);
      onSubmitComplete({ attempt: res.attempt, quiz: res.quiz });
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-600">
                {quiz.subject || 'Knowledge Evaluation'}
              </span>
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-xs text-neutral-500">
                {answeredCount} of {totalQuestions} answered
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">{quiz.title}</h1>
          </div>

          <button
            onClick={onQuit}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Quit Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between font-mono text-[11px] text-neutral-600">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Bubble Navigator */}
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
          {quiz.questions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex h-8 w-8 items-center justify-center rounded-md font-mono text-xs font-bold transition border ${
                  isCurrent
                    ? 'border-[#010120] bg-[#010120] text-white shadow-xs'
                    : isAnswered
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-900">
          {errorMsg}
        </div>
      )}

      {/* Active Question Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-7 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
            <span>🏷️</span>
            <span>{currentQuestion.topicTag || 'General'}</span>
          </span>
          <span className="font-mono text-xs text-neutral-500">Select one answer</span>
        </div>

        <h2 className="mt-4 text-lg font-semibold text-neutral-900 leading-snug">
          {currentQuestion.questionText}
        </h2>

        {/* Options */}
        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((optionText, optIdx) => {
            const isSelected = selectedAnswers[currentIndex] === optIdx;

            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`flex cursor-pointer items-start gap-3.5 rounded-lg border p-4 transition ${
                  isSelected
                    ? 'border-[#010120] bg-indigo-50/40 ring-1 ring-[#010120]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#010120] text-white'
                      : 'border border-neutral-300 bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {optionLetters[optIdx]}
                </div>
                <div className="pt-0.5 text-sm font-medium text-neutral-800 leading-relaxed">
                  {optionText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-5">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
          >
            &larr; Previous
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-2xs transition hover:bg-neutral-800"
              >
                Next &rarr;
              </button>
            ) : (
              <button
                onClick={triggerSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <span>Submit Quiz &rarr;</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal if Unanswered */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-950">Incomplete Quiz</h3>
            <p className="mt-2 text-xs text-neutral-600 leading-normal">
              You have answered {answeredCount} out of {totalQuestions} questions. Unanswered
              questions will be scored as incorrect. Are you sure you want to submit?
            </p>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50"
              >
                Review Answers
              </button>
              <button
                onClick={executeSubmission}
                className="rounded-md bg-emerald-600 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-700"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
