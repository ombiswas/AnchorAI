import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LandingHeroProps {
  onNavigateToSignup: () => void;
  onNavigateToWorkspace: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToLicense?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onNavigateToSignup,
  onNavigateToWorkspace,
  onNavigateToPrivacy,
  onNavigateToLicense,
}) => {
  const { isAuthenticated } = useAuth();
  const [activeDemoTab, setActiveDemoTab] = useState<'chat' | 'quiz'>('chat');
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [appendedDemo, setAppendedDemo] = useState(false);

  const handleCopyDemo = () => {
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  const handleAppendDemo = () => {
    setAppendedDemo(true);
    setTimeout(() => setAppendedDemo(false), 2500);
  };

  return (
    <div className="flex flex-col bg-white">
      {/* 1. HERO SECTION (HIGH-CONTRAST TOGETHER AI CANVAS-DARK #010120) */}
      <section className="relative overflow-hidden bg-[#010120] pb-20 pt-16 text-white sm:pb-28 sm:pt-20">
        {/* Ambient Gradient Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, #6366f1 50%, transparent 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/4 h-[450px] w-[450px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #fc4c02 0%, #ef2cc1 50%, #bdbbff 100%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/80 px-3.5 py-1 text-xs font-mono text-[#bdbbff] shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              AnchorAI Platform · Production v1.0
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300">Grounded In Course Notes</span>
          </div>

          {/* Main Headline */}
          <h1 className="mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.12]">
            Study smarter with AI grounded in your actual course materials.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-neutral-300 leading-relaxed font-body">
            Stop worrying about hallucinated facts. AnchorAI indexes your lecture slides, handwritten
            notes, and generated primers into vector search. Ask questions with verbatim page citations,
            generate Bloom&apos;s taxonomy quizzes, and drill weak conceptual areas.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onNavigateToWorkspace}
                className="btn-press inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#c8f6f9] px-6 font-mono text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#b2f1f5] shadow-sm"
              >
                <span>Launch Workspace</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateToSignup}
                  className="btn-press inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#c8f6f9] px-6 font-mono text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#b2f1f5] shadow-sm"
                >
                  <span>Get Started Free</span>
                  <span>&rarr;</span>
                </button>
                <button
                  onClick={onNavigateToWorkspace}
                  className="btn-press inline-flex h-11 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900/90 px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800"
                >
                  Explore Demo Workspace
                </button>
              </>
            )}

            <div className="flex items-center gap-2 pl-2 text-xs font-mono text-neutral-400">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Zero model training on student notes</span>
            </div>
          </div>

          {/* INTERACTIVE WORKSPACE PREVIEW CARD (MOCK DEMO) */}
          <div className="mt-12 overflow-hidden rounded-xl border border-neutral-700/80 bg-neutral-950/90 shadow-2xl backdrop-blur-xl">
            {/* Window Topbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-neutral-400 truncate max-w-[200px] sm:max-w-none">
                  anchor-ai // CS401-Distributed-Systems.pdf
                </span>
              </div>

              {/* Demo Tabs */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => setActiveDemoTab('chat')}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1 transition ${
                    activeDemoTab === 'chat'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Grounded Chat</span>
                </button>
                <button
                  onClick={() => setActiveDemoTab('quiz')}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1 transition ${
                    activeDemoTab === 'quiz'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Bloom Quiz</span>
                </button>
              </div>
            </div>

            {/* Demo Body */}
            <div className="p-4 sm:p-6 text-neutral-200">
              {activeDemoTab === 'chat' ? (
                <div className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-md rounded-lg bg-neutral-800 px-4 py-2.5 text-xs sm:text-sm text-neutral-100 shadow-sm border border-neutral-700">
                      Explain the two phases of Paxos consensus and compare them in a summary table.
                    </div>
                  </div>

                  {/* AI Assistant Grounded Response */}
                  <div className="rounded-lg border border-neutral-800 bg-[#070719] p-4 sm:p-5 shadow-sm">
                    {/* Header meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Grounded in Notes (Cosine 0.91)
                        </span>
                        <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-300">
                          Page 14
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyDemo}
                          className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 font-mono text-[10px] text-neutral-300 hover:bg-neutral-700"
                        >
                          {copiedDemo ? '✓ Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={handleAppendDemo}
                          className="inline-flex items-center gap-1 rounded border border-indigo-500/50 bg-indigo-950/50 px-2 py-1 font-mono text-[10px] text-indigo-300 hover:bg-indigo-900/60"
                        >
                          {appendedDemo ? '✓ Saved to Notes' : '+ Append to Guide'}
                        </button>
                      </div>
                    </div>

                    {/* Grounded Content */}
                    <div className="mt-3 space-y-3 text-xs sm:text-sm leading-relaxed text-neutral-300">
                      <p>
                        Based on your lecture notes on <strong className="text-white">Distributed Consensus (Slide 14)</strong>, Paxos operates in two distinct rounds to guarantee safety under network partitions:
                      </p>

                      {/* Responsive Table */}
                      <div className="overflow-x-auto rounded border border-neutral-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase">
                            <tr>
                              <th className="p-2.5">Protocol Phase</th>
                              <th className="p-2.5">Proposer Action</th>
                              <th className="p-2.5">Acceptor Guarantee</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 font-body">
                            <tr className="hover:bg-neutral-900/40">
                              <td className="p-2.5 font-semibold text-white">Phase 1 (Prepare)</td>
                              <td className="p-2.5">Broadcasts proposal number $n$</td>
                              <td className="p-2.5">Promises to reject any proposal with ID &lt; $n$</td>
                            </tr>
                            <tr className="hover:bg-neutral-900/40">
                              <td className="p-2.5 font-semibold text-white">Phase 2 (Accept)</td>
                              <td className="p-2.5">Sends value $v$ if majority promised</td>
                              <td className="p-2.5">Registers commit if no higher promise exists</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="rounded-md border border-neutral-800 bg-neutral-900/60 p-2.5 text-neutral-400 text-xs font-mono">
                        Source Citation: &quot;Paxos prevents split-brain by requiring a strict majority quorum $Q &gt; N/2$ in both rounds.&quot; (Lecture Notes, Page 14)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active Quiz Preview */}
                  <div className="rounded-lg border border-neutral-800 bg-[#070719] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400">Question 3 of 5</span>
                        <span className="text-neutral-600">·</span>
                        <span className="rounded bg-indigo-950 border border-indigo-700/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-indigo-300">
                          Bloom&apos;s: Analytical Reasoning
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">Score: 80%</span>
                    </div>

                    <h4 className="mt-3 text-sm font-semibold text-white">
                      In a 5-node cluster running Paxos, a network partition divides the nodes into a group of 3 and a group of 2. Which partition can commit transactions?
                    </h4>

                    {/* Options */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2.5 rounded border border-emerald-500/80 bg-emerald-950/40 p-2.5 text-xs text-emerald-200">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black font-bold text-[10px]">
                          ✓
                        </span>
                        <span>
                          <strong>Option A:</strong> The 3-node partition, because it holds a majority quorum $(3 &gt; 5/2)$.
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 rounded border border-neutral-800 bg-neutral-900/30 p-2.5 text-xs text-neutral-400">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-neutral-500 text-[10px]">
                          B
                        </span>
                        <span>
                          <strong>Option B:</strong> Both partitions can commit concurrently if leaders are elected.
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-2.5 text-[11px] font-mono text-neutral-400">
                      <span>Curriculum Status: Paxos Consensus (92% · Mastered)</span>
                      <span className="text-rose-400">Weak Topic: Raft Logs (64% · Needs Review)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & ARCHITECTURAL HIGHLIGHTS */}
      <section className="border-y border-neutral-200 bg-neutral-50/60 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                100%
              </span>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-neutral-500">
                Citation Grounded
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">Verbatim page references for exam proof.</p>
            </div>
            <div>
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                &lt;250ms
              </span>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-neutral-500">
                Vector Retrieval
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">Atlas high-dimensional cosine search.</p>
            </div>
            <div>
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Zero
              </span>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-neutral-500">
                Model Training
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">Notes remain 100% private to you.</p>
            </div>
            <div>
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Bloom&apos;s
              </span>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-neutral-500">
                Diagnostic Quizzes
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">Recall, application & deep analysis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE CAPABILITIES (DEEP DIVE) */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-indigo-700">
              Complete Study Workflow
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
              Engineered for academic rigor, not just casual Q&A.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed font-body">
              AnchorAI pairs high-speed document vectorization with structured cognitive evaluation,
              giving you a reliable study engine throughout your semester.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Feature 1 */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-6 sm:p-8 hover:border-neutral-300 transition shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-sm">
                01
              </div>
              <h3 className="mt-4 text-xl font-bold text-neutral-950">
                Multi-Source Ingestion & Instant Primers
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed font-body">
                Upload course lecture slide decks, syllabus PDFs, or handwritten notes with OCR text extraction. Don&apos;t have a document yet? Use the <strong>Topic Primer Generator</strong> to create a structured, high-yield study primer embedded through the exact same vector pipeline.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-neutral-600">
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">PDF Extraction</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Tesseract OCR</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">AI Topic Primers</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-6 sm:p-8 hover:border-neutral-300 transition shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-900 text-white font-mono text-sm">
                02
              </div>
              <h3 className="mt-4 text-xl font-bold text-neutral-950">
                Grounded Vector RAG with Verbatim Citations
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed font-body">
                Every prompt searches token-aware chunk boundaries (~400 tokens with 50-token overlap). If notes cover the concept, you receive page citations and markdown comparison tables. If coverage is missing, general knowledge mode steps in—with a 1-click option to append the explanation directly to your notes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-neutral-600">
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Page Citations</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">GFM Markdown Tables</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Append to Notes</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-6 sm:p-8 hover:border-neutral-300 transition shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900 text-white font-mono text-sm">
                03
              </div>
              <h3 className="mt-4 text-xl font-bold text-neutral-950">
                Bloom&apos;s Taxonomy Diagnostic Quizzes
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed font-body">
                Move beyond simple flashcards. Generate 5-to-15 question diagnostic quizzes sampled evenly across all chunks of your document. Questions are structured across Recall, Conceptual Understanding, and Application, with thorough explanations for both correct and distracter options.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-neutral-600">
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Even Chunk Sampling</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Distracter Rationale</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Instant Evaluation</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-6 sm:p-8 hover:border-neutral-300 transition shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-sm">
                04
              </div>
              <h3 className="mt-4 text-xl font-bold text-neutral-950">
                Curriculum Mastery & Weak Topic Diagnostics
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed font-body">
                AnchorAI maintains a rolling accuracy score per conceptual topic tag. High-mastery topics are celebrated, while areas under 75% accuracy are automatically flagged for review. One click triggers a focused practice drill on your weakest concepts.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-neutral-600">
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Rolling Accuracy</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Targeted Drill Sessions</span>
                <span className="rounded bg-white border border-neutral-200 px-2 py-0.5">Exam Readiness Metric</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE STEP PROCESS */}
      <section className="border-t border-neutral-200 bg-[#fafafa] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-500">
              Methodology
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Three steps to confident exam mastery
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-2xs">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
                Step 01
              </span>
              <h4 className="mt-2 text-base font-bold text-neutral-900">Ingest Materials</h4>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-body">
                Drop your syllabus, lecture slides, or photos of your handwritten notes. AnchorAI normalizes text and generates vector embeddings.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-2xs">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
                Step 02
              </span>
              <h4 className="mt-2 text-base font-bold text-neutral-900">Ask & Synthesize</h4>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-body">
                Query complex topics. Receive grounded answers formatted with markdown headers, tables, and page citations for exam proof.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-2xs">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
                Step 03
              </span>
              <h4 className="mt-2 text-base font-bold text-neutral-900">Diagnose & Retain</h4>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed font-body">
                Take adaptive Bloom&apos;s quizzes to locate blind spots. Re-drill weak conceptual topics until your rolling accuracy clears 85%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY & ACADEMIC INTEGRITY PLEDGE */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-2xl border border-neutral-300 bg-neutral-900 p-8 sm:p-12 text-white shadow-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Student Privacy & Security Guarantee
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Your notes belong to you. Not to AI training sets.
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-neutral-300 leading-relaxed font-body">
                  We enforce zero-retention agreements with AI inference gateways. When you delete a document from your library, all associated chunks, text, and vector embeddings are permanently wiped from MongoDB Atlas.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:shrink-0">
                {onNavigateToPrivacy && (
                  <button
                    onClick={onNavigateToPrivacy}
                    className="btn-press rounded-md bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-100 shadow-sm"
                  >
                    Read Privacy Policy &rarr;
                  </button>
                )}
                {onNavigateToLicense && (
                  <button
                    onClick={onNavigateToLicense}
                    className="btn-press rounded-md border border-neutral-700 bg-neutral-800/80 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800"
                  >
                    View MIT License
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="border-t border-neutral-200 bg-neutral-50/50 py-16 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950">
            Ready to study with grounded confidence?
          </h2>
          <p className="mt-3 text-sm text-neutral-600 font-body">
            Upload your first lecture slide deck or create an AI primer in under 30 seconds.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={isAuthenticated ? onNavigateToWorkspace : onNavigateToSignup}
              className="btn-press inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-6 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 shadow-sm"
            >
              <span>{isAuthenticated ? 'Open Workspace' : 'Create Free Account'}</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={onNavigateToWorkspace}
              className="btn-press inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 shadow-2xs"
            >
              Browse Library
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
