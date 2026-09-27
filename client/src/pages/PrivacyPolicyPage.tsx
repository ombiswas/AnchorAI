import React, { useEffect } from 'react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition"
        >
          <span>&larr;</span>
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
            Legal & Trust
          </span>
          <span className="text-neutral-300">·</span>
          <span className="font-mono text-xs text-neutral-500">
            Last Updated: September 27, 2026
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
          Privacy Policy & Data Governance
        </h1>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed font-body">
          AnchorAI is built on a fundamental principle: your academic notes, slides, and study
          conversations belong entirely to you. We maintain a strict zero-retention policy for AI model
          training.
        </p>
      </div>

      {/* Key Guarantees Callout Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-900">
            <svg className="h-3.5 w-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Zero Model Training</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-600 font-body leading-relaxed">
            Your uploaded documents and study queries are never used to train or fine-tune public LLMs.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-900">
            <svg className="h-3.5 w-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>1-Click Total Purge</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-600 font-body leading-relaxed">
            Deleting a document immediately deletes its source text, extracted chunks, and vector embeddings forever.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-900">
            <svg className="h-3.5 w-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Encrypted Isolation</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-600 font-body leading-relaxed">
            All user data is partitioned by strictly authenticated user IDs and encrypted with TLS/SSL in transit.
          </p>
        </div>
      </div>

      {/* Structured Legal Content */}
      <div className="mt-8 space-y-8 rounded-xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-xs text-neutral-800">
        <section>
          <h2 className="text-lg font-bold text-neutral-950">1. Information We Collect</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600">
            <p>
              When you create an account and interact with AnchorAI, we collect the minimum necessary data to provide grounded study assistance:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Account Credentials:</strong> Your name, email address, and an encrypted password hash (salted using bcrypt with cost factor 12).
              </li>
              <li>
                <strong>Course Materials & Ingested Files:</strong> Course documents, syllabus PDFs, handwritten notes images (OCR-processed), and topic primers generated at your request.
              </li>
              <li>
                <strong>Vector Chunks & Embeddings:</strong> Text segments of ~400 tokens each and their mathematical vector representations stored in MongoDB Atlas Vector Search.
              </li>
              <li>
                <strong>Study Interactions:</strong> Chat question logs, verbatim citation links, and practice quiz answers used to calculate your rolling mastery dashboard.
              </li>
            </ul>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">2. How We Process Documents & RAG Ingestion</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600">
            <p>
              When you upload a document, AnchorAI parses the text, strips layout artifacts, and divides it into semantic chunks with a 50-token rolling overlap to prevent contextual clipping at chunk boundaries.
            </p>
            <p>
              These chunks are converted into dense vector embeddings using standardized transformer embedding models and indexed in a secure MongoDB Atlas vector collection mapped exclusively to your account.
            </p>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">3. Artificial Intelligence & Third-Party LLM Inference</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600">
            <p>
              AnchorAI interfaces with Together AI and open-source models (including Meta Llama 3) via secure, private API gateways.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Zero Training:</strong> Data transmitted during inference is processed statelessly in-memory and is strictly forbidden from being stored or used to train third-party foundation models.
              </li>
              <li>
                <strong>Context Grounding:</strong> Only the top retrieved chunks matching your specific query are passed to the language model prompt, ensuring minimal exposure of irrelevant document sections.
              </li>
            </ul>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">4. Data Ownership & Student Rights (FERPA Alignment)</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600">
            <p>
              You retain 100% intellectual property ownership of all notes, summaries, primers, and documents you upload or generate. AnchorAI claims no copyright, license, or secondary commercial rights over your coursework.
            </p>
            <p>
              Our storage architectures respect student privacy guidelines, ensuring course materials remain isolated and strictly non-public.
            </p>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">5. Complete Document Deletion & Retention</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600">
            <p>
              You can permanently delete any document at any time directly from the Study Library. When deletion is confirmed:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 mt-2">
              <li>The source file record and all extracted text are removed from our database.</li>
              <li>Every individual chunk and corresponding vector embedding is permanently deleted from the Atlas vector index.</li>
              <li>All chat history and citations tied to the document ID are unlinked and purged.</li>
            </ol>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">6. Security Measures</h2>
          <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600">
            <p>
              We implement industry-standard protective controls:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>TLS 1.3 cryptographic transport for all HTTP and WebSocket sessions.</li>
              <li>Strict tenant isolation enforcing document ownership checks on every API request.</li>
              <li>Constant-time password comparison to prevent timing-attack enumeration.</li>
              <li>Automated rate-limiting on authentication and document ingestion endpoints.</li>
            </ul>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">7. Contact & Data Requests</h2>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600">
            If you have questions about your data, want to request an export of your study materials, or require account deletion, please contact our team at{' '}
            <a href="mailto:privacy@anchorai.edu" className="font-mono text-indigo-700 hover:underline">
              privacy@anchorai.edu
            </a>.
          </p>
        </section>
      </div>

      {/* Bottom Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="rounded-md border border-neutral-300 bg-white px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 shadow-2xs transition"
        >
          &larr; Return to AnchorAI Overview
        </button>
      </div>
    </div>
  );
};
