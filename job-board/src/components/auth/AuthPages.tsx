import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../shared/UI';
import type { Role } from '../../types';

// ── Login ─────────────────────────────────────────────────────────
export const LoginPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    const user = JSON.parse(localStorage.getItem('jb_current_user') || 'null');
    onNavigate(user?.role === 'employer' ? '/employer/dashboard' : '/applicant/dashboard');
  };

  return (
    <div className="auth-page" data-testid="login-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="login-form" noValidate>
          {error && <div className="form-error" data-testid="login-error" role="alert">{error}</div>}

          <Input
            id="email" label="Email" type="email"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com" data-testid="email-input" autoComplete="email"
          />
          <Input
            id="password" label="Password" type="password"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••" data-testid="password-input" autoComplete="current-password"
          />

          <Button type="submit" loading={loading} className="btn-full" data-testid="login-submit">
            Sign in
          </Button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?{' '}
            <button className="link-btn" onClick={() => onNavigate('/register')} data-testid="go-register">
              Sign up
            </button>
          </p>
        </div>

        <div className="auth-hint" data-testid="test-credentials">
          <p><strong>Test accounts:</strong></p>
          <p>Employer: employer@test.com / password123</p>
          <p>Applicant: applicant@test.com / password123</p>
        </div>
      </div>
    </div>
  );
};

// ── Register ──────────────────────────────────────────────────────
export const RegisterPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'applicant' as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.role);
    setLoading(false);
    if (result.error) { setErrors({ form: result.error }); return; }
    onNavigate(form.role === 'employer' ? '/employer/dashboard' : '/applicant/dashboard');
  };

  return (
    <div className="auth-page" data-testid="register-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create account</h1>
          <p>Join HireBoard today</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="register-form" noValidate>
          {errors.form && <div className="form-error" data-testid="register-error" role="alert">{errors.form}</div>}

          <Input id="name" label="Full name / Company name"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name} data-testid="name-input" placeholder="Your name"
          />
          <Input id="reg-email" label="Email" type="email"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            error={errors.email} data-testid="email-input" placeholder="you@example.com"
          />
          <Input id="reg-password" label="Password" type="password"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            error={errors.password} data-testid="password-input" placeholder="Min. 8 characters"
          />

          <div className="field">
            <label className="field-label">I am a...</label>
            <div className="role-options" data-testid="role-options">
              {(['applicant', 'employer'] as Role[]).map(r => (
                <button
                  key={r} type="button"
                  className={`role-btn ${form.role === r ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  data-testid={`role-${r}`}
                >
                  {r === 'applicant' ? '🙋 Job Seeker' : '🏢 Employer'}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" loading={loading} className="btn-full" data-testid="register-submit">
            Create account
          </Button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?{' '}
            <button className="link-btn" onClick={() => onNavigate('/login')} data-testid="go-login">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
