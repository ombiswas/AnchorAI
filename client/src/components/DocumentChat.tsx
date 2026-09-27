import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { ChatMessage, CitedSource } from '../types/chat.types';
import type { StudyDocument } from '../types/document.types';

interface DocumentChatProps {
  document: StudyDocument;
  onBackToLibrary: () => void;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({ document, onBackToLibrary }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null);
  const [allowFallback, setAllowFallback] = useState<boolean>(true);
  const [appendedGuideIds, setAppendedGuideIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAppendToStudyGuide = (message: ChatMessage) => {
    setAppendedGuideIds((prev) => new Set(prev).add(message.id));
  };

  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || inputValue).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.chat.ask(document._id, query, allowFallback);

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        mode: response.mode,
        sources: response.sources,
        latency: response.latency,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to retrieve answer from your document');
    } finally {
      setIsLoading(false);
    }
  };

  const isUnknownAnswer = (text: string) => {
    return text.toLowerCase().includes("i don't know based on your notes");
  };

  return (
    <div className="flex h-[750px] max-h-[85vh] flex-col rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Chat Scoped Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToLibrary}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-800 transition hover:bg-neutral-100 hover:text-black shadow-2xs"
            title="Back to Document Library"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                RAG Scoped Session
              </span>
              <span className="rounded bg-neutral-200 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-800">
                {document.subject || 'General'}
              </span>
            </div>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-neutral-950">
              {document.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Fallback Mode Toggle */}
          <button
            type="button"
            onClick={() => setAllowFallback(!allowFallback)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium border transition ${
              allowFallback
                ? 'border-indigo-200 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100/70'
                : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
            title="Toggle whether AnchorAI can fall back to general academic knowledge if your notes don't cover a question."
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                allowFallback ? 'bg-indigo-600 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            <span>AI Fallback: {allowFallback ? 'On' : 'Off'}</span>
          </button>

          <span className="font-mono text-xs font-medium text-neutral-600">
            {document.chunkCount} Chunks
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Atlas Grounded
          </span>
        </div>
      </div>

      {/* Low OCR Confidence Advisory Banner */}
      {document.hasLowConfidenceWarning && (
        <div className="border-b border-amber-200 bg-amber-50/90 px-6 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>Note:</strong> This document was transcribed from handwritten or photographed
              notes with moderate OCR confidence (~{document.ocrConfidence || 50}%). Some terms or
              formulas may contain transcription errors.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-amber-800 shrink-0">
            OCR Advisory
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#010120] text-white shadow-sm">
              <span className="font-mono text-lg font-bold">⚓</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-950">
              Ask questions about this document
            </h3>
            <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed max-w-md">
              Answers are synthesized strictly from the retrieved excerpts of{' '}
              <strong className="text-neutral-900 font-semibold">{document.title}</strong>, complete
              with page-level citations.
            </p>

            <div className="mt-6 w-full space-y-2.5 text-left">
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Suggested Questions
              </span>
              <div className="flex flex-col gap-2">
                {[
                  'Summarize the core takeaways from these notes',
                  'What are the primary definitions or formulas presented?',
                  'List the main topics covered in this document',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, suggestion)}
                    className="text-left rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50 hover:text-black shadow-2xs"
                  >
                    &ldquo;{suggestion}&rdquo; &rarr;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isGeneralMode = msg.sender === 'assistant' && msg.mode === 'general';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-5 leading-relaxed text-sm ${
                    msg.sender === 'user'
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : isGeneralMode
                        ? 'border border-amber-300/80 bg-amber-50/40 text-neutral-900 shadow-2xs'
                        : 'border border-neutral-200 bg-white text-neutral-900 shadow-2xs'
                  }`}
                >
                  {/* Sender Tag & Badges */}
                  <div className="mb-2.5 flex items-center justify-between gap-6 font-mono text-xs">
                    {msg.sender === 'user' ? (
                      <span className="text-neutral-300 font-semibold uppercase tracking-wider">
                        You
                      </span>
                    ) : isGeneralMode ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-950">
                        <svg
                          className="h-3 w-3 text-amber-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        General Knowledge · Not in your notes
                      </span>
                    ) : (
                      <span className="text-neutral-700 font-bold uppercase tracking-wider">
                        AnchorAI Assistant
                      </span>
                    )}

                    <span
                      className={msg.sender === 'user' ? 'text-neutral-300' : 'text-neutral-500'}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* General Knowledge Fallback Notice */}
                  {isGeneralMode && (
                    <div className="mb-3 rounded border border-amber-200/90 bg-amber-100/60 px-3.5 py-2 text-xs text-amber-950 leading-relaxed">
                      <strong>Curriculum Notice:</strong> This question could not be verified in{' '}
                      <em>{document.title}</em> with sufficient similarity confidence. The answer
                      below is synthesized from general academic knowledge to assist your study.
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-wrap font-normal text-[14.5px] leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Append to Study Guide Button for General Knowledge answers */}
                  {isGeneralMode && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200/80 pt-3">
                      <button
                        type="button"
                        onClick={() => handleAppendToStudyGuide(msg)}
                        disabled={appendedGuideIds.has(msg.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition shadow-2xs active:scale-[0.98] ${
                          appendedGuideIds.has(msg.id)
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 cursor-default'
                            : 'border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900 hover:bg-neutral-50'
                        }`}
                      >
                        {appendedGuideIds.has(msg.id) ? (
                          <>
                            <svg
                              className="h-3.5 w-3.5 text-emerald-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Appended to Study Guide
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-3.5 w-3.5 text-neutral-600"
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
                            Append to Study Guide
                          </>
                        )}
                      </button>

                      {msg.latency && (
                        <span className="font-mono text-xs font-medium text-neutral-500">
                          ⚡ {(msg.latency.totalMs / 1000).toFixed(2)}s (LLM: {msg.latency.llmMs}ms)
                        </span>
                      )}
                    </div>
                  )}

                  {/* No Context Alert for strict answers */}
                  {msg.sender === 'assistant' && !isGeneralMode && isUnknownAnswer(msg.text) && (
                    <div className="mt-3.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                      <span className="font-semibold">Notice:</span> The retrieved excerpts from
                      this document did not contain enough information to answer this question
                      accurately.
                    </div>
                  )}

                  {/* Cited Sources & Latency under Grounded AI response */}
                  {msg.sender === 'assistant' &&
                    !isGeneralMode &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div className="mt-4 border-t border-neutral-200 pt-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                              Sources:
                            </span>
                            {msg.sources.map((src: CitedSource, idx: number) => {
                              const sourceKey = `${msg.id}-${idx}`;
                              const isExpanded = expandedSourceIndex === sourceKey;

                              return (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setExpandedSourceIndex(isExpanded ? null : sourceKey)
                                  }
                                  className={`rounded border px-2.5 py-1 font-mono text-xs font-medium transition ${
                                    isExpanded
                                      ? 'border-neutral-900 bg-neutral-900 text-white'
                                      : 'border-neutral-300 bg-neutral-50 text-neutral-800 hover:border-neutral-900 hover:bg-neutral-100'
                                  }`}
                                >
                                  Page {src.page || 'N/A'} (Score {src.similarityScore})
                                </button>
                              );
                            })}
                          </div>

                          {msg.latency && (
                            <span className="font-mono text-xs font-medium text-neutral-500">
                              ⚡ {(msg.latency.totalMs / 1000).toFixed(2)}s (Retrieval:{' '}
                              {msg.latency.retrievalMs}ms, LLM: {msg.latency.llmMs}ms)
                            </span>
                          )}
                        </div>

                        {/* Source Excerpt Expansion */}
                        {msg.sources.map((src: CitedSource, idx: number) => {
                          const sourceKey = `${msg.id}-${idx}`;
                          if (expandedSourceIndex !== sourceKey) return null;

                          return (
                            <div
                              key={idx}
                              className="mt-3 rounded-md border border-neutral-300 bg-neutral-100/80 p-3.5 font-mono text-xs text-neutral-800 leading-normal"
                            >
                              <div className="mb-1.5 flex items-center justify-between font-semibold text-neutral-600 text-[11px]">
                                <span>
                                  CHUNK #{src.chunkIndex} · PAGE {src.page || 'N/A'}
                                </span>
                                <span>SIMILARITY: {src.similarityScore}</span>
                              </div>
                              <p className="whitespace-pre-wrap">{src.textSnippet}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2.5 font-mono text-xs font-medium text-neutral-700">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-neutral-900" />
                <span>Searching vector database & synthesizing grounded answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="border-t border-red-200 bg-red-50 p-3 px-6 text-xs font-medium text-red-800">
          <span className="font-bold">Error:</span> {errorMsg}
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="border-t border-neutral-200 bg-white p-4">
        <div className="flex gap-2.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask a question grounded in ${document.title}...`}
            disabled={isLoading}
            className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-40 shadow-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
