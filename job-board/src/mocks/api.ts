import type { User, Job, Application, ApiResponse, Role } from '../types';
import { MOCK_USERS, MOCK_JOBS, MOCK_APPLICATIONS } from './data';

// ── Storage helpers ──────────────────────────────────────────────
const get = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
};
const set = <T>(key: string, val: T) => localStorage.setItem(key, JSON.stringify(val));

const initStorage = () => {
  if (!localStorage.getItem('jb_seeded')) {
    set('jb_users', MOCK_USERS);
    set('jb_jobs', MOCK_JOBS);
    set('jb_applications', MOCK_APPLICATIONS);
    set('jb_seeded', true);
  }
};

const getUsers = (): User[] => get('jb_users', MOCK_USERS);
const getJobs = (): Job[] => get('jb_jobs', MOCK_JOBS);
const getApplications = (): Application[] => get('jb_applications', MOCK_APPLICATIONS);

// ── Token helpers ────────────────────────────────────────────────
const makeToken = (userId: string) => btoa(`${userId}:${Date.now()}`);
const getUserIdFromToken = (token: string): string | null => {
  try { return atob(token).split(':')[0]; } catch { return null; }
};

// ── API surface ──────────────────────────────────────────────────
export const api = {
  init: initStorage,

  // Auth
  login: (email: string, password: string): ApiResponse<{ user: User; token: string }> => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { status: 401, error: 'Invalid email or password' };
    const token = makeToken(user.id);
    set('jb_token', token);
    set('jb_current_user', user);
    return { status: 200, data: { user, token } };
  },

  register: (name: string, email: string, password: string, role: Role): ApiResponse<{ user: User; token: string }> => {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { status: 409, error: 'Email already registered' };
    if (password.length < 8) return { status: 400, error: 'Password must be at least 8 characters' };
    const user: User = { id: crypto.randomUUID(), email, password, name, role, createdAt: new Date().toISOString() };
    set('jb_users', [...users, user]);
    const token = makeToken(user.id);
    set('jb_token', token);
    set('jb_current_user', user);
    return { status: 201, data: { user, token } };
  },

  logout: () => {
    localStorage.removeItem('jb_token');
    localStorage.removeItem('jb_current_user');
  },

  getCurrentUser: (): User | null => get('jb_current_user', null),

  // Jobs
  getJobs: (filters?: { search?: string; locationType?: string; jobType?: string; status?: string }): Job[] => {
    let jobs = getJobs().filter(j => j.status === 'open');
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters?.locationType) jobs = jobs.filter(j => j.locationType === filters.locationType);
    if (filters?.jobType) jobs = jobs.filter(j => j.jobType === filters.jobType);
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getJob: (id: string): Job | null => getJobs().find(j => j.id === id) ?? null,

  getEmployerJobs: (employerId: string): Job[] =>
    getJobs().filter(j => j.employerId === employerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  createJob: (employerId: string, data: Omit<Job, 'id' | 'employerId' | 'createdAt' | 'status'>): ApiResponse<Job> => {
    const jobs = getJobs();
    const job: Job = { id: crypto.randomUUID(), employerId, ...data, status: 'open', createdAt: new Date().toISOString() };
    set('jb_jobs', [...jobs, job]);
    return { status: 201, data: job };
  },

  updateJob: (id: string, employerId: string, data: Partial<Job>): ApiResponse<Job> => {
    const jobs = getJobs();
    const idx = jobs.findIndex(j => j.id === id);
    if (idx === -1) return { status: 404, error: 'Job not found' };
    if (jobs[idx].employerId !== employerId) return { status: 403, error: 'Forbidden' };
    const updated = { ...jobs[idx], ...data };
    jobs[idx] = updated;
    set('jb_jobs', jobs);
    return { status: 200, data: updated };
  },

  deleteJob: (id: string, employerId: string): ApiResponse<null> => {
    const jobs = getJobs();
    const job = jobs.find(j => j.id === id);
    if (!job) return { status: 404, error: 'Job not found' };
    if (job.employerId !== employerId) return { status: 403, error: 'Forbidden' };
    set('jb_jobs', jobs.filter(j => j.id !== id));
    return { status: 200, data: null };
  },

  // Applications
  apply: (jobId: string, applicantId: string, coverLetter: string, resumeFileName: string, resumeContent: string): ApiResponse<Application> => {
    const applications = getApplications();
    if (applications.find(a => a.jobId === jobId && a.applicantId === applicantId)) {
      return { status: 409, error: 'You have already applied to this job' };
    }
    const app: Application = {
      id: crypto.randomUUID(), jobId, applicantId, coverLetter,
      resumeFileName, resumeContent, status: 'pending',
      appliedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    set('jb_applications', [...applications, app]);
    return { status: 201, data: app };
  },

  getApplicationsForJob: (jobId: string, employerId: string): ApiResponse<(Application & { applicantName: string; applicantEmail: string })[]> => {
    const jobs = getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return { status: 404, error: 'Job not found' };
    if (job.employerId !== employerId) return { status: 403, error: 'Forbidden' };
    const users = getUsers();
    const apps = getApplications()
      .filter(a => a.jobId === jobId)
      .map(a => {
        const user = users.find(u => u.id === a.applicantId);
        return { ...a, applicantName: user?.name ?? 'Unknown', applicantEmail: user?.email ?? '' };
      });
    return { status: 200, data: apps };
  },

  getMyApplications: (applicantId: string): (Application & { job: Job })[] => {
    const jobs = getJobs();
    return getApplications()
      .filter(a => a.applicantId === applicantId)
      .map(a => ({ ...a, job: jobs.find(j => j.id === a.jobId)! }))
      .filter(a => a.job)
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  },

  updateApplicationStatus: (appId: string, employerId: string, status: Application['status']): ApiResponse<Application> => {
    const applications = getApplications();
    const idx = applications.findIndex(a => a.id === appId);
    if (idx === -1) return { status: 404, error: 'Application not found' };
    const jobs = getJobs();
    const job = jobs.find(j => j.id === applications[idx].jobId);
    if (!job || job.employerId !== employerId) return { status: 403, error: 'Forbidden' };
    applications[idx] = { ...applications[idx], status, updatedAt: new Date().toISOString() };
    set('jb_applications', applications);
    return { status: 200, data: applications[idx] };
  },

  hasApplied: (jobId: string, applicantId: string): boolean =>
    getApplications().some(a => a.jobId === jobId && a.applicantId === applicantId),

  // Bookmarks
  getBookmarks: (userId: string): string[] => get(`jb_bookmarks_${userId}`, []),
  toggleBookmark: (userId: string, jobId: string): boolean => {
    const bookmarks = get<string[]>(`jb_bookmarks_${userId}`, []);
    const isBookmarked = bookmarks.includes(jobId);
    set(`jb_bookmarks_${userId}`, isBookmarked ? bookmarks.filter(id => id !== jobId) : [...bookmarks, jobId]);
    return !isBookmarked;
  },

  // Stats for employer dashboard
  getEmployerStats: (employerId: string) => {
    const jobs = getJobs().filter(j => j.employerId === employerId);
    const applications = getApplications().filter(a => jobs.some(j => j.id === a.jobId));
    return {
      totalJobs: jobs.filter(j => j.status === 'open').length,
      closedJobs: jobs.filter(j => j.status === 'closed').length,
      totalApplications: applications.length,
      newApplications: applications.filter(a => a.status === 'pending').length,
    };
  },
};
