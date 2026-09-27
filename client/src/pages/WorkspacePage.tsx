import React, { useCallback, useEffect, useState } from 'react';
import { CreatePrimerModal } from '../components/CreatePrimerModal';
import { DashboardView } from '../components/DashboardView';
import { DocumentChat } from '../components/DocumentChat';
import { DocumentList } from '../components/DocumentList';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { QuizActiveView } from '../components/QuizActiveView';
import { QuizGeneratorModal } from '../components/QuizGeneratorModal';
import { QuizResultsView } from '../components/QuizResultsView';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { StudyDocument } from '../types/document.types';
import type { QuizAttempt, QuizForTaking, QuizFull } from '../types/quiz.types';

export const WorkspacePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChatDoc, setActiveChatDoc] = useState<StudyDocument | null>(null);

  // Main Tabs: 'library' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'library' | 'dashboard'>('library');

  // Primer Modal State
  const [isPrimerModalOpen, setIsPrimerModalOpen] = useState<boolean>(false);

  // Quiz State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [preselectedDocId, setPreselectedDocId] = useState<string | undefined>(undefined);
  const [activeQuiz, setActiveQuiz] = useState<QuizForTaking | null>(null);
  const [quizResult, setQuizResult] = useState<{ attempt: QuizAttempt; quiz: QuizFull } | null>(
    null
  );

  const fetchDocuments = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await api.documents.list();
      setDocuments(res.documents);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadSuccess = (newDoc: StudyDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleOpenGenerator = (docId?: string) => {
    setPreselectedDocId(docId);
    setIsGeneratorOpen(true);
  };

  const handleQuizReady = (quiz: QuizForTaking) => {
    setActiveChatDoc(null);
    setQuizResult(null);
    setActiveQuiz(quiz);
  };

  const handleSubmitComplete = (result: { attempt: QuizAttempt; quiz: QuizFull }) => {
    setActiveQuiz(null);
    setQuizResult(result);
  };

  const handleRetakeQuiz = async () => {
    if (!quizResult) return;
    try {
      const res = await api.quiz.getForTaking(quizResult.quiz._id);
      setActiveQuiz(res.quiz);
      setQuizResult(null);
    } catch {
      handleOpenGenerator();
    }
  };

  const readyCount = documents.filter((d) => d.status === 'ready').length;
  const processingCount = documents.filter((d) => d.status === 'processing').length;
  const failedCount = documents.filter((d) => d.status === 'failed').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Top Banner (hidden during active quiz to maximize focus) */}
      {!activeQuiz && !quizResult && (
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Session Active · Workspace
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
                Welcome back, {user?.name}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Account:{' '}
                <span className="font-mono font-medium text-neutral-900">{user?.email}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {readyCount > 0 && !activeChatDoc && (
                <button
                  onClick={() => handleOpenGenerator()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-indigo-300 bg-indigo-50 px-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-indigo-800 transition hover:bg-indigo-100 shadow-2xs"
                >
                  <svg
                    className="h-3.5 w-3.5 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  New Quiz
                </button>
              )}
              <button
                onClick={logout}
                className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800 transition hover:bg-neutral-100 hover:text-black shadow-2xs"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-3.5 border-t border-neutral-100 pt-5 sm:grid-cols-4">
            <div className="rounded-md border border-neutral-200 bg-neutral-50/70 p-3.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Total Ingested
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-neutral-950">
                {documents.length}
              </div>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Ready for RAG
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-700">{readyCount}</div>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-800">
                Processing
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-700">
                {processingCount}
              </div>
            </div>
            <div className="rounded-md border border-red-200 bg-red-50/50 p-3.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-800">
                Failed
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-red-700">{failedCount}</div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-900">
          {errorMsg}
        </div>
      )}

      {/* View Switching */}
      {activeQuiz ? (
        <QuizActiveView
          quiz={activeQuiz}
          onQuit={() => setActiveQuiz(null)}
          onSubmitComplete={handleSubmitComplete}
        />
      ) : quizResult ? (
        <QuizResultsView
          attempt={quizResult.attempt}
          quiz={quizResult.quiz}
          onRetake={handleRetakeQuiz}
          onNewQuiz={() => handleOpenGenerator()}
          onBackToLibrary={() => setQuizResult(null)}
        />
      ) : activeChatDoc ? (
        <DocumentChat document={activeChatDoc} onBackToLibrary={() => setActiveChatDoc(null)} />
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === 'library'
                  ? 'border-[#010120] text-neutral-950 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>📚</span>
              <span>Study Library</span>
              <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                {documents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === 'dashboard'
                  ? 'border-[#010120] text-neutral-950 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>📊</span>
              <span>Diagnostics & Mastery</span>
            </button>
          </div>

          {activeTab === 'library' ? (
            <div className="space-y-8">
              <DocumentUploadZone onUploadSuccess={handleUploadSuccess} />
              <DocumentList
                documents={documents}
                isLoading={isLoadingDocs}
                onRefresh={fetchDocuments}
                onSelectChatDocument={setActiveChatDoc}
                onSelectQuizDocument={(doc) => handleOpenGenerator(doc._id)}
                onOpenQuizGenerator={() => handleOpenGenerator()}
                onOpenCreatePrimer={() => setIsPrimerModalOpen(true)}
              />
            </div>
          ) : (
            <DashboardView
              onStartQuiz={handleQuizReady}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
          )}
        </div>
      )}

      {/* Primer Generation Modal */}
      <CreatePrimerModal
        isOpen={isPrimerModalOpen}
        onClose={() => setIsPrimerModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Quiz Generation Modal */}
      <QuizGeneratorModal
        documents={documents}
        preselectedDocId={preselectedDocId}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onQuizReady={handleQuizReady}
      />
    </div>
  );
};
