import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { ChatMessage, CitedSource } from '../types/chat.types';
import type { StudyDocument } from '../types/document.types';
import { MarkdownMessage } from './MarkdownMessage';

interface DocumentChatProps {
  document: StudyDocument;
  onBackToLibrary: () => void;
  onDocumentUpdated?: (updatedDoc: StudyDocument) => void;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  document,
  onBackToLibrary,
  onDocumentUpdated,
}) => {
  const [currentDoc, setCurrentDoc] = useState<StudyDocument>(document);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appendSuccessNotice, setAppendSuccessNotice] = useState<string | null>(null);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null);
  const [allowFallback, setAllowFallback] = useState<boolean>(true);
  const [appendedGuideIds, setAppendedGuideIds] = useState<Set<string>>(new Set());
  const [appendingId, setAppendingId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyResponse = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => {
        setCopiedMessageId((current) => (current === id ? null : current));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message text:', err);
    }
  };

  // Sync if parent document prop updates
  useEffect(() => {
    setCurrentDoc(document);
  }, [document]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAppendToStudyGuide = async (message: ChatMessage) => {
    if (appendingId || appendedGuideIds.has(message.id)) return;

    setAppendingId(message.id);
    setErrorMsg(null);
    setAppendSuccessNotice(null);

    try {
      const res = await api.documents.append(currentDoc._id, message.text);
      setCurrentDoc(res.document);
      setAppendedGuideIds((prev) => new Set(prev).add(message.id));
      setAppendSuccessNotice(
        `Added to your study guide! Document re-indexed to ${res.document.chunkCount} vector chunks.`
      );
      onDocumentUpdated?.(res.document);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Failed to append section to study guide');
    } finally {
      setAppendingId(null);
    }
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
      const response = await api.chat.ask(currentDoc._id, query, allowFallback);

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

  return (
    <div className="flex flex-1 h-full min-h-0 flex-col rounded-xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden">
      {/* Chat Scoped Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white px-3.5 py-2.5 sm:px-6 sm:py-3.5 gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={onBackToLibrary}
            className="btn-press flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 shadow-2xs"
            title="Back to Document Library"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                RAG Scoped
              </span>
              <span className="rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[10px] sm:text-[11px] font-medium text-zinc-700 truncate max-w-[90px] sm:max-w-none">
                {currentDoc.subject || 'General'}
              </span>
            </div>
            <h2 className="mt-0.5 font-heading text-sm sm:text-base font-semibold tracking-tight text-zinc-950 truncate max-w-[130px] sm:max-w-[280px] md:max-w-md" title={currentDoc.title}>
              {currentDoc.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Fallback Mode Toggle */}
          <button
            type="button"
            onClick={() => setAllowFallback(!allowFallback)}
            className={`btn-press inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[11px] font-medium border transition ${
              allowFallback
                ? 'border-zinc-300 bg-zinc-100/90 text-zinc-900'
                : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800'
            }`}
            title="Toggle whether AnchorAI can fall back to general academic knowledge if your notes don't cover a question."
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                allowFallback ? 'bg-zinc-950' : 'bg-zinc-300'
              }`}
            />
            <span className="hidden sm:inline">Fallback: {allowFallback ? 'Enabled' : 'Strict'}</span>
            <span className="sm:hidden">{allowFallback ? 'Fallback' : 'Strict'}</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all messages in this chat session?')) {
                  setMessages([]);
                  setErrorMsg(null);
                  setAppendSuccessNotice(null);
                }
              }}
              className="btn-press inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 sm:px-2.5 py-1 font-mono text-[10px] sm:text-[11px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 shadow-2xs"
              title="Clear all messages in this conversation"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <span className="hidden sm:inline-block font-mono text-xs font-medium text-zinc-500">
            {currentDoc.chunkCount} Chunks
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            Atlas Vector Store
          </span>
        </div>
      </div>

      {/* Low OCR Confidence Advisory Banner */}
      {currentDoc.hasLowConfidenceWarning && (
        <div className="border-b border-zinc-200 bg-zinc-50/90 px-5 py-2.5 text-xs text-zinc-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Transcription Advisory:</strong> Transcribed from photographed or handwritten
              notes with moderate OCR confidence (~{currentDoc.ocrConfidence || 50}%).
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-zinc-500 shrink-0">
            OCR Advisory
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-zinc-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-950 text-white shadow-xs">
              <svg className="h-5 w-5 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight text-zinc-950">
              Grounded Document Intelligence
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-md font-body">
              Queries are synthesized strictly from retrieved passages in{' '}
              <strong className="text-zinc-900 font-semibold">{document.title}</strong>, complete
              with verbatim page citations.
            </p>

            <div className="mt-6 w-full space-y-2.5 text-left">
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Suggested Prompts
              </span>
              <div className="flex flex-col gap-2">
                {[
                  'Summarize the core takeaways from these notes',
                  'What are the primary definitions or mechanisms presented?',
                  'List the key topics and comparison points in this document',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, suggestion)}
                    className="btn-press flex items-center justify-between rounded-lg border border-zinc-200/90 bg-white p-3 text-xs sm:text-sm font-medium text-zinc-800 transition hover:border-zinc-950 hover:bg-zinc-50/60 shadow-2xs text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-zinc-400 font-semibold">0{idx + 1}</span>
                      <span>{suggestion}</span>
                    </div>
                    <span className="font-mono text-zinc-400 text-xs">&rarr;</span>
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
                className={`flex flex-col w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.sender === 'user' ? (
                  /* User Message: Minimalist carbon bubble */
                  <div className="max-w-[88%] sm:max-w-[75%] rounded-xl rounded-tr-xs bg-zinc-950 px-4 py-3 sm:px-5 sm:py-3.5 text-zinc-100 shadow-xs leading-relaxed text-xs sm:text-sm border border-zinc-900">
                    <div className="mb-1.5 flex items-center justify-between gap-4 font-mono text-[10px]">
                      <span className="text-zinc-400 font-semibold uppercase tracking-widest">
                        You
                      </span>
                      <span className="text-zinc-500">{msg.timestamp}</span>
                    </div>
                    <MarkdownMessage content={msg.text} isUser={true} />
                  </div>
                ) : (
                  /* AI Response: Full-width container (ChatGPT style) for maximum space & rich formatting */
                  <div
                    className={`w-full rounded-xl p-4 sm:p-6 leading-relaxed text-xs sm:text-sm transition-all border shadow-xs ${
                      isGeneralMode
                        ? 'border-zinc-200 bg-white text-zinc-900'
                        : 'border-zinc-200/90 bg-white text-zinc-900'
                    }`}
                  >
                    {/* Header with Sender Tag and Copy Button */}
                    <div className="mb-3.5 flex items-center justify-between gap-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        {isGeneralMode ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-300 bg-zinc-800 text-white font-mono text-[10px] font-bold">
                              AI
                            </span>
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-800">
                              AnchorAI
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] font-medium text-zinc-700">
                              General Knowledge · Out of Notes
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-200 bg-zinc-950 text-white font-mono text-[10px] font-bold">
                              AI
                            </span>
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-800">
                              AnchorAI
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-mono text-[10px] font-medium text-zinc-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Grounded in Notes
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Copy Response Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyResponse(msg.id, msg.text)}
                          className={`btn-press inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium transition shadow-2xs ${
                            copiedMessageId === msg.id
                              ? 'border-zinc-300 bg-zinc-100 text-zinc-950 font-semibold'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950'
                          }`}
                          title="Copy response to clipboard"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <svg
                                className="h-3.5 w-3.5 text-zinc-950"
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
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-3.5 w-3.5 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.8}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <span className="text-zinc-400 font-mono text-[11px]">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* General Knowledge Fallback Notice */}
                    {isGeneralMode && (
                      <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs text-zinc-700 leading-relaxed font-body">
                        <strong className="font-semibold text-zinc-950">Curriculum Scope:</strong> This concept could not be verified in{' '}
                        <em>{document.title}</em> with high similarity confidence. The answer
                        below is synthesized from general academic knowledge to assist your study.
                      </div>
                    )}

                    {/* Message Body */}
                    <MarkdownMessage content={msg.text} isUser={false} />

                    {/* Append to Study Guide Button for General Knowledge answers */}
                    {isGeneralMode && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleAppendToStudyGuide(msg)}
                          disabled={appendedGuideIds.has(msg.id) || appendingId === msg.id}
                          className={`btn-press inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition shadow-2xs ${
                            appendedGuideIds.has(msg.id)
                              ? 'border border-zinc-300 bg-zinc-100 text-zinc-800 cursor-default'
                              : appendingId === msg.id
                                ? 'border border-zinc-300 bg-zinc-100 text-zinc-600 cursor-wait'
                                : 'border border-zinc-300 bg-white text-zinc-800 hover:border-zinc-950 hover:bg-zinc-50'
                          }`}
                        >
                          {appendingId === msg.id ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                              <span>Adding to study guide...</span>
                            </>
                          ) : appendedGuideIds.has(msg.id) ? (
                            <>
                              <svg
                                className="h-3.5 w-3.5 text-zinc-950"
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
                              <span>Added to Study Guide</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-3.5 w-3.5 text-zinc-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.8}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              <span>Append to Study Guide</span>
                            </>
                          )}
                        </button>

                        {msg.latency && (
                          <span className="font-mono text-[11px] text-zinc-400">
                            Latency: {(msg.latency.totalMs / 1000).toFixed(2)}s (LLM: {msg.latency.llmMs}ms)
                          </span>
                        )}
                      </div>
                    )}

                    {/* No Context Alert for strict refusal answers */}
                    {msg.mode === 'grounded' && (!msg.sources || msg.sources.length === 0) && (
                      <div className="mt-3.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
                        <span className="font-semibold text-zinc-950">Notice:</span> The retrieved excerpts from
                        this document did not contain enough verified information to answer this question.
                      </div>
                    )}

                    {/* Cited Sources & Latency under Grounded AI response */}
                    {!isGeneralMode && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 border-t border-zinc-100 pt-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              Verified Sources:
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
                                  className={`btn-press rounded border px-2.5 py-1 font-mono text-[11px] transition ${
                                    isExpanded
                                      ? 'border-zinc-950 bg-zinc-950 text-white font-medium'
                                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400 hover:bg-white'
                                  }`}
                                >
                                  Page {src.page || 'N/A'} · Score {src.similarityScore}
                                </button>
                              );
                            })}
                          </div>

                          {msg.latency && (
                            <span className="font-mono text-[11px] text-zinc-400">
                              Latency: {(msg.latency.totalMs / 1000).toFixed(2)}s
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
                              className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 font-mono text-xs text-zinc-700 leading-normal"
                            >
                              <div className="mb-1.5 flex items-center justify-between font-semibold text-zinc-500 text-[10px] uppercase tracking-wider">
                                <span>
                                  Chunk #{src.chunkIndex} · Page {src.page || 'N/A'}
                                </span>
                                <span>Similarity {src.similarityScore}</span>
                              </div>
                              <p className="whitespace-pre-wrap font-mono text-[11px] text-zinc-800">{src.textSnippet}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-2xs">
              <div className="flex items-center gap-2.5 font-mono text-xs text-zinc-600">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 animate-bounce" />
                </span>
                <span>Searching vector database & synthesizing response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Area */}
      <div className="shrink-0 border-t border-zinc-200/90 bg-white">
        {/* Error Callout */}
        {errorMsg && (
          <div className="border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-medium text-rose-800 flex items-center justify-between">
            <div>
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-700 hover:text-rose-950 font-mono text-xs px-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Append Success Notice */}
        {appendSuccessNotice && (
          <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-2 text-xs text-zinc-800 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{appendSuccessNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAppendSuccessNotice(null)}
              className="text-zinc-500 hover:text-zinc-950 font-mono text-xs px-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Sticky Input Bar */}
        <form onSubmit={handleSendMessage} className="p-2.5 sm:p-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask a question grounded in ${currentDoc.title}...`}
              disabled={isLoading}
              className="w-full rounded-xl border border-zinc-300 bg-white pl-3.5 sm:pl-4 pr-20 sm:pr-24 py-3 sm:py-3.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none shadow-2xs transition"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="btn-press absolute right-1.5 sm:right-2 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-30 shadow-2xs"
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Send</span>
                  <svg className="h-3 w-3 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
