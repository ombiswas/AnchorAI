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
import type { DeleteDocumentResponse, StudyDocument } from '../types/document.types';
import type { QuizAttempt, QuizForTaking, QuizFull } from '../types/quiz.types';

interface DeleteToastInfo {
  id: string;
  title: string;
  detail: string;
  cascade: boolean;
}

export const WorkspacePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChatDoc, setActiveChatDoc] = useState<StudyDocument | null>(null);

  // Main Tabs: 'library' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'library' | 'dashboard'>('library');
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState<number>(0);
  const [deleteToast, setDeleteToast] = useState<DeleteToastInfo | null>(null);

  // Primer Modal State
  const [isPrimerModalOpen, setIsPrimerModalOpen] = useState<boolean>(false);

  // Quiz State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [preselectedDocId, setPreselectedDocId] = useState<string | undefined>(undefined);
  const [activeQuiz, setActiveQuiz] = useState<QuizForTaking | null>(null);
  const [quizResult, setQuizResult] = useState<{ attempt: QuizAttempt; quiz: QuizFull } | null>(
    null
  );

  useEffect(() => {
    if (!deleteToast) return;
    const timer = setTimeout(() => {
      setDeleteToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [deleteToast]);

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
    <div
      className={`mx-auto w-full ${
        activeChatDoc
          ? 'h-[calc(100vh-57px)] sm:h-[calc(100vh-62px)] max-w-6xl px-3 sm:px-6 py-2 sm:py-3 flex flex-col flex-1 min-h-0'
          : 'max-w-6xl px-4 sm:px-6 py-4 sm:py-8'
      }`}
    >
      {/* Top Banner (hidden during active chat or active quiz to maximize focus) */}
      {!activeQuiz && !quizResult && !activeChatDoc && (
        <div className="mb-6 sm:mb-8 rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Workspace Environment · Active
                </span>
              </div>
              <h1 className="mt-1 font-heading text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
                Welcome back, {user?.name}
              </h1>
              <p className="mt-0.5 font-mono text-[11px] sm:text-xs text-zinc-500">
                Account: <span className="text-zinc-800 font-medium">{user?.email}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {readyCount > 0 && !activeChatDoc && (
                <button
                  onClick={() => handleOpenGenerator()}
                  className="btn-press inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-md bg-zinc-950 px-3 sm:px-3.5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 shadow-2xs"
                >
                  <svg
                    className="h-3.5 w-3.5 text-zinc-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <span>New Quiz</span>
                </button>
              )}
              <button
                onClick={logout}
                className="btn-press inline-flex h-8 sm:h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 sm:px-4 font-mono text-[11px] sm:text-xs font-medium uppercase tracking-wider text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 shadow-2xs"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Minimalist Metrics Grid */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3.5 border-t border-zinc-100 pt-4 sm:pt-5 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:p-3.5">
              <span className="font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-500 block truncate">
                Total Ingested
              </span>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
                {documents.length}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-500 block truncate">
                  Ready for RAG
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
                {readyCount}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-500 block truncate">
                  Processing
                </span>
                {processingCount > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
                {processingCount}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-500 block truncate">
                  Failed
                </span>
                {failedCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
              </div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
                {failedCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-md border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-medium text-rose-900">
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
        <div className="flex-1 min-h-0 flex flex-col h-full">
          <DocumentChat
            document={activeChatDoc}
            onBackToLibrary={() => setActiveChatDoc(null)}
            onDocumentUpdated={(updatedDoc) => {
              setDocuments((prev) =>
                prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d))
              );
              setActiveChatDoc(updatedDoc);
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-200 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === 'library'
                  ? 'border-zinc-950 text-zinc-950 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Study Library</span>
              <span className="ml-0.5 rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.2 text-[10px] text-zinc-600 font-medium">
                {documents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === 'dashboard'
                  ? 'border-zinc-950 text-zinc-950 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Curriculum Diagnostics</span>
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
                onDeleteDocument={(docId: string, result?: DeleteDocumentResponse) => {
                  setDocuments((prev) => prev.filter((d) => d._id !== docId));
                  if (result) {
                    if (!result.preservedHistory) {
                      setDashboardRefreshTrigger((prev) => prev + 1);
                    }
                    const isCascade = !result.preservedHistory;
                    let detail = '';
                    if (isCascade) {
                      if (result.deletedQuizzesCount > 0) {
                        detail = `Cascade deleted ${result.deletedQuizzesCount} related quiz${
                          result.deletedQuizzesCount === 1 ? '' : 'zes'
                        } and ${result.deletedAttemptsCount} attempt${
                          result.deletedAttemptsCount === 1 ? '' : 's'
                        }. Mastery scores recalculated for ${result.affectedTopicsCount} topic${
                          result.affectedTopicsCount === 1 ? '' : 's'
                        }.`;
                      } else {
                        detail =
                          'Removed document and vector chunks. No associated quizzes or attempts existed.';
                      }
                    } else {
                      detail =
                        'Removed document and vector chunks. Related quizzes and attempt history were preserved.';
                    }

                    setDeleteToast({
                      id: Date.now().toString(),
                      title: `"${result.deletedDocumentTitle || 'Document'}" deleted`,
                      detail,
                      cascade: isCascade,
                    });
                  }
                }}
              />
            </div>
          ) : (
            <DashboardView
              key={dashboardRefreshTrigger}
              refreshTrigger={dashboardRefreshTrigger}
              onStartQuiz={handleQuizReady}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
          )}
        </div>
      )}

      {/* Confirmation Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md rounded-xl border border-neutral-200 bg-white p-4 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                deleteToast.cascade
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-neutral-100 text-neutral-800'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-semibold text-neutral-950 tracking-tight">
                {deleteToast.title}
              </h4>
              <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                {deleteToast.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteToast(null)}
              className="text-neutral-400 hover:text-neutral-700 transition p-1 -mr-1 -mt-1 rounded-md"
              aria-label="Dismiss notification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
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
