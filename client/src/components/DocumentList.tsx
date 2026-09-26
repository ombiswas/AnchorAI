import React, { useEffect, useState } from 'react';
import type { StudyDocument } from '../types/document.types';

interface DocumentListProps {
  documents: StudyDocument[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectChatDocument?: (doc: StudyDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onRefresh,
  onSelectChatDocument,
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
    <div className="rounded-[4px] border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 px-6 py-4">
        <div>
          <span className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            Study Library
          </span>
          <h2 className="mt-0.5 text-lg font-medium tracking-tight text-neutral-950">
            Uploaded Documents ({documents.length})
          </h2>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-neutral-200 bg-white px-3 font-mono text-[11px] uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
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

      {/* Document Items or Empty State */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-neutral-100 text-neutral-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-medium text-neutral-900">No documents uploaded yet</h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-500">
            Upload your syllabus or lecture slide PDFs above to begin ingesting text for AI study
            queries.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-col gap-3 p-5 transition hover:bg-neutral-50/60 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Document Info */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-neutral-100 text-neutral-700">
                  <span className="font-mono text-xs font-bold uppercase">PDF</span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-950 hover:underline">
                    {doc.title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-500">
                    <span className="rounded-[3px] bg-neutral-100 px-1.5 py-0.5 text-neutral-700">
                      {doc.subject || 'General'}
                    </span>
                    <span>·</span>
                    <span>{formatDate(doc.createdAt)}</span>
                    {doc.chunkCount > 0 && (
                      <>
                        <span>·</span>
                        <span>~{doc.chunkCount} chunks estimated</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center gap-3">
                {doc.status === 'processing' && (
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-amber-800">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-500" />
                    Extracting Text...
                  </span>
                )}

                {doc.status === 'ready' && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-emerald-800">
                      <svg
                        className="h-3 w-3 text-emerald-600"
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
                      Ready for RAG
                    </span>
                    {onSelectChatDocument && (
                      <button
                        onClick={() => onSelectChatDocument(doc)}
                        className="inline-flex items-center gap-1 rounded-[4px] bg-black px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-white transition hover:bg-neutral-800"
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
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-red-200 bg-red-50 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-red-800 hover:bg-red-100"
                  >
                    <svg
                      className="h-3 w-3 text-red-600"
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
          ))}
        </div>
      )}

      {/* Error Details Modal */}
      {selectedDocForError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[4px] border border-neutral-200 bg-white p-6 shadow-lg">
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-red-600">
              Extraction Error
            </span>
            <h3 className="mt-1 text-lg font-medium text-neutral-900">
              {selectedDocForError.title}
            </h3>
            <p className="mt-3 rounded-[4px] bg-neutral-100 p-3 font-mono text-xs text-neutral-800">
              {selectedDocForError.errorReason || 'An unknown extraction failure occurred.'}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDocForError(null)}
                className="rounded-[4px] bg-black px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
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
