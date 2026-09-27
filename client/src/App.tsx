import React, { useState } from 'react';
import { Footer } from './components/Footer';
import { LandingHero } from './components/LandingHero';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { LicensePage } from './pages/LicensePage';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { SignupPage } from './pages/SignupPage';
import { WorkspacePage } from './pages/WorkspacePage';

export type ViewMode = 'home' | 'workspace' | 'login' | 'signup' | 'privacy' | 'license';

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
            onNavigateToPrivacy={() => setCurrentView('privacy')}
            onNavigateToLicense={() => setCurrentView('license')}
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

        {currentView === 'privacy' && (
          <PrivacyPolicyPage onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'license' && (
          <LicensePage onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'workspace' && (
          <ProtectedRoute onRedirectToLogin={() => setCurrentView('login')}>
            <WorkspacePage />
          </ProtectedRoute>
        )}
      </main>

      {/* Structured Comprehensive Footer (hidden in workspace view for a clean native app chat experience) */}
      {currentView !== 'workspace' && (
        <Footer onNavigate={setCurrentView} />
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
