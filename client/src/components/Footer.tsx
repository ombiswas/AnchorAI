import React from 'react';

interface FooterProps {
  onNavigate: (view: 'home' | 'workspace' | 'login' | 'signup' | 'privacy' | 'license') => void;
  showPrivacyGuarantee?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, showPrivacyGuarantee }) => {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Merged Student Privacy & Security Guarantee Section */}
        {showPrivacyGuarantee && (
          <div className="border-b border-neutral-800 pb-12 mb-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Student Privacy & Security Guarantee
                </div>
                <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Your notes belong to you. Not to AI training sets.
                </h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed font-body">
                  We enforce zero-retention agreements with AI inference gateways. When you delete a document from your library, all associated chunks, text, and vector embeddings are permanently wiped from MongoDB Atlas.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:shrink-0">
                <button
                  onClick={() => onNavigate('privacy')}
                  className="btn-press rounded-md bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-100 transition shadow-sm text-center"
                >
                  Read Privacy Policy &rarr;
                </button>
                <button
                  onClick={() => onNavigate('license')}
                  className="btn-press rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:bg-neutral-700 hover:text-white transition text-center"
                >
                  View MIT License
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="inline-flex cursor-pointer items-center gap-2 transition hover:opacity-85"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-white shadow-2xs">
                <svg
                  className="h-3.5 w-3.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="5" r="3" />
                  <line x1="12" y1="22" x2="12" y2="8" />
                  <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
                </svg>
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                Anchor<span className="font-mono text-xs font-normal text-[#bdbbff] uppercase tracking-widest ml-1">AI</span>
              </span>
            </div>

            <p className="max-w-sm text-xs leading-relaxed text-neutral-400 font-body">
              The AI-native study companion for rigorous learners. We ground model responses in your verified course lecture notes, slides, and topic primers to eliminate hallucinations.
            </p>

            {/* System Status */}
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
              <span className="text-neutral-300">All systems operational</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-500 text-[11px]">v1.0.0</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-xs font-body text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-white transition text-left"
                >
                  Study Workspace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-white transition text-left"
                >
                  Document Ingestion & OCR
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-white transition text-left"
                >
                  Topic Primer Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-white transition text-left"
                >
                  Adaptive Quizzing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-white transition text-left"
                >
                  Curriculum Mastery
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Tech */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs font-body text-neutral-400">
              <li>
                <span className="text-neutral-300 font-medium">MongoDB Atlas</span>
                <span className="block text-[11px] text-neutral-500">Vector Search Indexing</span>
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Together AI & Llama 3</span>
                <span className="block text-[11px] text-neutral-500">Grounded Inference</span>
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Token-Aware Chunking</span>
                <span className="block text-[11px] text-neutral-500">~400 Token Boundaries</span>
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Tesseract OCR</span>
                <span className="block text-[11px] text-neutral-500">Handwritten Notes Support</span>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs font-body text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition font-medium text-[#bdbbff] hover:underline text-left"
                >
                  Privacy Policy &rarr;
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('license')}
                  className="hover:text-white transition font-medium text-neutral-300 hover:underline text-left"
                >
                  Open Source License (MIT) &rarr;
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition text-left"
                >
                  Zero Model-Training Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition text-left"
                >
                  Data Retention & Purge
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 sm:flex-row text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>&copy; {new Date().getFullYear()} AnchorAI. All rights reserved.</span>
            <span className="hidden sm:inline text-neutral-700">·</span>
            <span className="text-[11px] font-mono text-neutral-400">
              Built for universities, students & independent researchers.
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-neutral-400 hover:text-white transition underline-offset-2 hover:underline"
            >
              Privacy
            </button>
            <span className="text-neutral-700">·</span>
            <button
              onClick={() => onNavigate('license')}
              className="text-neutral-400 hover:text-white transition underline-offset-2 hover:underline"
            >
              License
            </button>
            <span className="text-neutral-700">·</span>
            <button
              onClick={() => onNavigate('workspace')}
              className="text-neutral-400 hover:text-white transition underline-offset-2 hover:underline"
            >
              App
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
