import { test, expect } from '../fixtures/auth.fixtures';
import { ApplicantPage } from '../pages/JobBoardPages';
import * as path from 'path';

const RESUME_PATH = path.join(__dirname, '../fixtures/files/sample-resume.pdf');
const LONG_COVER_LETTER = 'I am very excited to apply for this position. I have extensive experience in this field and believe I would be a great fit for your team. Looking forward to discussing further.';

test.describe('Applicant flows', () => {

  test.describe('Dashboard', () => {
    test('shows applicant dashboard with stats', async ({ applicantPage: page }) => {
      const applicant = new ApplicantPage(page);
      await applicant.gotoDashboard();
      await expect(applicant.dashboard).toBeVisible();
      await expect(applicant.statTotal).toBeVisible();
      await expect(applicant.statInterview).toBeVisible();
      await expect(applicant.statOffered).toBeVisible();
    });

    test('shows empty state when no applications', async ({ applicantPage: page }) => {
      await page.goto('/#/applicant/dashboard');
      // app-1 (Jane) has no seeded applications
      await expect(page.getByTestId('no-applications-empty')).toBeVisible();
    });

    test('browse jobs button navigates to job list', async ({ applicantPage: page }) => {
      await page.goto('/#/applicant/dashboard');
      await page.getByTestId('browse-jobs-btn').click();
      await expect(page.getByTestId('jobs-page')).toBeVisible();
    });
  });

  test.describe('Apply modal', () => {
    test('apply button opens apply modal', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await expect(page.getByTestId('apply-modal')).toBeVisible();
    });

    test('apply modal shows job title and company', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await expect(page.getByTestId('apply-job-title')).toContainText('Senior Frontend Developer');
      await expect(page.getByTestId('apply-job-company')).toContainText('Acme Corp');
    });

    test('shows error when cover letter is empty', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('resume-error')).toBeVisible();
    });

    test('shows error when cover letter is too short', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill('Too short');
      await page.getByTestId('submit-application').click();
      await expect(page.locator('[data-testid="cover-letter-input"] ~ .field-error, .field-error').first()).toBeVisible();
    });

    test('shows error when no resume is attached', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('resume-error')).toBeVisible();
    });

    test('shows selected filename after file upload', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await expect(page.getByTestId('selected-file-name')).toHaveText('sample-resume.pdf');
    });

    test('cancel button closes apply modal', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await expect(page.getByTestId('apply-modal')).toBeVisible();
      await page.getByTestId('cancel-apply').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();
    });

    test('successfully submits application', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();

      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();

      // Modal closes and success toast appears
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();
      await expect(page.getByTestId('toast')).toBeVisible();
      await expect(page.getByTestId('toast-message')).toContainText('Application submitted');
    });

    test('applied badge shows on job card after successful application', async ({ applicantPage: page }) => {
      // Submit application
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();

      // Navigate to job list and check badge
      await page.goto('/#/jobs');
      await expect(page.getByTestId('applied-badge').first()).toBeVisible();
    });

    test('already-applied badge shows on detail page after applying', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();

      // Revisit detail page
      await page.goto('/#/jobs/job-1');
      await expect(page.getByTestId('already-applied-badge')).toBeVisible();
      await expect(page.getByTestId('apply-button')).not.toBeVisible();
    });

    test('cannot apply twice to the same job', async ({ applicantPage: page }) => {
      // Apply once
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();

      // Confirm apply button is gone on revisit
      await page.goto('/#/jobs/job-1');
      await expect(page.getByTestId('apply-button')).not.toBeVisible();
      await expect(page.getByTestId('already-applied-badge')).toBeVisible();
    });
  });

  test.describe('Application tracking', () => {
    test('submitted application appears in dashboard', async ({ applicantPage: page }) => {
      // Apply to a job
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();

      // Check dashboard
      await page.goto('/#/applicant/dashboard');
      const cards = await page.locator('[data-testid^="application-card-"]').all();
      expect(cards.length).toBe(1);
    });

    test('new application shows pending status', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();

      await page.goto('/#/applicant/dashboard');
      const statuses = await page.locator('[data-testid^="application-status-"]').allTextContents();
      expect(statuses).toContain('Pending');
    });

    test('total applications stat increments after applying', async ({ applicantPage: page }) => {
      await page.goto('/#/applicant/dashboard');
      const before = parseInt(await page.getByTestId('stat-total').textContent() || '0');

      await page.goto('/#/jobs/job-2');
      await page.getByTestId('apply-button').click();
      await page.getByTestId('cover-letter-input').fill(LONG_COVER_LETTER);
      await page.getByTestId('resume-input').setInputFiles(RESUME_PATH);
      await page.getByTestId('submit-application').click();
      await expect(page.getByTestId('apply-modal')).not.toBeVisible();

      await page.goto('/#/applicant/dashboard');
      const after = parseInt(await page.getByTestId('stat-total').textContent() || '0');
      expect(after).toBe(before + 1);
    });
  });
});
