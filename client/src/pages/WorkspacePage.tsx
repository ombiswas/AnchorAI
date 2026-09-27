import React, { useCallback, useEffect, useState } from 'react';
import { DocumentChat } from '../components/DocumentChat';
import { DocumentList } from '../components/DocumentList';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { StudyDocument } from '../types/document.types';

export const WorkspacePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChatDoc, setActiveChatDoc] = useState<StudyDocument | null>(null);

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

  const readyCount = documents.filter((d) => d.status === 'ready').length;
  const processingCount = documents.filter((d) => d.status === 'processing').length;
  const failedCount = documents.filter((d) => d.status === 'failed').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Top Banner */}
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
              Account: <span className="font-mono font-medium text-neutral-900">{user?.email}</span>
            </p>
          </div>

          <button
            onClick={logout}
            className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800 transition hover:bg-neutral-100 hover:text-black shadow-2xs"
          >
            Sign Out
          </button>
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

      {errorMsg && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-900">
          {errorMsg}
        </div>
      )}

      {/* Main View: Document Chat OR Upload + Library */}
      {activeChatDoc ? (
        <DocumentChat document={activeChatDoc} onBackToLibrary={() => setActiveChatDoc(null)} />
      ) : (
        <div className="space-y-8">
          <DocumentUploadZone onUploadSuccess={handleUploadSuccess} />
          <DocumentList
            documents={documents}
            isLoading={isLoadingDocs}
            onRefresh={fetchDocuments}
            onSelectChatDocument={setActiveChatDoc}
          />
        </div>
      )}
    </div>
  );
};
