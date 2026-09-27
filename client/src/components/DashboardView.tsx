import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardData } from '../types/analytics.types';
import type { QuizForTaking } from '../types/quiz.types';

interface DashboardViewProps {
  onStartQuiz: (quiz: QuizForTaking) => void;
  onNavigateToLibrary: () => void;
  refreshTrigger?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartQuiz,
  onNavigateToLibrary,
  refreshTrigger,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState<boolean>(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.analytics.getDashboard();
      setData(res.dashboard);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to load analytics dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshTrigger]);

  const handlePracticeWeakTopics = async (specificTopic?: string) => {
    try {
      setIsGeneratingPractice(true);
      setErrorMsg(null);

      const targetTopics = specificTopic
        ? [specificTopic]
        : data?.weakTopics?.filter((t) => t.rollingAccuracy < 75).map((t) => t.topicTag) || [];

      const res = await api.quiz.generateFocused({
        questionCount: 5,
        targetTopics: targetTopics.length > 0 ? targetTopics : undefined,
      });

      const maskedRes = await api.quiz.getForTaking(res.quiz._id);
      onStartQuiz(maskedRes.quiz);
    } catch (err) {
      setErrorMsg(
        (err as Error).message ||
          'Failed to generate focused practice quiz. Please ensure documents are uploaded.'
      );
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const handleReviewAttempt = async (quizId: string) => {
    try {
      setIsLoading(true);
      const maskedRes = await api.quiz.getForTaking(quizId);
      onStartQuiz(maskedRes.quiz);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-8">
        <svg
          className="h-8 w-8 animate-spin text-neutral-400"
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
        <p className="mt-3 font-mono text-xs text-neutral-600">Aggregating Mastery Metrics...</p>
      </div>
    );
  }

  const stats = data?.stats;
  const weakTopics = data?.weakTopics || [];
  const subjects = data?.subjects || [];
  const recentAttempts = data?.recentAttempts || [];
  const hasCriticalTopics = weakTopics.some((t) => t.rollingAccuracy < 75);

  return (
    <div className="space-y-8">
      {/* Top Banner / Call-to-action */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
                Phase 4 Analytics
              </span>
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-xs text-neutral-500">
                Incremental Rolling Aggregates
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              Curriculum Mastery & Diagnostics
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Track rolling accuracy over your latest quiz attempts and drill down into weak
              conceptual areas.
            </p>
          </div>

          <div className="flex items-center w-full sm:w-auto">
            <button
              onClick={() => handlePracticeWeakTopics()}
              disabled={isGeneratingPractice || (stats?.totalQuizzesTaken ?? 0) === 0}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#010120] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-50 shadow-2xs"
            >
              {isGeneratingPractice ? (
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
                  <span>Assembling Quiz...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="8" strokeWidth={1.8} />
                    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                    <line x1="12" y1="2" x2="12" y2="4" strokeWidth={1.8} strokeLinecap="round" />
                    <line x1="12" y1="20" x2="12" y2="22" strokeWidth={1.8} strokeLinecap="round" />
                    <line x1="2" y1="12" x2="4" y2="12" strokeWidth={1.8} strokeLinecap="round" />
                    <line x1="20" y1="12" x2="22" y2="12" strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                  <span>Practice Weak Topics</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3.5 border-t border-neutral-100 pt-5 sm:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 sm:p-3.5">
            <span className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-600 block truncate">
              Quizzes Done
            </span>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-neutral-950">
              {stats?.totalQuizzesTaken || 0}
            </div>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 sm:p-3.5">
            <span className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-800 block truncate">
              Average Score
            </span>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-indigo-700">
              {stats?.averageScore || 0}%
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 sm:p-3.5">
            <span className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800 block truncate">
              Topics Tracked
            </span>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-700">
              {stats?.topicsTrackedCount || 0}
            </div>
          </div>
          <div
            className={`rounded-lg border p-3 sm:p-3.5 ${
              (stats?.weakTopicsCount ?? 0) > 0
                ? 'border-rose-200 bg-rose-50/60'
                : 'border-neutral-200 bg-neutral-50/70'
            }`}
          >
            <span
              className={`font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider block truncate ${
                (stats?.weakTopicsCount ?? 0) > 0 ? 'text-rose-800' : 'text-neutral-600'
              }`}
            >
              Needs Review (&lt;75%)
            </span>
            <div
              className={`mt-1 font-mono text-xl sm:text-2xl font-bold ${
                (stats?.weakTopicsCount ?? 0) > 0 ? 'text-rose-700' : 'text-neutral-950'
              }`}
            >
              {stats?.weakTopicsCount || 0}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-900">
          {errorMsg}
        </div>
      )}

      {/* Weak Topics Curriculum Breakdown Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-600">
              Curriculum Health
            </span>
            <h2 className="mt-0.5 text-base font-bold text-neutral-950">
              Topics Ranked by Mastery (Weakest First)
            </h2>
          </div>

          {hasCriticalTopics && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-rose-800">
              <svg className="h-3.5 w-3.5 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{stats?.weakTopicsCount} Topic(s) Need Reinforcement</span>
            </span>
          )}
        </div>

        {weakTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">
              No topic mastery data yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-neutral-600">
              Take your first quiz from the Study Library to start recording rolling topic
              performance!
            </p>
            <button
              onClick={onNavigateToLibrary}
              className="mt-4 rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 shadow-2xs"
            >
              Go to Library &rarr;
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weakTopics.map((topic, idx) => {
              const isCritical = topic.status === 'critical';
              const isModerate = topic.status === 'moderate';

              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between rounded-lg border p-4 transition ${
                    isCritical
                      ? 'border-rose-200 bg-rose-50/20'
                      : isModerate
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-neutral-200 bg-neutral-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="truncate block font-semibold text-xs text-neutral-950">
                          {topic.topicTag}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-500">
                          {topic.totalQuestionsSeen} questions seen · {topic.totalAttemptsCount}{' '}
                          attempts
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                          isCritical
                            ? 'border-rose-300 bg-rose-50 text-rose-800'
                            : isModerate
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {topic.rollingAccuracy}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCritical
                            ? 'bg-rose-500'
                            : isModerate
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.max(5, topic.rollingAccuracy)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-neutral-100/80 pt-2.5">
                    <span className="font-mono text-[10px] font-medium text-neutral-600">
                      {isCritical ? 'Needs Urgent Review' : isModerate ? 'Developing' : 'Mastered'}
                    </span>
                    <button
                      onClick={() => handlePracticeWeakTopics(topic.topicTag)}
                      disabled={isGeneratingPractice}
                      className="inline-flex items-center gap-1 rounded bg-white border border-neutral-300 px-2 py-1 font-mono text-[10px] font-semibold text-neutral-800 hover:bg-neutral-50 shadow-2xs"
                    >
                      <span>Drill Topic</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Subjects Overview & Recent Quiz History */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
        {/* Subjects Overview */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm md:col-span-1">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            Curriculum Scope
          </span>
          <h2 className="mt-0.5 text-base font-bold text-neutral-950">Subjects</h2>

          {subjects.length === 0 ? (
            <p className="mt-4 text-xs text-neutral-500">No subjects cataloged yet.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {subjects.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                >
                  <span className="truncate font-semibold text-xs text-neutral-900 min-w-0">
                    {sub.subject}
                  </span>
                  <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-neutral-600">
                    <span>{sub.documentCount} docs</span>
                    <span>·</span>
                    <span>{sub.quizCount} quizzes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Quiz History */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Performance Timeline
              </span>
              <h2 className="mt-0.5 text-base font-bold text-neutral-950">Recent Quiz Attempts</h2>
            </div>
            <span className="font-mono text-xs text-neutral-500">
              Last {recentAttempts.length} evaluations
            </span>
          </div>

          {recentAttempts.length === 0 ? (
            <p className="mt-4 text-xs text-neutral-500 py-6 text-center">
              No recent attempts found. Start a quiz from your library to evaluate your knowledge!
            </p>
          ) : (
            <div className="mt-3 divide-y divide-neutral-100">
              {recentAttempts.map((attempt) => {
                const dateStr = new Date(attempt.attemptedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={attempt.attemptId}
                    className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-neutral-950 truncate max-w-xs sm:max-w-md">
                        {attempt.quizTitle}
                      </h4>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-500">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-neutral-700">
                          {attempt.subject}
                        </span>
                        <span>·</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            attempt.score >= 80
                              ? 'text-emerald-700'
                              : attempt.score >= 60
                                ? 'text-indigo-700'
                                : 'text-rose-700'
                          }`}
                        >
                          {attempt.score}%
                        </span>
                        <p className="font-mono text-[10px] text-neutral-500">
                          {attempt.correctCount}/{attempt.totalQuestions} Correct
                        </p>
                      </div>

                      <button
                        onClick={() => handleReviewAttempt(attempt.quizId)}
                        className="rounded border border-neutral-300 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
