import React, { useState } from 'react';
import { api } from '../lib/api';
import type { StudyDocument } from '../types/document.types';
import type { QuizForTaking } from '../types/quiz.types';

interface QuizGeneratorModalProps {
  documents: StudyDocument[];
  preselectedDocId?: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizReady: (quiz: QuizForTaking) => void;
}

export const QuizGeneratorModal: React.FC<QuizGeneratorModalProps> = ({
  documents,
  preselectedDocId,
  isOpen,
  onClose,
  onQuizReady,
}) => {
  const readyDocs = documents.filter((d) => d.status === 'ready');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselectedDocId ? [preselectedDocId] : readyDocs.length > 0 ? [readyDocs[0]._id] : []
  );
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleDoc = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least one document.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);

      const res = await api.quiz.generate({
        documentIds: selectedIds,
        questionCount,
      });

      // Fetch the masked quiz suitable for taking
      const takingRes = await api.quiz.getForTaking(res.quiz._id);
      onQuizReady(takingRes.quiz);
      onClose();
    } catch (err) {
      setErrorMsg(
        (err as Error).message ||
          'Failed to generate quiz. Please check that documents contain text and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Phase 3 Assessment
              </span>
              <h2 className="text-base font-bold text-neutral-950">Generate Knowledge Quiz</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Document Selection */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Select Source Documents ({selectedIds.length} selected)
            </label>
            <p className="mt-0.5 text-xs text-neutral-600">
              AnchorAI will uniformly sample chunks across all selected material to create
              comprehensive questions.
            </p>

            <div className="mt-2.5 max-h-44 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50/50 p-2.5">
              {readyDocs.length === 0 ? (
                <p className="text-xs text-neutral-600 py-2 text-center">
                  No documents ready yet. Ingest documents first to generate quizzes.
                </p>
              ) : (
                readyDocs.map((doc) => {
                  const isChecked = selectedIds.includes(doc._id);
                  return (
                    <div
                      key={doc._id}
                      onClick={() => toggleDoc(doc._id)}
                      className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/60'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-neutral-900">
                            {doc.title}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-600">
                            {doc.subject || 'General'} · {doc.chunkCount} chunks
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Question Count Selection */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="quiz-question-count-input"
                className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700"
              >
                Number of Questions
              </label>
              <span className="font-mono text-[11px] font-semibold text-indigo-700">
                Max 15 questions
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 rounded-md py-2 font-mono text-xs font-bold transition border ${
                    questionCount === count
                      ? 'border-[#010120] bg-[#010120] text-white shadow-2xs'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {count} Qs
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="quiz-question-count-input"
                  type="number"
                  min={1}
                  max={15}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setQuestionCount(Math.min(15, Math.max(1, val)));
                    }
                  }}
                  className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 font-mono text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  placeholder="Custom count (1–15)"
                />
              </div>
              <span className="font-mono text-[11px] text-neutral-500">
                (Range: 1 – 15)
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-neutral-500 leading-normal">
              AnchorAI supports a maximum of <strong>15 questions</strong> per assessment to ensure comprehensive coverage without context dilution.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || readyDocs.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#010120] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {isGenerating ? (
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
                <span>Generating Quiz...</span>
              </>
            ) : (
              <span>Start Quiz &rarr;</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
