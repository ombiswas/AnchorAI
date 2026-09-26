import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const WorkspacePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Top Banner with Brand Contrast */}
      <div className="mb-8 rounded-[4px] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">
                Session Active
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-medium tracking-tight text-neutral-950">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Account: <span className="font-mono text-neutral-700">{user?.email}</span>
            </p>
          </div>

          <button
            onClick={logout}
            className="inline-flex h-9 items-center justify-center rounded-[4px] border border-neutral-300 bg-white px-4 font-mono text-xs font-medium uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Auth Verification Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[4px] border border-neutral-200 bg-white p-6">
          <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            Auth State Verification
          </span>
          <h2 className="mt-2 text-lg font-medium text-neutral-900">JWT Session Details</h2>
          <div className="mt-4 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">USER ID</span>
              <span className="text-neutral-800">{user?.id}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">EMAIL</span>
              <span className="text-neutral-800">{user?.email}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">TOKEN STORAGE</span>
              <span className="text-neutral-800">In-Memory + Session Fallback</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">AUTH STATUS</span>
              <span className="font-medium text-emerald-600">VERIFIED / ATTACHED</span>
            </div>
          </div>
        </div>

        {/* Milestone Card */}
        <div className="rounded-[4px] border border-neutral-200 bg-[#010120] p-6 text-white">
          <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400">
            Phase 1a Complete
          </span>
          <h2 className="mt-2 text-lg font-medium text-white">Core Authentication Ready</h2>
          <p className="mt-2 text-sm text-neutral-300">
            Authentication with bcrypt (cost 12), JWT issuance, protected routing, and Zod schema
            validation is fully operational.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center rounded-[3px] bg-neutral-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-300">
              Next Step: Phase 1b (Document Upload)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
