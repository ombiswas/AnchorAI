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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      const response = await api.chat.ask(document._id, query);

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
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
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-[4px] border border-neutral-200 bg-white shadow-sm">
      {/* Chat Scoped Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/90 bg-neutral-50/70 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLibrary}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
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
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                RAG Scoped Chat
              </span>
              <span className="rounded-[3px] bg-neutral-200/80 px-1.5 py-0.5 font-mono text-[10px] text-neutral-700">
                {document.subject || 'General'}
              </span>
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-950">
              {document.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-neutral-500">
            {document.chunkCount} Vector Chunks
          </span>
          <span className="inline-flex items-center gap-1 rounded-[3px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Atlas Grounded
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#010120] text-white">
              <span className="font-mono text-base">⚓</span>
            </div>
            <h3 className="mt-3 text-base font-medium text-neutral-950">
              Ground your questions in this document
            </h3>
            <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              Every answer will be synthesized strictly from the retrieved chunks of{' '}
              <strong className="text-neutral-700">{document.title}</strong>, complete with page
              citations.
            </p>

            <div className="mt-6 w-full space-y-2">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                Suggested Prompts
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  'Summarize the core takeaways from these notes',
                  'What are the primary definitions or formulas presented?',
                  'List the main topics covered in this document',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, suggestion)}
                    className="text-left rounded-[4px] border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-700 transition hover:border-neutral-900 hover:text-black"
                  >
                    &ldquo;{suggestion}&rdquo; &rarr;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[4px] p-4 text-xs leading-relaxed sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-black text-white'
                    : 'border border-neutral-200 bg-white text-neutral-900 shadow-xs'
                }`}
              >
                {/* Sender Tag */}
                <div className="mb-1.5 flex items-center justify-between gap-4 font-mono text-[10px]">
                  <span
                    className={
                      msg.sender === 'user'
                        ? 'text-neutral-400 uppercase tracking-wider'
                        : 'text-neutral-500 uppercase tracking-wider font-semibold'
                    }
                  >
                    {msg.sender === 'user' ? 'You' : 'AnchorAI Assistant'}
                  </span>
                  <span className={msg.sender === 'user' ? 'text-neutral-400' : 'text-neutral-400'}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* No Context Alert */}
                {msg.sender === 'assistant' && isUnknownAnswer(msg.text) && (
                  <div className="mt-3 rounded-[3px] border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                    <span className="font-semibold">Notice:</span> The retrieved excerpts for this
                    query did not contain conclusive information to answer this question accurately.
                  </div>
                )}

                {/* Cited Sources & Latency under AI response */}
                {msg.sender === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                          Cited Sources:
                        </span>
                        {msg.sources.map((src: CitedSource, idx: number) => {
                          const sourceKey = `${msg.id}-${idx}`;
                          const isExpanded = expandedSourceIndex === sourceKey;

                          return (
                            <button
                              key={idx}
                              onClick={() => setExpandedSourceIndex(isExpanded ? null : sourceKey)}
                              className={`rounded-[3px] border px-2 py-0.5 font-mono text-[10px] transition ${
                                isExpanded
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                              }`}
                            >
                              Page {src.page || 'N/A'} (Score {src.similarityScore})
                            </button>
                          );
                        })}
                      </div>

                      {msg.latency && (
                        <span className="font-mono text-[10px] text-neutral-400">
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
                          className="mt-2.5 rounded-[4px] border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] text-neutral-800"
                        >
                          <div className="mb-1 flex items-center justify-between text-neutral-500 text-[10px]">
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
          ))
        )}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="rounded-[4px] border border-neutral-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
                <span className="h-2 w-2 animate-ping rounded-full bg-black" />
                <span>Searching vector space & synthesizing grounded answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="border-t border-red-200 bg-red-50 p-2.5 px-6 text-xs text-red-800">
          <span className="font-semibold">Error:</span> {errorMsg}
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="border-t border-neutral-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask a question grounded in ${document.title}...`}
            disabled={isLoading}
            className="flex-1 rounded-[4px] border border-neutral-200 bg-white px-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="inline-flex items-center justify-center rounded-[4px] bg-black px-5 font-mono text-xs font-medium uppercase tracking-[0.05em] text-white transition hover:bg-neutral-800 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
