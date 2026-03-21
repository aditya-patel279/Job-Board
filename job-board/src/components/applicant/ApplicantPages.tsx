import React, { useState, useEffect } from 'react';
import { api } from '../../mocks/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Textarea, Modal, StatusBadge, EmptyState, Badge } from '../shared/UI';
import type { Job } from '../../types';

// ── Apply Modal ───────────────────────────────────────────────────
interface ApplyModalProps { job: Job; onClose: () => void; onSuccess: () => void; }
export const ApplyModal: React.FC<ApplyModalProps> = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!coverLetter.trim()) e.coverLetter = 'Cover letter is required';
    if (coverLetter.trim().length < 50) e.coverLetter = 'Please write at least 50 characters';
    if (!resumeFile) e.resume = 'Please attach your resume';
    return e;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setErrors(prev => ({ ...prev, resume: 'Only PDF, DOC, or DOCX files are accepted' }));
      return;
    }
    setResumeFile(file);
    setErrors(prev => ({ ...prev, resume: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).some(k => errs[k])) { setErrors(errs); return; }
    if (!user) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = api.apply(job.id, user.id, coverLetter, resumeFile!.name, reader.result as string);
      setLoading(false);
      if (result.error) { setErrors({ form: result.error }); return; }
      onSuccess();
    };
    reader.readAsDataURL(resumeFile!);
  };

  return (
    <Modal title={`Apply — ${job.title}`} onClose={onClose} data-testid="apply-modal">
      <form onSubmit={handleSubmit} noValidate data-testid="apply-form">
        {errors.form && <div className="form-error" data-testid="apply-error" role="alert">{errors.form}</div>}

        <div className="apply-job-info">
          <strong data-testid="apply-job-title">{job.title}</strong> at <span data-testid="apply-job-company">{job.company}</span>
        </div>

        <Textarea id="cover-letter" label="Cover letter"
          value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
          error={errors.coverLetter} data-testid="cover-letter-input" rows={6}
          placeholder="Tell us why you're a great fit for this role..." />

        <div className="field">
          <label htmlFor="resume-upload" className="field-label">Resume (PDF, DOC, DOCX)</label>
          <input
            id="resume-upload" type="file" accept=".pdf,.doc,.docx"
            onChange={handleFileChange} data-testid="resume-input"
            className="file-input"
          />
          {resumeFile && <p className="file-name" data-testid="selected-file-name">{resumeFile.name}</p>}
          {errors.resume && <span className="field-error" role="alert" data-testid="resume-error">{errors.resume}</span>}
        </div>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} data-testid="cancel-apply">Cancel</Button>
          <Button type="submit" loading={loading} data-testid="submit-application">Submit application</Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Applicant Dashboard ───────────────────────────────────────────
export const ApplicantDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  if (!user) return null;

  const applications = api.getMyApplications(user.id);

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="page" data-testid="applicant-dashboard">
      <div className="page-header">
        <div>
          <h1>My Applications</h1>
          <p className="page-subtitle">Welcome, {user.name}</p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate('/jobs')} data-testid="browse-jobs-btn">
          Browse jobs
        </Button>
      </div>

      <div className="stats-grid" data-testid="applicant-stats">
        <Card className="stat-card">
          <div className="stat-num" data-testid="stat-total">{applications.length}</div>
          <div className="stat-label">Total applied</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-num highlight" data-testid="stat-interview">{statusCounts['interview'] || 0}</div>
          <div className="stat-label">Interviews</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-num" data-testid="stat-pending">{statusCounts['pending'] || 0}</div>
          <div className="stat-label">Pending</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-num" data-testid="stat-offered">{statusCounts['offered'] || 0}</div>
          <div className="stat-label">Offers</div>
        </Card>
      </div>

      {applications.length === 0 ? (
        <EmptyState icon="📨" title="No applications yet" description="Browse open jobs and apply to get started."
          data-testid="no-applications-empty"
          action={<Button onClick={() => onNavigate('/jobs')} data-testid="go-browse">Browse jobs</Button>} />
      ) : (
        <div className="application-list" data-testid="application-list">
          {applications.map(app => (
            <Card key={app.id} className="application-card" data-testid={`application-card-${app.id}`}>
              <div className="application-info">
                <h3 data-testid="application-job-title"
                  className="app-job-title"
                  onClick={() => onNavigate(`/jobs/${app.jobId}`)}
                >
                  {app.job.title}
                </h3>
                <p className="app-company" data-testid="application-company">{app.job.company}</p>
                <p className="app-date">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
              </div>
              <div className="application-status">
                <StatusBadge status={app.status} data-testid={`application-status-${app.id}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Bookmarks ─────────────────────────────────────────────────────
export const BookmarksPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) setBookmarkIds(api.getBookmarks(user.id));
  }, [user]);

  if (!user) return null;

  const bookmarkedJobs = bookmarkIds
    .map(id => api.getJob(id))
    .filter((j): j is NonNullable<typeof j> => j !== null);

  const removeBookmark = (jobId: string) => {
    api.toggleBookmark(user.id, jobId);
    setBookmarkIds(api.getBookmarks(user.id));
  };

  return (
    <div className="page" data-testid="bookmarks-page">
      <div className="page-header">
        <h1>Saved Jobs</h1>
        <p className="page-subtitle" data-testid="bookmarks-count">{bookmarkedJobs.length} saved</p>
      </div>

      {bookmarkedJobs.length === 0 ? (
        <EmptyState icon="★" title="No saved jobs" description="Bookmark jobs while browsing to find them here."
          data-testid="no-bookmarks-empty"
          action={<Button onClick={() => onNavigate('/jobs')} data-testid="go-browse-from-bookmarks">Browse jobs</Button>} />
      ) : (
        <div className="job-list" data-testid="bookmarked-job-list">
          {bookmarkedJobs.map(job => (
            <Card key={job.id} className="job-card" data-testid={`bookmarked-job-${job.id}`}>
              <div className="job-card-header">
                <div>
                  <h3 className="job-title"
                    onClick={() => onNavigate(`/jobs/${job.id}`)}
                    data-testid="bookmarked-job-title"
                  >{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                </div>
                <button className="bookmark-btn bookmarked" onClick={() => removeBookmark(job.id)}
                  data-testid={`remove-bookmark-${job.id}`} aria-label="Remove bookmark">★</button>
              </div>
              <div className="job-card-meta">
                <Badge variant="info">{job.locationType}</Badge>
                <Badge variant="default">{job.jobType}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
