import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRedirectToLogin?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  onRedirectToLogin,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && onRedirectToLogin) {
      onRedirectToLogin();
    }
  }, [isLoading, isAuthenticated, onRedirectToLogin]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">
            Verifying Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md rounded border border-neutral-200 bg-white p-8">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-neutral-500">
            Access Restricted
          </span>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-neutral-900">
            Authentication Required
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            Please sign in to your AnchorAI account to access this workspace and your study
            materials.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                if (onRedirectToLogin) {
                  onRedirectToLogin();
                } else {
                  window.location.hash = '#login';
                }
              }}
              className="inline-flex h-9 items-center justify-center rounded bg-black px-6 font-mono text-xs font-medium uppercase tracking-wider text-white transition hover:bg-neutral-800"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
