import React from 'react';

/**
 * Skeleton placeholder for the Curriculum Diagnostics / Analytics Dashboard tab
 */
export const DashboardTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" aria-label="Loading dashboard analytics">
      {/* Top Banner Skeleton */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 rounded bg-zinc-200" />
              <div className="h-3 w-3 rounded-full bg-zinc-100" />
              <div className="h-3 w-36 rounded bg-zinc-100" />
            </div>
            <div className="h-7 w-64 rounded bg-zinc-300" />
            <div className="h-4 w-80 max-w-full rounded bg-zinc-200" />
          </div>
          <div className="h-9 w-40 rounded-md bg-zinc-200" />
        </div>

        {/* 4 Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3.5 space-y-2">
              <div className="h-3 w-20 rounded bg-zinc-200" />
              <div className="h-7 w-14 rounded bg-zinc-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Middle Grid: Subject Breakdown & Weak Topics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Subject Breakdown Card Skeleton */}
        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="h-4 w-36 rounded bg-zinc-300" />
            <div className="h-3 w-16 rounded bg-zinc-200" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-28 rounded bg-zinc-300" />
                  <div className="h-3 w-14 rounded bg-zinc-200" />
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics Card Skeleton */}
        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="h-4 w-32 rounded bg-zinc-300" />
            <div className="h-3 w-20 rounded bg-zinc-200" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-32 rounded bg-zinc-300" />
                  <div className="h-5 w-16 rounded-full bg-zinc-200" />
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Recent Attempts Skeleton */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="h-4 w-44 rounded bg-zinc-300" />
        <div className="space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/40 p-3">
              <div className="space-y-1.5">
                <div className="h-3.5 w-48 rounded bg-zinc-300" />
                <div className="h-2.5 w-24 rounded bg-zinc-200" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-12 rounded bg-zinc-200" />
                <div className="h-7 w-20 rounded bg-zinc-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton placeholder for the Study Library tab
 */
export const LibraryTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" aria-label="Loading study library">
      {/* Upload Zone Skeleton */}
      <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center space-y-3">
        <div className="mx-auto h-10 w-10 rounded-lg bg-zinc-200" />
        <div className="mx-auto h-4 w-56 rounded bg-zinc-300" />
        <div className="mx-auto h-3 w-72 max-w-full rounded bg-zinc-200" />
      </div>

      {/* Document List Skeleton Card */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-5 py-4">
          <div className="space-y-1.5">
            <div className="h-2.5 w-20 rounded bg-zinc-200" />
            <div className="h-4 w-40 rounded bg-zinc-300" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-md bg-zinc-200" />
            <div className="h-8 w-24 rounded-md bg-zinc-200" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-md bg-zinc-200" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-zinc-300" />
                  <div className="flex gap-2">
                    <div className="h-3 w-16 rounded bg-zinc-200" />
                    <div className="h-3 w-20 rounded bg-zinc-200" />
                    <div className="h-3 w-24 rounded bg-zinc-200" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 rounded-md bg-zinc-200" />
                <div className="h-8 w-16 rounded-md bg-zinc-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
