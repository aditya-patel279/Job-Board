import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props { onNavigate: (path: string) => void; currentPath: string; }

export const Navbar: React.FC<Props> = ({ onNavigate, currentPath }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); onNavigate('/'); };

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="nav-inner">
        <button className="nav-logo" onClick={() => onNavigate('/')} data-testid="nav-logo">
          ◈ HireBoard
        </button>

        <div className="nav-links">
          <button
            className={`nav-link ${currentPath === '/jobs' ? 'active' : ''}`}
            onClick={() => onNavigate('/jobs')}
            data-testid="nav-jobs"
          >
            Browse Jobs
          </button>

          {user?.role === 'employer' && (
            <button
              className={`nav-link ${currentPath.startsWith('/employer') ? 'active' : ''}`}
              onClick={() => onNavigate('/employer/dashboard')}
              data-testid="nav-employer-dashboard"
            >
              Dashboard
            </button>
          )}

          {user?.role === 'applicant' && (
            <>
              <button
                className={`nav-link ${currentPath === '/applicant/dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('/applicant/dashboard')}
                data-testid="nav-applicant-dashboard"
              >
                My Applications
              </button>
              <button
                className={`nav-link ${currentPath === '/applicant/bookmarks' ? 'active' : ''}`}
                onClick={() => onNavigate('/applicant/bookmarks')}
                data-testid="nav-bookmarks"
              >
                Saved Jobs
              </button>
            </>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="nav-user" data-testid="nav-user">
              <span className="nav-user-name" data-testid="nav-user-name">{user.name}</span>
              <span className="nav-role-badge" data-testid="nav-role-badge">{user.role}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} data-testid="logout-button">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('/login')} data-testid="nav-login">
                Login
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/register')} data-testid="nav-register">
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
