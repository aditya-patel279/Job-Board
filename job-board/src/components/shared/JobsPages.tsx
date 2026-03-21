import React, { useState, useMemo } from 'react';
import { api } from '../../mocks/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Card, EmptyState, StatusBadge } from '../shared/UI';
import type { Job } from '../../types';

// ── Job Card ──────────────────────────────────────────────────────
const JobCard: React.FC<{ job: Job; onView: (id: string) => void; isBookmarked?: boolean; onBookmark?: (id: string) => void; hasApplied?: boolean }> = ({
  job, onView, isBookmarked, onBookmark, hasApplied
}) => (
  <Card
    data-testid={`job-card-${job.id}`}
    onClick={() => onView(job.id)}
    className="job-card"
  >
    <div className="job-card-header">
      <div>
        <h3 className="job-title" data-testid="job-title">{job.title}</h3>
        <p className="job-company" data-testid="job-company">{job.company}</p>
      </div>
      {onBookmark && (
        <button
          className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={e => { e.stopPropagation(); onBookmark(job.id); }}
          data-testid={`bookmark-btn-${job.id}`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
          aria-pressed={isBookmarked}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      )}
    </div>
    <div className="job-card-meta">
      <span data-testid="job-location">{job.location}</span>
      <Badge variant="info" data-testid="job-location-type">{job.locationType}</Badge>
      <Badge variant="default" data-testid="job-type">{job.jobType}</Badge>
      {hasApplied && <Badge variant="success" data-testid="applied-badge">Applied</Badge>}
    </div>
    <div className="job-card-salary" data-testid="job-salary">
      ${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}
    </div>
    <div className="job-tags">
      {job.tags.map(t => <span key={t} className="tag" data-testid="job-tag">{t}</span>)}
    </div>
  </Card>
);

// ── Jobs Listing ──────────────────────────────────────────────────
export const JobsPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [locationType, setLocationType] = useState('');
  const [jobType, setJobType] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>(() =>
    user ? api.getBookmarks(user.id) : []
  );

  const appliedJobIds = useMemo(() => {
    if (!user || user.role !== 'applicant') return new Set<string>();
    return new Set(api.getMyApplications(user.id).map(a => a.jobId));
  }, [user]);

  const jobs = useMemo(() =>
    api.getJobs({ search, locationType: locationType || undefined, jobType: jobType || undefined }),
    [search, locationType, jobType]
  );

  const handleBookmark = (jobId: string) => {
    if (!user) { onNavigate('/login'); return; }
    api.toggleBookmark(user.id, jobId);
    setBookmarks(api.getBookmarks(user.id));
  };

  return (
    <div className="page" data-testid="jobs-page">
      <div className="page-header">
        <h1>Browse Jobs</h1>
        <p className="page-subtitle" data-testid="jobs-count">{jobs.length} open positions</p>
      </div>

      <div className="search-bar" data-testid="search-bar">
        <input
          className="search-input"
          placeholder="Search by title, company or skill..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="search-input"
        />
        <select value={locationType} onChange={e => setLocationType(e.target.value)} data-testid="filter-location-type" className="filter-select">
          <option value="">All locations</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="on-site">On-site</option>
        </select>
        <select value={jobType} onChange={e => setJobType(e.target.value)} data-testid="filter-job-type" className="filter-select">
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon="🔍" title="No jobs found"
          description="Try adjusting your search or filters"
          data-testid="jobs-empty"
        />
      ) : (
        <div className="job-list" data-testid="job-list">
          {jobs.map(job => (
            <JobCard
              key={job.id} job={job}
              onView={id => onNavigate(`/jobs/${id}`)}
              isBookmarked={bookmarks.includes(job.id)}
              onBookmark={handleBookmark}
              hasApplied={appliedJobIds.has(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Job Detail ────────────────────────────────────────────────────
export const JobDetailPage: React.FC<{ jobId: string; onNavigate: (p: string) => void }> = ({ jobId, onNavigate }) => {
  const { user } = useAuth();
  const job = api.getJob(jobId);
  const hasApplied = user ? api.hasApplied(jobId, user.id) : false;

  if (!job) return (
    <div className="page" data-testid="job-not-found">
      <EmptyState icon="❌" title="Job not found" description="This listing may have been removed." />
    </div>
  );

  return (
    <div className="page" data-testid="job-detail-page">
      <button className="back-link" onClick={() => onNavigate('/jobs')} data-testid="back-to-jobs">
        ← Back to jobs
      </button>

      <div className="job-detail-header">
        <div>
          <h1 data-testid="job-detail-title">{job.title}</h1>
          <p className="job-detail-company" data-testid="job-detail-company">{job.company}</p>
        </div>
        <StatusBadge status={job.status} data-testid="job-status-badge" />
      </div>

      <div className="job-detail-meta">
        <Badge variant="info">{job.locationType}</Badge>
        <Badge variant="default">{job.jobType}</Badge>
        <span data-testid="job-detail-location">{job.location}</span>
        <span className="salary-range" data-testid="job-detail-salary">
          ${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()} {job.salary.currency}
        </span>
      </div>

      <div className="job-detail-body">
        <section>
          <h2>About this role</h2>
          <p data-testid="job-description">{job.description}</p>
        </section>
        <section>
          <h2>Requirements</h2>
          <pre className="requirements-text" data-testid="job-requirements">{job.requirements}</pre>
        </section>
        <div className="job-tags">
          {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </div>

      <div className="job-detail-actions">
        {!user && (
          <Button onClick={() => onNavigate('/login')} data-testid="login-to-apply">
            Login to apply
          </Button>
        )}
        {user?.role === 'applicant' && job.status === 'open' && !hasApplied && (
          <Button onClick={() => onNavigate(`/jobs/${jobId}`)} data-testid="apply-button"
            className="apply-cta"
            onClick={() => {
              const event = new CustomEvent('open-apply-modal', { detail: { jobId } });
              window.dispatchEvent(event);
            }}
          >
            Apply now
          </Button>
        )}
        {user?.role === 'applicant' && hasApplied && (
          <Badge variant="success" data-testid="already-applied-badge">
            ✓ Application submitted
          </Badge>
        )}
        {user?.role === 'employer' && (
          <p className="employer-note" data-testid="employer-cannot-apply">
            Employers cannot apply to job listings.
          </p>
        )}
      </div>
    </div>
  );
};
