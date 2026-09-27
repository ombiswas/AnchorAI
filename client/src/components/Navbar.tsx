import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

interface NavbarProps {
  currentView: 'home' | 'workspace' | 'login' | 'signup' | 'privacy' | 'license';
  onNavigate: (view: 'home' | 'workspace' | 'login' | 'signup' | 'privacy' | 'license') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(0);
  const isDark = currentView === 'home';

  // Track scroll position and direction for smart hide/reveal
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Track if scrolled away from top
      setIsScrolled(currentScrollY > 20);

      // Always show at or near the top
      if (currentScrollY <= 40) {
        setIsVisible(true);
      } else {
        const diff = currentScrollY - lastScrollY.current;
        // Threshold of 8px prevents jitter on minor trackpad touches
        if (diff > 8) {
          // Scrolling DOWN -> hide navbar
          setIsVisible(false);
          setIsProfileMenuOpen(false);
        } else if (diff < -8) {
          // Scrolling UP -> reveal navbar
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleConfirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setDeleteAccountError(null);
      await api.auth.deleteAccount();
      setIsDeleteModalOpen(false);
      logout();
      onNavigate('home');
    } catch (err) {
      setDeleteAccountError((err as Error).message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isDark
            ? isScrolled
              ? 'border-b border-neutral-800/90 bg-[#010120]/95 backdrop-blur-md text-white shadow-md'
              : 'border-b border-transparent bg-[#010120] text-white'
            : 'border-b border-neutral-200/80 bg-white/95 backdrop-blur-md text-zinc-950 shadow-2xs'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3.5">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('home')}
            className="flex cursor-pointer items-center gap-2 sm:gap-2.5 transition hover:opacity-85 shrink-0"
          >
            <div
              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md border shadow-2xs ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900 text-white'
                  : 'border-zinc-200 bg-zinc-950 text-white'
              }`}
            >
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
            <span
              className={`font-heading text-[15px] sm:text-[16px] font-semibold tracking-tight ${
                isDark ? 'text-white' : 'text-zinc-950'
              }`}
            >
              Anchor
              <span
                className={`ml-0.5 font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-wider ${
                  isDark ? 'text-[#bdbbff]' : 'text-zinc-500'
                }`}
              >
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
                  ? isDark
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 text-zinc-950 font-semibold'
                  : isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => onNavigate('workspace')}
              className={`btn-press rounded-md px-2.5 sm:px-3 py-1 sm:py-1.5 font-body text-[12px] sm:text-[13px] font-medium transition-colors ${
                currentView === 'workspace'
                  ? isDark
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 text-zinc-950 font-semibold'
                  : isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              Workspace
            </button>

            {isAuthenticated ? (
              /* Profile Icon with Dropdown Menu */
              <div className="relative ml-1 sm:ml-2" ref={menuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className={`btn-press flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border transition font-mono text-xs font-semibold ${
                    isDark
                      ? 'border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700 hover:border-neutral-600'
                      : 'border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 hover:border-zinc-300'
                  }`}
                  title="Account profile & menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  {user?.name ? (
                    user.name.trim().charAt(0).toUpperCase()
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </button>

                {/* Profile Floating Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-xl border p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
                      isDark
                        ? 'border-neutral-800 bg-[#090924] text-white shadow-black'
                        : 'border-neutral-200 bg-white text-neutral-900 shadow-neutral-900/15'
                    }`}
                  >
                    {/* User Identity Header */}
                    <div
                      className={`px-3 py-2.5 rounded-lg border mb-1.5 ${
                        isDark
                          ? 'border-neutral-800 bg-neutral-900'
                          : 'border-neutral-200 bg-neutral-100'
                      }`}
                    >
                      <p className="font-heading text-xs font-semibold tracking-tight truncate">
                        {user?.name || 'Study Explorer'}
                      </p>
                      <p
                        className={`font-mono text-[11px] truncate mt-0.5 ${
                          isDark ? 'text-neutral-400' : 'text-neutral-500'
                        }`}
                      >
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu Actions */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                          onNavigate('home');
                        }}
                        className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                          isDark
                            ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                        }`}
                      >
                        <svg
                          className="h-4 w-4 shrink-0 text-neutral-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Sign Out</span>
                      </button>

                      <div
                        className={`border-t my-1 ${
                          isDark ? 'border-neutral-800' : 'border-neutral-200'
                        }`}
                      />

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setDeleteAccountError(null);
                          setIsDeleteModalOpen(true);
                        }}
                        className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                          isDark
                            ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        <svg
                          className="h-4 w-4 shrink-0 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`ml-1 sm:ml-2 flex items-center gap-1.5 sm:gap-2 border-l pl-2 sm:pl-3 ${
                  isDark ? 'border-neutral-800' : 'border-zinc-200'
                }`}
              >
                <button
                  onClick={() => onNavigate('login')}
                  className={`btn-press rounded-md px-2 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider transition ${
                    currentView === 'login'
                      ? isDark
                        ? 'font-bold text-white'
                        : 'font-bold text-zinc-950'
                      : isDark
                        ? 'text-neutral-300 hover:text-white'
                        : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className={`btn-press rounded-md px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-wider transition shadow-2xs ${
                    isDark
                      ? 'bg-[#c8f6f9] text-black hover:bg-[#b2f1f5]'
                      : 'bg-zinc-950 text-white hover:bg-zinc-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-600">
                  Danger Zone
                </span>
                <h3 className="text-base font-semibold text-neutral-950">
                  Delete AnchorAI Account
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Are you sure you want to delete your account? This action is permanent and irreversible. All your study primers, lecture slide vector chunks, quizzes, attempts, and topic mastery diagnostics will be permanently deleted.
            </p>

            {deleteAccountError && (
              <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2.5 text-xs text-red-900">
                <strong>Error:</strong> {deleteAccountError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-red-700 disabled:opacity-50 shadow-sm"
              >
                {isDeletingAccount ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
