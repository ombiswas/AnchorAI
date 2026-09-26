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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('home')}
          className="flex cursor-pointer items-center gap-2.5 transition hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-black text-white">
            <span className="font-mono text-xs font-bold tracking-tight">⚓</span>
          </div>
          <span className="text-lg font-medium tracking-tight text-neutral-950">
            Anchor
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">AI</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => onNavigate('home')}
            className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition ${
              currentView === 'home'
                ? 'bg-neutral-100 text-neutral-950'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => onNavigate('workspace')}
            className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition ${
              currentView === 'workspace'
                ? 'bg-neutral-100 text-neutral-950'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Workspace
          </button>

          {isAuthenticated ? (
            <div className="ml-2 flex items-center gap-3 border-l border-neutral-200 pl-3">
              <span className="hidden font-mono text-[11px] text-neutral-600 sm:inline-block">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="rounded-[4px] border border-neutral-300 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-neutral-800 transition hover:bg-neutral-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2 border-l border-neutral-200 pl-3">
              <button
                onClick={() => onNavigate('login')}
                className={`rounded-[4px] px-3 py-1 font-mono text-xs uppercase tracking-wider transition ${
                  currentView === 'login'
                    ? 'font-bold text-black'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="rounded-[4px] bg-black px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition hover:bg-neutral-800"
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
