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

    // Client-side validations
    if (!name.trim() || name.trim().length < 2) {
      setFormError('Name must be at least 2 characters');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters');
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
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[4px] border border-neutral-200 bg-white p-8 shadow-sm">
        {/* Eyebrow & Header */}
        <div className="mb-6">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            Get Started
          </span>
          <h1 className="mt-1 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Join AnchorAI to unlock document-grounded AI study workflows.
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-[4px] border border-red-200 bg-red-50/70 p-3 text-sm text-red-800">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium">{activeError}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-700"
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
              placeholder="Alex Smith"
              className="mt-1.5 w-full rounded-[4px] border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-700"
            >
              Email Address
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
              className="mt-1.5 w-full rounded-[4px] border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-700"
            >
              Password (min. 6 characters)
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
              className="mt-1.5 w-full rounded-[4px] border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="••••••••••••"
              className="mt-1.5 w-full rounded-[4px] border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center rounded-[4px] bg-black py-2.5 font-mono text-xs font-medium uppercase tracking-[0.05em] text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
          <p className="text-xs text-neutral-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-medium text-black underline underline-offset-4 hover:text-neutral-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
