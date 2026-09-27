import React from 'react';

interface FooterProps {
  onNavigate: (view: 'home' | 'workspace' | 'login' | 'signup' | 'privacy' | 'license') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-neutral-200/90 bg-[#fafafa] text-neutral-800">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="inline-flex cursor-pointer items-center gap-2 transition hover:opacity-80"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-950 text-white shadow-2xs">
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
              <span className="font-heading text-lg font-bold tracking-tight text-neutral-950">
                Anchor<span className="font-mono text-xs font-normal text-neutral-500 uppercase tracking-widest ml-1">AI</span>
              </span>
            </div>

            <p className="max-w-sm text-xs leading-relaxed text-neutral-600 font-body">
              The AI-native study companion for rigorous learners. We ground model responses in your verified course lecture notes, slides, and topic primers to eliminate hallucinations.
            </p>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-mono text-neutral-600 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>All Systems Operational</span>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-400">v1.0.0</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">
              Platform
            </h4>
            <ul className="space-y-2 text-xs font-body text-neutral-600">
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Study Workspace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Document Ingestion & OCR
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Topic Primer Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Adaptive Quizzing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Curriculum Mastery
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Tech */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs font-body text-neutral-600">
              <li>
                <span className="text-neutral-700 font-medium">MongoDB Atlas</span>
                <span className="block text-[11px] text-neutral-400">Vector Search Indexing</span>
              </li>
              <li>
                <span className="text-neutral-700 font-medium">Together AI & Llama 3</span>
                <span className="block text-[11px] text-neutral-400">Grounded Inference</span>
              </li>
              <li>
                <span className="text-neutral-700 font-medium">Token-Aware Chunking</span>
                <span className="block text-[11px] text-neutral-400">~400 Token Boundaries</span>
              </li>
              <li>
                <span className="text-neutral-700 font-medium">Tesseract OCR</span>
                <span className="block text-[11px] text-neutral-400">Handwritten Notes Support</span>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs font-body text-neutral-600">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-neutral-950 transition font-medium text-indigo-700 hover:underline text-left"
                >
                  Privacy Policy &rarr;
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('license')}
                  className="hover:text-neutral-950 transition font-medium text-neutral-800 hover:underline text-left"
                >
                  Open Source License (MIT) &rarr;
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Zero Model-Training Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-neutral-950 transition text-left"
                >
                  Data Retention & Purge
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>&copy; {new Date().getFullYear()} AnchorAI. All rights reserved.</span>
            <span className="hidden sm:inline text-neutral-300">·</span>
            <span className="text-[11px] font-mono text-neutral-400">
              Built for universities, students & independent researchers.
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-neutral-600 hover:text-neutral-950 transition underline-offset-2 hover:underline"
            >
              Privacy
            </button>
            <span className="text-neutral-300">·</span>
            <button
              onClick={() => onNavigate('license')}
              className="text-neutral-600 hover:text-neutral-950 transition underline-offset-2 hover:underline"
            >
              License
            </button>
            <span className="text-neutral-300">·</span>
            <button
              onClick={() => onNavigate('workspace')}
              className="text-neutral-600 hover:text-neutral-950 transition underline-offset-2 hover:underline"
            >
              App
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
