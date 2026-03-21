import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRouter } from './hooks/useRouter';
import { Navbar } from './components/shared/Navbar';
import { LoginPage, RegisterPage } from './components/auth/AuthPages';
import { JobsPage, JobDetailPage } from './components/shared/JobsPages';
import { EmployerDashboard, JobFormPage, ApplicantsPage } from './components/employer/EmployerPages';
import { ApplicantDashboard, BookmarksPage, ApplyModal } from './components/applicant/ApplicantPages';
import { ToastContainer, Modal, Button, type ToastData } from './components/shared/UI';
import { api } from './mocks/api';
import type { Job } from './types';

let toastCounter = 0;

function AppInner() {
  const { user, isLoading } = useAuth();
  const { path, navigate, matchPath } = useRouter();
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isLightTheme, setIsLightTheme] = useState(() => localStorage.getItem('jb_theme') === 'light');
  const [showGreeting, setShowGreeting] = useState(true);

  // Mark greeting as shown when dismissed
  const handleCloseGreeting = () => {
    setShowGreeting(false);
    localStorage.setItem('greeting_shown', 'true');
  };

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
      localStorage.setItem('jb_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('jb_theme', 'dark');
    }
  }, [isLightTheme]);

  const toggleTheme = () => setIsLightTheme(!isLightTheme);

  const addToast = (message: string, type: ToastData['type'] = 'success') => {
    const id = String(++toastCounter);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Listen for apply-modal events from JobDetailPage
  useEffect(() => {
    const handler = (e: Event) => {
      const { jobId } = (e as CustomEvent).detail;
      const job = api.getJob(jobId);
      if (job) setApplyJob(job);
    };
    window.addEventListener('open-apply-modal', handler);
    return () => window.removeEventListener('open-apply-modal', handler);
  }, []);

  if (isLoading) return <div className="loading-screen" data-testid="loading-screen">Loading…</div>;

  // Guard helper
  const requireAuth = (role?: 'employer' | 'applicant') => {
    if (!user) { navigate('/login'); return false; }
    if (role && user.role !== role) { navigate('/unauthorized'); return false; }
    return true;
  };

  // Route matching
  const renderPage = () => {
    if (path === '/' || path === '') {
      if (user?.role === 'employer') { navigate('/employer/dashboard'); return null; }
      if (user?.role === 'applicant') { navigate('/applicant/dashboard'); return null; }
      navigate('/jobs'); return null;
    }

    if (path === '/login') return <LoginPage onNavigate={navigate} />;
    if (path === '/register') return <RegisterPage onNavigate={navigate} />;
    if (path === '/jobs') return <JobsPage onNavigate={navigate} />;

    const jobDetail = matchPath('/jobs/:id', path);
    if (jobDetail) return <JobDetailPage jobId={jobDetail.id} onNavigate={navigate} />;

    if (path === '/employer/dashboard') {
      if (!requireAuth('employer')) return null;
      return <EmployerDashboard onNavigate={navigate} />;
    }
    if (path === '/employer/jobs/new') {
      if (!requireAuth('employer')) return null;
      return <JobFormPage onNavigate={navigate} />;
    }
    const editJob = matchPath('/employer/jobs/:id/edit', path);
    if (editJob) {
      if (!requireAuth('employer')) return null;
      return <JobFormPage jobId={editJob.id} onNavigate={navigate} />;
    }
    const applicants = matchPath('/employer/jobs/:id/applicants', path);
    if (applicants) {
      if (!requireAuth('employer')) return null;
      return <ApplicantsPage jobId={applicants.id} onNavigate={navigate} />;
    }

    if (path === '/applicant/dashboard') {
      if (!requireAuth('applicant')) return null;
      return <ApplicantDashboard onNavigate={navigate} />;
    }
    if (path === '/applicant/bookmarks') {
      if (!requireAuth('applicant')) return null;
      return <BookmarksPage onNavigate={navigate} />;
    }

    if (path === '/unauthorized') return (
      <div className="page" data-testid="unauthorized-page">
        <div className="error-page">
          <div className="error-code">403</div>
          <h1>Access denied</h1>
          <p>You don't have permission to view this page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')} data-testid="go-home">Go home</button>
        </div>
      </div>
    );

    return (
      <div className="page" data-testid="not-found-page">
        <div className="error-page">
          <div className="error-code">404</div>
          <h1>Page not found</h1>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')} data-testid="go-home">Go home</button>
        </div>
      </div>
    );
  };

  return (
    <div className="app" data-testid="app">
      <Navbar
        onNavigate={navigate}
        currentPath={path}
        theme={isLightTheme ? 'light' : 'dark'}
        onToggleTheme={toggleTheme}
      />
      <main className="main-content">
        {renderPage()}
      </main>

      {applyJob && (
        <ApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onSuccess={() => {
            setApplyJob(null);
            addToast(`Application submitted for "${applyJob.title}"!`);
          }}
        />
      )}

      {showGreeting && (
        <Modal
          title="🎭 Welcome, Ashlesha!"
          onClose={handleCloseGreeting}
          data-testid="greeting-modal"
        >
          <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.6' }}>
            Welcome to <strong>HireBoard</strong>, built by <strong>Aditya</strong>! 🚀
          </p>
          <p style={{ marginBottom: '12px', fontSize: '15px', lineHeight: '1.6', color: 'var(--text2)' }}>
            You're about to embark on an amazing journey to master Playwright end-to-end testing. This job portal app is your playground — test it, break it, and learn from it!
          </p>
          <p style={{ marginBottom: '20px', fontSize: '15px', lineHeight: '1.6', color: 'var(--text2)' }}>
            Whether you're exploring the auth flow, testing user roles, or crafting perfect locators — every phase builds your Playwright superpowers. Best of luck! You've got this! 💪
          </p>
          <Button onClick={handleCloseGreeting} data-testid="greeting-close-btn" className="btn-primary">
            Let's get started
          </Button>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
