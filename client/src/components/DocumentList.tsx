import React, { useEffect, useState } from 'react';
import type { StudyDocument } from '../types/document.types';

interface DocumentListProps {
  documents: StudyDocument[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectChatDocument?: (doc: StudyDocument) => void;
  onSelectQuizDocument?: (doc: StudyDocument) => void;
  onOpenQuizGenerator?: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onRefresh,
  onSelectChatDocument,
  onSelectQuizDocument,
  onOpenQuizGenerator,
}) => {
  const [selectedDocForError, setSelectedDocForError] = useState<StudyDocument | null>(null);

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

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/60 px-6 py-4">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Study Library
          </span>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-neutral-950">
            Uploaded Documents ({documents.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Document Items or Empty State */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-3.5 text-sm font-semibold text-neutral-900">
            No documents uploaded yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-600 leading-normal">
            Upload your syllabus or lecture slide PDFs, or handwritten notes photos above to begin
            ingesting text.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {documents.map((doc) => {
            const isImage = doc.fileType === 'image';

            return (
              <div
                key={doc._id}
                className="flex flex-col gap-3 p-5 transition hover:bg-neutral-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Document Info */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                      isImage
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold uppercase">
                      {isImage ? 'IMG' : 'PDF'}
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-950">{doc.title}</h4>
                      {isImage && (
                        <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-indigo-700">
                          {doc.ocrEngine === 'vision-llm' ? 'Vision OCR' : 'OCR'}
                        </span>
                      )}
                      {doc.hasLowConfidenceWarning && (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-300 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900"
                          title="Transcription may contain handwriting errors"
                        >
                          <span>⚠️</span>
                          <span>Low OCR Confidence (~{doc.ocrConfidence || 50}%)</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-600">
                      <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-neutral-800 font-medium">
                        {doc.subject || 'General'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.chunkCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-neutral-700">
                            {doc.chunkCount} vector chunks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-3">
                  {doc.status === 'processing' && (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider text-amber-900">
                      <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
                      {isImage ? 'Transcribing OCR...' : 'Extracting Text...'}
                    </span>
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
                    </div>
                  )}

                  {doc.status === 'failed' && (
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
    </div>
  );
};
