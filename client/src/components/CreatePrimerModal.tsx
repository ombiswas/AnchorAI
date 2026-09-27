import React, { useState } from 'react';
import { api } from '../lib/api';
import type { StudyDocument } from '../types/document.types';

interface CreatePrimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: StudyDocument) => void;
}

export const CreatePrimerModal: React.FC<CreatePrimerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topic.trim();

    if (!cleanTopic || cleanTopic.length < 2) {
      setErrorMsg('Topic title must be at least 2 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await api.documents.createPrimer({
        topic: cleanTopic,
        subject: subject.trim() || 'General',
      });

      onSuccess(res.document);
      setTopic('');
      setSubject('');
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to initiate study primer generation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-zinc-200/90 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-950 shadow-2xs">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Bootstrap Study Topic
              </span>
              <h2 className="font-heading text-[18px] font-semibold tracking-tight text-zinc-950">
                New Study Primer
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
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

        <p className="mt-3 font-body text-[13px] leading-[20px] text-zinc-500">
          Generate a comprehensive, curriculum-aligned study sheet with definitions, key mechanisms,
          common exam traps, and worked examples.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50/70 p-3 font-body text-[12px] leading-[16px] text-rose-900">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="primer-topic"
              className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-700"
            >
              Topic or Concept Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="primer-topic"
              type="text"
              required
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="e.g. Distributed Consensus (Raft vs Paxos)"
              className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/30 px-3.5 font-body text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="primer-subject"
              className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-700"
            >
              Subject or Course Name (Optional)
            </label>
            <input
              id="primer-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Science, Operating Systems"
              className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/30 px-3.5 font-body text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-press rounded-md border border-zinc-200 bg-white px-3.5 py-2 font-mono text-[12px] uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !topic.trim()}
              className="btn-press inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 shadow-2xs"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <span>Generate Primer &rarr;</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
