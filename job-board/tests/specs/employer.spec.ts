import { test, expect } from '../fixtures/auth.fixtures';
import { EmployerPage } from '../pages/JobBoardPages';

test.describe('Employer flows', () => {

  test.describe('Dashboard', () => {
    test('employer dashboard shows stats', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      await expect(employer.statOpenJobs).toBeVisible();
      await expect(employer.statTotalApplications).toBeVisible();
      await expect(employer.statNewApplications).toBeVisible();
    });

    test('seeded jobs appear in employer job list', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      const cards = await employer.getEmployerJobCards();
      expect(cards.length).toBeGreaterThan(0);
    });

    test('post job button navigates to new job form', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      await employer.postJobButton.click();
      await expect(page.getByTestId('job-form-page')).toBeVisible();
    });
  });

  test.describe('Post a job', () => {
    test('successfully posts a new job', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoNewJob();

      await employer.fillJobForm({
        title: 'QA Automation Engineer',
        description: 'Join our quality team to build and maintain automated test suites.',
        location: 'Remote',
        salaryMin: '75000',
        salaryMax: '100000',
        locationType: 'remote',
        jobType: 'full-time',
        tags: 'Playwright, TypeScript, QA',
      });
      await employer.submitJobForm();

      await expect(page).toHaveURL(/#\/employer\/dashboard/);
      const titles = await page.getByTestId('employer-job-title').allTextContents();
      expect(titles).toContain('QA Automation Engineer');
    });

    test('shows validation error when title is missing', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoNewJob();

      await employer.fillJobForm({
        title: '',
        description: 'Some description',
        location: 'Remote',
        salaryMin: '50000',
        salaryMax: '80000',
      });
      await employer.submitJobForm();

      await expect(page.locator('.field-error').first()).toBeVisible();
      await expect(page.getByTestId('job-form-page')).toBeVisible();
    });

    test('shows validation error when salary max is less than min', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoNewJob();

      await employer.fillJobForm({
        title: 'Test Job',
        description: 'Description here',
        location: 'Remote',
        salaryMin: '100000',
        salaryMax: '50000',
      });
      await employer.submitJobForm();

      await expect(page.getByText('Max must exceed min')).toBeVisible();
    });

    test('cancel button returns to dashboard without saving', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoNewJob();
      await page.getByTestId('job-title-input').fill('Will Not Be Saved');
      await page.locator('button', { hasText: 'Cancel' }).click();
      await expect(page.getByTestId('employer-dashboard')).toBeVisible();
      const titles = await page.getByTestId('employer-job-title').allTextContents();
      expect(titles).not.toContain('Will Not Be Saved');
    });

    test('new job appears in open positions count', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      const before = parseInt(await employer.statOpenJobs.textContent() || '0');

      await employer.gotoNewJob();
      await employer.fillJobForm({
        title: 'Extra Position',
        description: 'Test description for a new role that we are hiring for.',
        location: 'New York',
        salaryMin: '60000',
        salaryMax: '90000',
      });
      await employer.submitJobForm();

      await employer.gotoDashboard();
      const after = parseInt(await employer.statOpenJobs.textContent() || '0');
      expect(after).toBe(before + 1);
    });
  });

  test.describe('Edit a job', () => {
    test('edit form is pre-populated with existing data', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      await employer.editJob('job-1');

      await expect(page.getByTestId('job-title-input')).toHaveValue('Senior Frontend Developer');
      await expect(page.getByTestId('job-description-input')).not.toBeEmpty();
    });

    test('updates job title and reflects in dashboard', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      await employer.editJob('job-1');

      await page.getByTestId('job-title-input').clear();
      await page.getByTestId('job-title-input').fill('Lead Frontend Developer');
      await employer.submitJobForm();

      await expect(page.getByTestId('employer-dashboard')).toBeVisible();
      const titles = await page.getByTestId('employer-job-title').allTextContents();
      expect(titles).toContain('Lead Frontend Developer');
    });

    test('closing a listing changes its status badge', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      await employer.editJob('job-1');
      await page.getByTestId('close-job-button').click();

      await employer.gotoDashboard();
      const statusBadge = page.getByTestId('job-status-job-1');
      await expect(statusBadge).toHaveText('Closed');
    });
  });

  test.describe('Applicants', () => {
    test('view applicants page shows application count', async ({ employerPage: page }) => {
      const employer = new EmployerPage(page);
      await employer.gotoDashboard();
      await employer.viewApplicants('job-1');
      await expect(page.getByTestId('applicants-page')).toBeVisible();
      await expect(page.getByTestId('applicants-count')).toBeVisible();
    });

    test('seeded applicant appears in list for job-1', async ({ employerPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      const cards = await page.locator('[data-testid^="applicant-card-"]').all();
      expect(cards.length).toBeGreaterThan(0);
    });

    test('can open application review modal', async ({ employerPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      const reviewBtn = page.locator('[data-testid^="review-btn-"]').first();
      await reviewBtn.click();
      await expect(page.getByTestId('application-modal')).toBeVisible();
      await expect(page.getByTestId('cover-letter')).toBeVisible();
      await expect(page.getByTestId('resume-filename')).toBeVisible();
    });

    test('can update application status to interview', async ({ employerPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      const reviewBtn = page.locator('[data-testid^="review-btn-"]').first();
      const appCard = page.locator('[data-testid^="applicant-card-"]').first();
      const appId = await appCard.getAttribute('data-testid').then(v => v?.replace('applicant-card-', '') || '');

      await reviewBtn.click();
      await page.getByTestId('set-status-interview').click();

      // Modal closes, status updates
      await expect(page.getByTestId('application-modal')).not.toBeVisible();
      await expect(page.getByTestId(`app-status-${appId}`)).toHaveText('Interview');
    });

    test('can reject an application', async ({ employerPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      const reviewBtn = page.locator('[data-testid^="review-btn-"]').first();
      const appCard = page.locator('[data-testid^="applicant-card-"]').first();
      const appId = await appCard.getAttribute('data-testid').then(v => v?.replace('applicant-card-', '') || '');

      await reviewBtn.click();
      await page.getByTestId('set-status-rejected').click();

      await expect(page.getByTestId(`app-status-${appId}`)).toHaveText('Rejected');
    });

    test('modal close button dismisses modal', async ({ employerPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      await page.locator('[data-testid^="review-btn-"]').first().click();
      await expect(page.getByTestId('application-modal')).toBeVisible();
      await page.getByTestId('modal-close').click();
      await expect(page.getByTestId('application-modal')).not.toBeVisible();
    });

    test('empty state shows for job with no applications', async ({ employerPage: page }) => {
      // job-2 has no seeded applications
      await page.goto('/#/employer/jobs/job-2/applicants');
      await expect(page.getByTestId('no-applicants-empty')).toBeVisible();
    });

    test('back to dashboard button works', async ({ employerPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      await page.getByTestId('back-to-dashboard').click();
      await expect(page.getByTestId('employer-dashboard')).toBeVisible();
    });
  });
});
