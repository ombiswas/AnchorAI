import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  currentView: 'home' | 'workspace' | 'login' | 'signup';
  onNavigate: (view: 'home' | 'workspace' | 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('home')}
          className="flex cursor-pointer items-center gap-2 sm:gap-2.5 transition hover:opacity-85 shrink-0"
        >
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-950 text-white shadow-2xs">
            <svg
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white"
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
          <span className="font-heading text-[15px] sm:text-[16px] font-semibold tracking-tight text-zinc-950">
            Anchor
            <span className="ml-0.5 font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-wider text-zinc-500">
              AI
            </span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={() => onNavigate('home')}
            className={`btn-press rounded-md px-2.5 sm:px-3 py-1 sm:py-1.5 font-body text-[12px] sm:text-[13px] font-medium transition-colors ${
              currentView === 'home'
                ? 'bg-zinc-100 text-zinc-950 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => onNavigate('workspace')}
            className={`btn-press rounded-md px-2.5 sm:px-3 py-1 sm:py-1.5 font-body text-[12px] sm:text-[13px] font-medium transition-colors ${
              currentView === 'workspace'
                ? 'bg-zinc-100 text-zinc-950 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
          >
            Workspace
          </button>

          {isAuthenticated ? (
            <div className="ml-1 sm:ml-2 flex items-center gap-2 sm:gap-2.5 border-l border-zinc-200 pl-2 sm:pl-3">
              <span className="hidden font-mono text-[11px] text-zinc-600 md:inline-block max-w-[120px] truncate">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="btn-press rounded-md border border-zinc-200 bg-white px-2 sm:px-2.5 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 shadow-2xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="ml-1 sm:ml-2 flex items-center gap-1.5 sm:gap-2 border-l border-zinc-200 pl-2 sm:pl-3">
              <button
                onClick={() => onNavigate('login')}
                className={`btn-press rounded-md px-2 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider transition ${
                  currentView === 'login'
                    ? 'font-bold text-zinc-950'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="btn-press rounded-md bg-zinc-950 px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-white transition hover:bg-zinc-800 shadow-2xs"
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
