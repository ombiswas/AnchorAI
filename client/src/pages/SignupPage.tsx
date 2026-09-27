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
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        {/* Eyebrow & Header */}
        <div className="mb-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-600">
            Get Started
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            Join AnchorAI to unlock document-grounded AI study workflows.
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-md border border-red-300 bg-red-50 p-3.5 text-sm text-red-900">
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
            <span className="text-xs font-semibold">{activeError}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800"
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
              className="mt-1.5 h-11 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800"
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
              className="mt-1.5 h-11 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800"
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
              className="mt-1.5 h-11 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-800"
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
              className="mt-1.5 h-11 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-md bg-neutral-950 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 border-t border-neutral-200 pt-5 text-center">
          <p className="text-xs text-neutral-600">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-semibold text-neutral-950 underline underline-offset-2 hover:text-black"
            >
              Sign In &rarr;
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
