import React, { useEffect } from 'react';

interface LicensePageProps {
  onBack: () => void;
}

export const LicensePage: React.FC<LicensePageProps> = ({ onBack }) => {
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
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
            Open Source & Academic Commons
          </span>
          <span className="text-neutral-300">·</span>
          <span className="font-mono text-xs text-neutral-500">
            MIT License
          </span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
          Software License & Academic Terms
        </h1>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed font-body">
          AnchorAI is released under the permissive MIT Open Source License, encouraging students,
          professors, and academic researchers to inspect, extend, and deploy the platform freely.
        </p>
      </div>

      {/* Official MIT License Code Box */}
      <div className="mt-6 rounded-xl border border-neutral-300 bg-neutral-900 p-6 sm:p-8 text-neutral-100 shadow-sm font-mono text-xs leading-relaxed">
        <div className="border-b border-neutral-800 pb-3 text-[11px] uppercase tracking-widest text-neutral-400">
          Official License Text (MIT)
        </div>
        <div className="mt-4 space-y-4 text-neutral-300">
          <p>Copyright (c) 2026 AnchorAI Contributors & Developers</p>
          <p>
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the &quot;Software&quot;), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </p>
          <p>
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </p>
          <p className="text-neutral-400">
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>
        </div>
      </div>

      {/* Educational & Academic Guidelines */}
      <div className="mt-8 space-y-8 rounded-xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-xs text-neutral-800">
        <section>
          <h2 className="text-lg font-bold text-neutral-950">1. Academic Integrity & Responsible Usage</h2>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600 font-body">
            AnchorAI is engineered as an active study aid, research assistant, and exam diagnostic tool. It is designed to foster deep understanding through grounded retrieval, citation checks, and Bloom&apos;s taxonomy practice testing.
          </p>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-600 font-body">
            Users must comply with their institution&apos;s honor codes and academic policies regarding AI assistance, exam environments, and course material distribution.
          </p>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">2. Third-Party Libraries & Software Attributions</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-neutral-600">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <span className="font-semibold text-neutral-900 block">React & Vite</span>
              <span>Client framework and high-speed bundling pipeline. (MIT License)</span>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <span className="font-semibold text-neutral-900 block">Together AI & Llama 3</span>
              <span>Inference acceleration and open-weights LLMs. (Community License)</span>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <span className="font-semibold text-neutral-900 block">MongoDB Atlas</span>
              <span>Vector Search and high-dimensional cosine indexing. (SSPL / Commercial)</span>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <span className="font-semibold text-neutral-900 block">Tesseract.js & PDF-Parse</span>
              <span>Client/Server optical character recognition and extraction. (Apache 2.0 / MIT)</span>
            </div>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section>
          <h2 className="text-lg font-bold text-neutral-950">3. AI Accuracy & Educational Disclaimer</h2>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600 font-body">
            While AnchorAI employs cosine similarity thresholding and verbatim citation enforcement to minimize factual errors, generative models can occasionally produce inaccurate interpretations. Always verify citations against your primary textbook or professor slides prior to graded examinations.
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
