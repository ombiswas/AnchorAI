import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LandingHeroProps {
  onNavigateToSignup: () => void;
  onNavigateToWorkspace: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onNavigateToSignup,
  onNavigateToWorkspace,
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Band Dark */}
      <section className="relative overflow-hidden bg-[#010120] px-4 py-20 text-white sm:px-8 sm:py-24">
        {/* Subtle decorative gradient ribbon */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #fc4c02 0%, #ef2cc1 50%, #bdbbff 100%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#bdbbff]">
            Platform Overview · Phase 1a
          </span>

          <h1 className="mt-4 text-4xl font-medium tracking-tight text-white sm:text-6xl">
            Ground your study sessions in verified lecture notes.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-neutral-300">
            AnchorAI couples document ingestion, vector retrieval, and automated quiz evaluations
            with a rigorous, high-contrast workspace designed for focused learning.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onNavigateToWorkspace}
                className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[#c8f6f9] px-6 font-mono text-xs font-medium uppercase tracking-wider text-black transition hover:bg-[#b2f1f5]"
              >
                Go to Workspace →
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateToSignup}
                  className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[#c8f6f9] px-6 font-mono text-xs font-medium uppercase tracking-wider text-black transition hover:bg-[#b2f1f5]"
                >
                  Get Started Now
                </button>
                <button
                  onClick={onNavigateToWorkspace}
                  className="inline-flex h-10 items-center justify-center rounded-[4px] border border-neutral-700 bg-transparent px-6 font-mono text-xs font-medium uppercase tracking-wider text-white transition hover:bg-neutral-800"
                >
                  View Workspace Demo
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Architecture Cards (Canvas White) */}
      <section className="bg-white px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
              System Architecture
            </span>
            <h2 className="mt-1 text-2xl font-medium tracking-tight text-neutral-950">
              Engineered with production-grade boundaries
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[4px] border border-neutral-200 p-6">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Phase 1a · Completed
              </span>
              <h3 className="mt-2 text-lg font-medium text-neutral-900">
                Identity & Access Security
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Mongoose User indexing, bcrypt password hashing with cost factor 12, JWT
                authentication, and timing-safe enumeration protection.
              </p>
            </div>

            <div className="rounded-[4px] border border-neutral-200 p-6">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Phase 1b-d · Planned
              </span>
              <h3 className="mt-2 text-lg font-medium text-neutral-900">Token-Aware Vector RAG</h3>
              <p className="mt-2 text-sm text-neutral-600">
                PDF text extraction with artifact cleanup, ~400 token chunking, OpenAI embeddings,
                and page-cited answers.
              </p>
            </div>

            <div className="rounded-[4px] border border-neutral-200 p-6">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Phase 2-4 · Planned
              </span>
              <h3 className="mt-2 text-lg font-medium text-neutral-900">OCR & Adaptive Quizzing</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Tesseract + Vision LLM OCR for handwritten diagrams, strict schema quiz generation,
                and rolling topic mastery analytics.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
