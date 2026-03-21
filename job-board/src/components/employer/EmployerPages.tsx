import React, { useState, useEffect } from 'react';
import { api } from '../../mocks/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Textarea, Select, Modal, StatusBadge, EmptyState, Badge } from '../shared/UI';
import type { Job, Application, JobType, LocationType } from '../../types';

// ── Employer Dashboard ────────────────────────────────────────────
export const EmployerDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  if (!user) return null;

  const stats = api.getEmployerStats(user.id);
  const jobs = api.getEmployerJobs(user.id);

  return (
    <div className="page" data-testid="employer-dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.name}</p>
        </div>
        <Button onClick={() => onNavigate('/employer/jobs/new')} data-testid="post-job-button">
          + Post a job
        </Button>
      </div>

      <div className="stats-grid" data-testid="employer-stats">
        <Card className="stat-card">
          <div className="stat-num" data-testid="stat-open-jobs">{stats.totalJobs}</div>
          <div className="stat-label">Open positions</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-num" data-testid="stat-total-applications">{stats.totalApplications}</div>
          <div className="stat-label">Total applications</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-num highlight" data-testid="stat-new-applications">{stats.newApplications}</div>
          <div className="stat-label">New (pending)</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-num" data-testid="stat-closed-jobs">{stats.closedJobs}</div>
          <div className="stat-label">Closed listings</div>
        </Card>
      </div>

      <div className="section-header">
        <h2>Your listings</h2>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon="📋" title="No jobs posted yet"
          description="Post your first job to start receiving applications."
          data-testid="no-jobs-empty"
          action={<Button onClick={() => onNavigate('/employer/jobs/new')} data-testid="empty-post-button">Post a job</Button>}
        />
      ) : (
        <div className="employer-job-list" data-testid="employer-job-list">
          {jobs.map(job => (
            <Card key={job.id} className="employer-job-card" data-testid={`employer-job-${job.id}`}>
              <div className="employer-job-info">
                <h3 data-testid="employer-job-title">{job.title}</h3>
                <div className="job-card-meta">
                  <Badge variant="info">{job.locationType}</Badge>
                  <Badge variant="default">{job.jobType}</Badge>
                  <StatusBadge status={job.status} data-testid={`job-status-${job.id}`} />
                </div>
              </div>
              <div className="employer-job-actions">
                <Button variant="ghost" size="sm"
                  onClick={() => onNavigate(`/employer/jobs/${job.id}/applicants`)}
                  data-testid={`view-applicants-${job.id}`}>
                  View applicants
                </Button>
                <Button variant="secondary" size="sm"
                  onClick={() => onNavigate(`/employer/jobs/${job.id}/edit`)}
                  data-testid={`edit-job-${job.id}`}>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Job Form (create + edit) ──────────────────────────────────────
interface JobFormData {
  title: string; company: string; description: string; requirements: string;
  salaryMin: string; salaryMax: string; location: string;
  locationType: LocationType; jobType: JobType; tags: string;
}

export const JobFormPage: React.FC<{ jobId?: string; onNavigate: (p: string) => void }> = ({ jobId, onNavigate }) => {
  const { user } = useAuth();
  const existing = jobId ? api.getJob(jobId) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState<JobFormData>({
    title: existing?.title || '',
    company: existing?.company || user?.name || '',
    description: existing?.description || '',
    requirements: existing?.requirements || '',
    salaryMin: String(existing?.salary.min || ''),
    salaryMax: String(existing?.salary.max || ''),
    location: existing?.location || '',
    locationType: existing?.locationType || 'remote',
    jobType: existing?.jobType || 'full-time',
    tags: existing?.tags.join(', ') || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.company.trim()) e.company = 'Company is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.salaryMin || isNaN(Number(form.salaryMin))) e.salaryMin = 'Valid number required';
    if (!form.salaryMax || isNaN(Number(form.salaryMax))) e.salaryMax = 'Valid number required';
    if (Number(form.salaryMin) >= Number(form.salaryMax)) e.salaryMax = 'Max must exceed min';
    return e;
  };

  const f = (key: keyof JobFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const data = {
      title: form.title, company: form.company, description: form.description,
      requirements: form.requirements,
      salary: { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: 'USD' },
      location: form.location, locationType: form.locationType, jobType: form.jobType,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (isEdit && jobId && user) {
      api.updateJob(jobId, user.id, data);
    } else if (user) {
      api.createJob(user.id, data);
    }
    setLoading(false);
    onNavigate('/employer/dashboard');
  };

  const handleClose = () => {
    if (isEdit && jobId && user) {
      api.updateJob(jobId, user.id, { status: 'closed' });
      onNavigate('/employer/dashboard');
    }
  };

  return (
    <div className="page" data-testid="job-form-page">
      <button className="back-link" onClick={() => onNavigate('/employer/dashboard')} data-testid="back-to-dashboard">
        ← Back to dashboard
      </button>
      <h1>{isEdit ? 'Edit listing' : 'Post a new job'}</h1>

      <form onSubmit={handleSubmit} className="job-form" data-testid="job-form" noValidate>
        <div className="form-row">
          <Input id="title" label="Job title" value={form.title} onChange={f('title')}
            error={errors.title} data-testid="job-title-input" placeholder="e.g. Senior Frontend Developer" />
          <Input id="company" label="Company" value={form.company} onChange={f('company')}
            error={errors.company} data-testid="job-company-input" />
        </div>
        <Textarea id="description" label="Job description" value={form.description} onChange={f('description')}
          error={errors.description} data-testid="job-description-input" rows={5}
          placeholder="Describe the role and responsibilities..." />
        <Textarea id="requirements" label="Requirements" value={form.requirements} onChange={f('requirements')}
          data-testid="job-requirements-input" rows={4} placeholder="List key requirements, one per line..." />
        <div className="form-row">
          <Input id="location" label="Location" value={form.location} onChange={f('location')}
            error={errors.location} data-testid="job-location-input" placeholder="e.g. New York, NY or Remote" />
          <Select id="location-type" label="Location type" value={form.locationType} onChange={f('locationType')}
            data-testid="job-location-type-select"
            options={[{ value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'on-site', label: 'On-site' }]} />
        </div>
        <div className="form-row">
          <Select id="job-type" label="Job type" value={form.jobType} onChange={f('jobType')}
            data-testid="job-type-select"
            options={[
              { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
              { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
            ]} />
        </div>
        <div className="form-row">
          <Input id="salary-min" label="Salary min (USD)" type="number" value={form.salaryMin} onChange={f('salaryMin')}
            error={errors.salaryMin} data-testid="salary-min-input" placeholder="80000" />
          <Input id="salary-max" label="Salary max (USD)" type="number" value={form.salaryMax} onChange={f('salaryMax')}
            error={errors.salaryMax} data-testid="salary-max-input" placeholder="120000" />
        </div>
        <Input id="tags" label="Skills / Tags (comma-separated)" value={form.tags} onChange={f('tags')}
          data-testid="job-tags-input" placeholder="React, TypeScript, Node.js" />

        <div className="form-actions">
          {isEdit && (
            <Button type="button" variant="danger" onClick={handleClose} data-testid="close-job-button">
              Close listing
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => onNavigate('/employer/dashboard')}>Cancel</Button>
          <Button type="submit" loading={loading} data-testid="submit-job-button">
            {isEdit ? 'Save changes' : 'Post job'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// ── Applicants View ───────────────────────────────────────────────
export const ApplicantsPage: React.FC<{ jobId: string; onNavigate: (p: string) => void }> = ({ jobId, onNavigate }) => {
  const { user } = useAuth();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  if (!user) return null;

  const job = api.getJob(jobId);
  const result = api.getApplicationsForJob(jobId, user.id);
  const applications = result.data || [];

  if (result.status === 403) return (
    <div className="page" data-testid="forbidden-page">
      <EmptyState icon="🚫" title="Access denied" description="You don't have permission to view these applications." />
    </div>
  );

  const updateStatus = (appId: string, status: Application['status']) => {
    if (!user) return;
    api.updateApplicationStatus(appId, user.id, status);
    forceUpdate(n => n + 1);
    setSelectedApp(null);
  };

  const selected = applications.find(a => a.id === selectedApp);

  return (
    <div className="page" data-testid="applicants-page">
      <button className="back-link" onClick={() => onNavigate('/employer/dashboard')} data-testid="back-to-dashboard">
        ← Back to dashboard
      </button>
      <div className="page-header">
        <div>
          <h1>Applicants</h1>
          <p className="page-subtitle" data-testid="applicants-job-title">
            {job?.title} · <span data-testid="applicants-count">{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState icon="👤" title="No applications yet" description="Applications will appear here once candidates apply." data-testid="no-applicants-empty" />
      ) : (
        <div className="applicant-list" data-testid="applicant-list">
          {applications.map(app => (
            <Card key={app.id} className="applicant-card" data-testid={`applicant-card-${app.id}`}>
              <div className="applicant-info">
                <div className="applicant-avatar">{app.applicantName.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="applicant-name" data-testid="applicant-name">{app.applicantName}</p>
                  <p className="applicant-email" data-testid="applicant-email">{app.applicantEmail}</p>
                  <p className="applicant-date">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="applicant-actions">
                <StatusBadge status={app.status} data-testid={`app-status-${app.id}`} />
                <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app.id)} data-testid={`review-btn-${app.id}`}>
                  Review
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`Application — ${selected.applicantName}`} onClose={() => setSelectedApp(null)} data-testid="application-modal">
          <div className="application-detail">
            <div className="field">
              <label className="field-label">Cover letter</label>
              <p className="cover-letter-text" data-testid="cover-letter">{selected.coverLetter}</p>
            </div>
            <div className="field">
              <label className="field-label">Resume</label>
              <p data-testid="resume-filename">{selected.resumeFileName}</p>
            </div>
            <div className="field">
              <label className="field-label">Current status</label>
              <StatusBadge status={selected.status} data-testid="current-status" />
            </div>
            <div className="status-actions" data-testid="status-actions">
              <label className="field-label">Update status</label>
              <div className="status-buttons">
                {(['reviewed', 'interview', 'offered', 'rejected'] as Application['status'][]).map(s => (
                  <Button key={s} variant={s === 'rejected' ? 'danger' : 'secondary'} size="sm"
                    onClick={() => updateStatus(selected.id, s)}
                    data-testid={`set-status-${s}`}
                    className={selected.status === s ? 'active-status' : ''}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
