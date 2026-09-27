import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DeleteDocumentResponse, StudyDocument } from '../types/document.types';

interface DocumentListProps {
  documents: StudyDocument[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectChatDocument?: (doc: StudyDocument) => void;
  onSelectQuizDocument?: (doc: StudyDocument) => void;
  onOpenQuizGenerator?: () => void;
  onOpenCreatePrimer?: () => void;
  onDeleteDocument?: (docId: string, result?: DeleteDocumentResponse) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onRefresh,
  onSelectChatDocument,
  onSelectQuizDocument,
  onOpenQuizGenerator,
  onOpenCreatePrimer,
  onDeleteDocument,
}) => {
  const [selectedDocForError, setSelectedDocForError] = useState<StudyDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<StudyDocument | null>(null);
  const [cascadeDelete, setCascadeDelete] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  const handleInitiateDelete = (doc: StudyDocument) => {
    setDeleteError(null);
    setCascadeDelete(true);
    setDocumentToDelete(doc);
  };

  const handleRetry = async (doc: StudyDocument) => {
    try {
      setRetryingDocId(doc._id);
      setReprocessError(null);
      await api.documents.reprocess(doc._id);
      onRefresh();
    } catch (err) {
      setReprocessError((err as Error).message || 'Failed to retry document processing');
    } finally {
      setRetryingDocId(null);
    }
  };

  // Auto-poll if any document is currently in 'processing' status
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === 'processing');
    if (!hasProcessing) return;

    const intervalId = setInterval(() => {
      onRefresh();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [documents, onRefresh]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const preserveHistory = !cascadeDelete;
      const result = await api.documents.delete(documentToDelete._id, preserveHistory);
      onDeleteDocument?.(documentToDelete._id, result);
      setDocumentToDelete(null);
      setCascadeDelete(true);
    } catch (err) {
      setDeleteError((err as Error).message || 'Failed to delete document from study library');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 bg-neutral-50/60 px-4 py-3.5 sm:px-6 sm:py-4">
        <div>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Study Library
          </span>
          <h2 className="mt-0.5 text-sm sm:text-base font-semibold tracking-tight text-neutral-950">
            Uploaded Documents ({documents.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCreatePrimer && (
            <button
              onClick={onOpenCreatePrimer}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-teal-300 bg-teal-50 px-3 font-mono text-xs font-semibold uppercase tracking-wider text-teal-800 transition hover:bg-teal-100 shadow-2xs"
            >
              <svg
                className="h-3.5 w-3.5 text-teal-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Primer
            </button>
          )}

          {onOpenQuizGenerator && documents.some((d) => d.status === 'ready') && (
            <button
              onClick={onOpenQuizGenerator}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-indigo-300 bg-indigo-50 px-3 font-mono text-xs font-semibold uppercase tracking-wider text-indigo-800 transition hover:bg-indigo-100 shadow-2xs"
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
              Create Quiz
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 font-mono text-xs font-medium uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-100 hover:text-black disabled:opacity-50 shadow-2xs"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
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
            Refresh
          </button>
        </div>
      </div>

      {/* Reprocess Error Banner */}
      {reprocessError && (
        <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          <span className="font-medium">{reprocessError}</span>
          <button
            onClick={() => setReprocessError(null)}
            className="ml-3 font-mono text-sm font-bold text-rose-600 hover:text-rose-900"
          >
            &times;
          </button>
        </div>
      )}

      {/* Document Items or Empty State */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 shadow-2xs text-zinc-900">
            <svg className="h-7 w-7 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Get Started
          </span>
          <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-zinc-950">
            Your study library is empty
          </h3>
          <p className="mt-1.5 max-w-md text-xs sm:text-sm text-zinc-600 leading-relaxed">
            AnchorAI grounds all questions, citations, and quizzes directly in your course materials.
            Upload lecture notes or synthesize an AI study primer to begin.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('workspace-upload-dropzone') || document.getElementById('workspace-file-input');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (document.getElementById('workspace-file-input') as HTMLInputElement)?.click();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-zinc-950 px-4 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 shadow-2xs"
            >
              <svg className="h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload Document</span>
            </button>

            {onOpenCreatePrimer && (
              <button
                type="button"
                onClick={onOpenCreatePrimer}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-teal-300 bg-teal-50 px-4 font-mono text-xs font-semibold uppercase tracking-wider text-teal-900 transition hover:bg-teal-100 shadow-2xs"
              >
                <svg className="h-4 w-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Synthesize Primer</span>
              </button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              PDF Documents & Slides
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              Handwritten Photos (OCR)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              Instant AI Primers
            </span>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {documents.map((doc) => {
            const isImage = doc.fileType === 'image';
            const isPrimer = doc.fileType === 'primer';

            return (
              <div
                key={doc._id}
                className="flex flex-col gap-3 p-4 sm:p-5 transition hover:bg-neutral-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Document Info */}
                <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md border ${
                      isPrimer
                        ? 'bg-teal-50 border-teal-200 text-teal-800'
                        : isImage
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <span className="font-mono text-[11px] sm:text-xs font-bold uppercase">
                      {isPrimer ? 'DOC' : isImage ? 'IMG' : 'PDF'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-sm font-semibold text-neutral-950 break-words">{doc.title}</h4>
                      {isPrimer && (
                        <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                          AI Primer
                        </span>
                      )}
                      {isImage && (
                        <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-indigo-700">
                          {doc.ocrEngine === 'vision-llm' ? 'Vision OCR' : 'OCR'}
                        </span>
                      )}
                      {doc.hasLowConfidenceWarning && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded bg-zinc-100 border border-zinc-200 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-800"
                          title="Transcription may contain handwriting errors"
                        >
                          <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Low OCR Confidence (~{doc.ocrConfidence || 50}%)</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-600">
                      <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-neutral-800 font-medium text-[11px]">
                        {doc.subject || 'General'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                        <>
                          <span>·</span>
                          <span
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10.5px] font-semibold text-emerald-800"
                            title={`Last updated: ${new Date(doc.updatedAt).toLocaleString()}`}
                          >
                            <span className="h-1 w-1 rounded-full bg-emerald-600" />
                            Updated {formatDate(doc.updatedAt)}
                          </span>
                        </>
                      )}
                      {doc.chunkCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-neutral-700 text-[11px]">
                            {doc.chunkCount} vector chunks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
                  {doc.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider text-amber-900">
                        <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
                        {isPrimer
                          ? 'Synthesizing Primer...'
                          : isImage
                            ? 'Transcribing OCR...'
                            : 'Extracting Text...'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDocumentToDelete(doc);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 shadow-2xs"
                        title="Delete from study library"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {doc.status === 'ready' && (
                    <div className="flex items-center gap-2">
                      {onSelectQuizDocument && (
                        <button
                          onClick={() => onSelectQuizDocument(doc)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 bg-white px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-indigo-700 transition hover:bg-indigo-50 shadow-2xs"
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
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <span>Quiz</span>
                        </button>
                      )}
                      {onSelectChatDocument && (
                        <button
                          onClick={() => onSelectChatDocument(doc)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 shadow-2xs"
                        >
                          <span>Chat</span>
                          <span>&rarr;</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(doc)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 shadow-2xs"
                        title="Delete from study library"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {doc.status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRetry(doc)}
                        disabled={retryingDocId === doc._id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-amber-900 transition hover:bg-amber-100 disabled:opacity-50 shadow-2xs"
                        title="Retry processing document"
                      >
                        <svg
                          className={`h-3.5 w-3.5 text-amber-700 ${retryingDocId === doc._id ? 'animate-spin' : ''}`}
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
                        <span>{retryingDocId === doc._id ? 'Retrying...' : 'Retry'}</span>
                      </button>
                      <button
                        onClick={() => setSelectedDocForError(doc)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider text-red-900 hover:bg-red-100"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Failed (View Error)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(doc)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 shadow-2xs"
                        title="Delete from study library"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Details Modal */}
      {selectedDocForError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-600">
              Extraction Error
            </span>
            <h3 className="mt-1 text-base font-semibold text-neutral-900">
              {selectedDocForError.title}
            </h3>
            <p className="mt-3 rounded-md bg-neutral-100 p-3 font-mono text-xs text-neutral-800 leading-normal">
              {selectedDocForError.errorReason || 'An unknown extraction failure occurred.'}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDocForError(null)}
                className="rounded-md bg-neutral-950 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-600">
                  Delete Confirmation
                </span>
                <h3 className="text-base font-semibold text-neutral-950">
                  Delete from Study Library?
                </h3>
              </div>
            </div>

            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-neutral-900 font-semibold">{documentToDelete.title}</strong>? All associated study notes, chat context, and vector embeddings will be permanently removed.
            </p>

            <label className="mt-4 flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 select-none cursor-pointer transition hover:bg-neutral-100/60">
              <input
                type="checkbox"
                id="cascade-delete-checkbox"
                checked={cascadeDelete}
                onChange={(e) => setCascadeDelete(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 accent-neutral-900 focus:ring-neutral-900"
              />
              <div className="flex flex-col text-xs">
                <span className="font-medium text-neutral-900 leading-snug">
                  Also delete all related quizzes, attempts, and reset associated topic scores
                </span>
                <span className="mt-1 text-[11px] text-neutral-500 leading-normal">
                  {cascadeDelete
                    ? 'Recommended: Cleans up quizzes generated from this document and recalculates your topic mastery from surviving attempts.'
                    : 'Opt-out: Keeps all generated quizzes, past attempts, and mastery metrics in your dashboard intact.'}
                </span>
              </div>
            </label>

            {deleteError && (
              <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2.5 text-xs text-red-900">
                <strong>Error:</strong> {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDocumentToDelete(null)}
                disabled={isDeleting}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-red-700 disabled:opacity-50 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
