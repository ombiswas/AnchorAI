import React, { useState } from 'react';
import { LandingHero } from './components/LandingHero';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { WorkspacePage } from './pages/WorkspacePage';

type ViewMode = 'home' | 'workspace' | 'login' | 'signup';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('home');

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <LandingHero
            onNavigateToSignup={() => setCurrentView('signup')}
            onNavigateToWorkspace={() => setCurrentView('workspace')}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            onNavigateToSignup={() => setCurrentView('signup')}
            onLoginSuccess={() => setCurrentView('workspace')}
          />
        )}

        {currentView === 'signup' && (
          <SignupPage
            onNavigateToLogin={() => setCurrentView('login')}
            onSignupSuccess={() => setCurrentView('workspace')}
          />
        )}

        {currentView === 'workspace' && (
          <ProtectedRoute onRedirectToLogin={() => setCurrentView('login')}>
            <WorkspacePage />
          </ProtectedRoute>
        )}
      </main>

      {/* Minimalistic Wordmark Footer (hidden in workspace view for a clean native app chat experience) */}
      {currentView !== 'workspace' && (
        <footer className="border-t border-neutral-200/80 bg-white py-12 text-center">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              AnchorAI · AI-Native Study Platform
            </p>
            <div className="mt-4 font-mono text-[56px] font-bold tracking-tighter text-neutral-100 sm:text-[90px]">
              ANCHOR.AI
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
