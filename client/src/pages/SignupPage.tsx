import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SignupPageProps {
  onNavigateToLogin: () => void;
  onSignupSuccess?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin, onSignupSuccess }) => {
  const { signup, error: authError, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!name.trim() || name.trim().length < 2) {
      setFormError('Name must be at least 2 characters');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(password)) {
      setFormError('Password must contain at least one number');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (onSignupSuccess) {
        onSignupSuccess();
      }
    } catch (err) {
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = formError || authError;

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-[400px]">
        {/* Brand Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-2xs">
            <svg
              className="h-4 w-4 text-zinc-950"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="5" r="3" />
              <line x1="12" y1="22" x2="12" y2="8" />
              <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
            </svg>
          </div>

          <span className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            Registration
          </span>
          <h1 className="mt-1 font-heading text-[24px] font-semibold leading-[32px] tracking-tight text-zinc-950">
            Create an account
          </h1>
          <p className="mt-1 font-body text-[14px] leading-[20px] text-zinc-500">
            Join AnchorAI to ingest course materials and run grounded study sessions.
          </p>
        </div>

        {/* Error Notification */}
        {activeError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50/70 p-3 text-[12px] leading-[16px] text-rose-900">
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">{activeError}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="rounded-lg border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-600"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Alex Morgan"
                className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/30 px-3.5 font-body text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-600"
              >
                University Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="alex@university.edu"
                className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/30 px-3.5 font-body text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-600"
              >
                Password (min. 8 characters, 1 number)
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="••••••••••••"
                className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/30 px-3.5 font-body text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block font-mono text-[12px] font-medium uppercase tracking-wider text-zinc-600"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="••••••••••••"
                className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50/30 px-3.5 font-body text-[14px] text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-press mt-2 flex h-10 w-full items-center justify-center rounded-md bg-zinc-950 font-mono text-[12px] font-medium uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 text-center">
          <p className="font-body text-[13px] text-zinc-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-medium text-zinc-950 underline underline-offset-4 hover:text-zinc-700 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
