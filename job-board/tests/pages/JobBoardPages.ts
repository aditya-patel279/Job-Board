import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Jobs Page POM ─────────────────────────────────────────────────
export class JobsPage extends BasePage {
  readonly searchInput: Locator;
  readonly locationTypeFilter: Locator;
  readonly jobTypeFilter: Locator;
  readonly jobList: Locator;
  readonly jobsCount: Locator;
  readonly jobsEmpty: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('search-input');
    this.locationTypeFilter = page.getByTestId('filter-location-type');
    this.jobTypeFilter = page.getByTestId('filter-job-type');
    this.jobList = page.getByTestId('job-list');
    this.jobsCount = page.getByTestId('jobs-count');
    this.jobsEmpty = page.getByTestId('jobs-empty');
  }

  async goto() { await this.navigate('/jobs'); }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByLocationType(type: string) {
    await this.locationTypeFilter.selectOption(type);
  }

  async filterByJobType(type: string) {
    await this.jobTypeFilter.selectOption(type);
  }

  async getJobCards() {
    return this.page.locator('[data-testid^="job-card-"]').all();
  }

  async getJobTitles() {
    return this.page.getByTestId('job-title').allTextContents();
  }

  async clickJob(index = 0) {
    const cards = await this.getJobCards();
    await cards[index].click();
  }

  async bookmarkJob(jobId: string) {
    await this.page.getByTestId(`bookmark-btn-${jobId}`).click();
  }
}

// ── Employer Page POM ─────────────────────────────────────────────
export class EmployerPage extends BasePage {
  readonly dashboard: Locator;
  readonly postJobButton: Locator;
  readonly jobForm: Locator;
  readonly statOpenJobs: Locator;
  readonly statTotalApplications: Locator;
  readonly statNewApplications: Locator;
  readonly employerJobList: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboard = page.getByTestId('employer-dashboard');
    this.postJobButton = page.getByTestId('post-job-button');
    this.jobForm = page.getByTestId('job-form');
    this.statOpenJobs = page.getByTestId('stat-open-jobs');
    this.statTotalApplications = page.getByTestId('stat-total-applications');
    this.statNewApplications = page.getByTestId('stat-new-applications');
    this.employerJobList = page.getByTestId('employer-job-list');
  }

  async gotoDashboard() { await this.navigate('/employer/dashboard'); }
  async gotoNewJob() { await this.navigate('/employer/jobs/new'); }

  async fillJobForm(data: {
    title: string; company?: string; description: string;
    location: string; salaryMin: string; salaryMax: string;
    locationType?: string; jobType?: string; tags?: string;
  }) {
    await this.page.getByTestId('job-title-input').fill(data.title);
    if (data.company) await this.page.getByTestId('job-company-input').fill(data.company);
    await this.page.getByTestId('job-description-input').fill(data.description);
    await this.page.getByTestId('job-location-input').fill(data.location);
    await this.page.getByTestId('salary-min-input').fill(data.salaryMin);
    await this.page.getByTestId('salary-max-input').fill(data.salaryMax);
    if (data.locationType) await this.page.getByTestId('job-location-type-select').selectOption(data.locationType);
    if (data.jobType) await this.page.getByTestId('job-type-select').selectOption(data.jobType);
    if (data.tags) await this.page.getByTestId('job-tags-input').fill(data.tags);
  }

  async submitJobForm() {
    await this.page.getByTestId('submit-job-button').click();
  }

  async getEmployerJobCards() {
    return this.page.locator('[data-testid^="employer-job-"]').all();
  }

  async viewApplicants(jobId: string) {
    await this.page.getByTestId(`view-applicants-${jobId}`).click();
  }

  async editJob(jobId: string) {
    await this.page.getByTestId(`edit-job-${jobId}`).click();
  }
}

// ── Applicant Page POM ────────────────────────────────────────────
export class ApplicantPage extends BasePage {
  readonly dashboard: Locator;
  readonly applicationList: Locator;
  readonly statTotal: Locator;
  readonly statInterview: Locator;
  readonly statOffered: Locator;
  readonly applyModal: Locator;
  readonly coverLetterInput: Locator;
  readonly resumeInput: Locator;
  readonly submitApplicationBtn: Locator;
  readonly applyError: Locator;
  readonly bookmarksPage: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboard = page.getByTestId('applicant-dashboard');
    this.applicationList = page.getByTestId('application-list');
    this.statTotal = page.getByTestId('stat-total');
    this.statInterview = page.getByTestId('stat-interview');
    this.statOffered = page.getByTestId('stat-offered');
    this.applyModal = page.getByTestId('apply-modal');
    this.coverLetterInput = page.getByTestId('cover-letter-input');
    this.resumeInput = page.getByTestId('resume-input');
    this.submitApplicationBtn = page.getByTestId('submit-application');
    this.applyError = page.getByTestId('apply-error');
    this.bookmarksPage = page.getByTestId('bookmarks-page');
  }

  async gotoDashboard() { await this.navigate('/applicant/dashboard'); }
  async gotoBookmarks() { await this.navigate('/applicant/bookmarks'); }

  async getApplicationCards() {
    return this.page.locator('[data-testid^="application-card-"]').all();
  }

  async getApplicationStatuses() {
    return this.page.locator('[data-testid^="application-status-"]').allTextContents();
  }

  async fillApplyForm(coverLetter: string, resumePath: string) {
    await this.coverLetterInput.fill(coverLetter);
    await this.resumeInput.setInputFiles(resumePath);
  }
}
