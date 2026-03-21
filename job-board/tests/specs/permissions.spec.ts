import { test as base, expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixtures';

/**
 * Permission & API Mocking tests
 *
 * This file demonstrates the two most advanced Playwright patterns:
 *
 * 1. PERMISSION BOUNDARY TESTS
 *    Assert that forbidden actions are truly blocked — not just hidden in the UI.
 *    Applicants cannot access employer routes, and vice versa.
 *
 * 2. API MOCKING with page.route()
 *    Intercept fetch/XHR requests and return controlled responses.
 *    This lets you test error states, loading states, and edge cases
 *    without needing a real backend to fail in the right way.
 *
 *    In this app, the "API" is localStorage — so we demonstrate mocking
 *    by intercepting the page's script execution and injecting state,
 *    as well as showing route() patterns you'd use with a real backend.
 */

// ── Permission boundary tests ─────────────────────────────────────
test.describe('Permission boundaries', () => {

  test.describe('Applicant cannot access employer routes', () => {
    test('applicant redirected to unauthorized on employer dashboard', async ({ applicantPage: page }) => {
      await page.goto('/#/employer/dashboard');
      await expect(page.getByTestId('unauthorized-page')).toBeVisible();
      await expect(page).not.toHaveURL(/#\/employer\/dashboard/);
    });

    test('applicant redirected from employer job form', async ({ applicantPage: page }) => {
      await page.goto('/#/employer/jobs/new');
      await expect(page.getByTestId('unauthorized-page')).toBeVisible();
    });

    test('applicant redirected from applicants view', async ({ applicantPage: page }) => {
      await page.goto('/#/employer/jobs/job-1/applicants');
      await expect(page.getByTestId('unauthorized-page')).toBeVisible();
    });

    test('applicant does not see employer nav items', async ({ applicantPage: page }) => {
      await expect(page.getByTestId('nav-employer-dashboard')).not.toBeVisible();
    });

    test('applicant sees their own nav items', async ({ applicantPage: page }) => {
      await expect(page.getByTestId('nav-applicant-dashboard')).toBeVisible();
      await expect(page.getByTestId('nav-bookmarks')).toBeVisible();
    });

    test('apply button is not shown to applicant on own dashboard', async ({ applicantPage: page }) => {
      await page.goto('/#/applicant/dashboard');
      await expect(page.getByTestId('post-job-button')).not.toBeVisible();
    });
  });

  test.describe('Employer cannot access applicant routes', () => {
    test('employer redirected from applicant dashboard', async ({ employerPage: page }) => {
      await page.goto('/#/applicant/dashboard');
      await expect(page.getByTestId('unauthorized-page')).toBeVisible();
    });

    test('employer redirected from bookmarks page', async ({ employerPage: page }) => {
      await page.goto('/#/applicant/bookmarks');
      await expect(page.getByTestId('unauthorized-page')).toBeVisible();
    });

    test('employer does not see applicant nav items', async ({ employerPage: page }) => {
      await expect(page.getByTestId('nav-applicant-dashboard')).not.toBeVisible();
      await expect(page.getByTestId('nav-bookmarks')).not.toBeVisible();
    });

    test('employer sees employer dashboard nav', async ({ employerPage: page }) => {
      await expect(page.getByTestId('nav-employer-dashboard')).toBeVisible();
    });

    test('employer cannot see apply button on job detail', async ({ employerPage: page }) => {
      await page.goto('/#/jobs/job-1');
      await expect(page.getByTestId('apply-button')).not.toBeVisible();
      await expect(page.getByTestId('employer-cannot-apply')).toBeVisible();
    });
  });

  test.describe('Unauthenticated access', () => {
    test('unauthenticated user redirected from employer dashboard', async ({ guestPage: page }) => {
      await page.goto('/#/employer/dashboard');
      await expect(page.getByTestId('login-page')).toBeVisible();
    });

    test('unauthenticated user redirected from applicant dashboard', async ({ guestPage: page }) => {
      await page.goto('/#/applicant/dashboard');
      await expect(page.getByTestId('login-page')).toBeVisible();
    });

    test('unauthenticated user can browse jobs', async ({ guestPage: page }) => {
      await expect(page.getByTestId('jobs-page')).toBeVisible();
    });
  });

  test.describe('Data isolation between employers', () => {
    test('employer cannot edit another employers job', async ({ employerPage: page }) => {
      // job-3 belongs to emp-2 (techcorp), not emp-1 (acme)
      await page.goto('/#/employer/jobs/job-3/edit');
      // The job won't appear in emp-1's list, and direct URL edit is a no-op
      // (the form loads but submit calls updateJob which checks ownership)
      await expect(page.getByTestId('job-form-page')).toBeVisible();
      await page.getByTestId('job-title-input').clear();
      await page.getByTestId('job-title-input').fill('Hacked Title');
      await page.getByTestId('submit-job-button').click();

      // Navigate to jobs and confirm original title is unchanged
      await page.goto('/#/jobs/job-3');
      await expect(page.getByTestId('job-detail-title')).not.toHaveText('Hacked Title');
    });

    test('employer only sees own jobs in dashboard', async ({ employerPage: page }) => {
      await page.goto('/#/employer/dashboard');
      const titles = await page.getByTestId('employer-job-title').allTextContents();
      // All titles should belong to Acme Corp (emp-1), not TechCorp (emp-2)
      expect(titles).not.toContain('UX Designer');
      expect(titles).not.toContain('DevOps Engineer');
    });
  });
});

// ── API mocking with page.route() ─────────────────────────────────
/**
 * page.route() intercepts all matching network requests before they go out.
 * In a real app backed by a REST API, you'd mock endpoints like:
 *   await page.route('**/api/jobs', route => route.fulfill({ json: mockJobs }));
 *
 * Here we demonstrate the same pattern against a hypothetical API,
 * showing you exactly how to use it when you add a real backend.
 */
test.describe('API mocking patterns', () => {

  test('mocking a GET /api/jobs endpoint to return custom data', async ({ page }) => {
    /**
     * PATTERN: Mock an API endpoint to return controlled data.
     * Use case: test how the UI renders with specific data shapes,
     * without needing the real API to return that exact data.
     */
    await page.route('**/api/jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-1',
            title: 'Mocked Job Title',
            company: 'Mock Corp',
            description: 'This job came from a mocked API response.',
            salary: { min: 50000, max: 80000, currency: 'USD' },
            location: 'Anywhere',
            locationType: 'remote',
            jobType: 'full-time',
            tags: ['Mock', 'Test'],
            status: 'open',
            createdAt: new Date().toISOString(),
          }
        ]),
      });
    });

    // If this app used fetch('/api/jobs'), the above would intercept it.
    // The test verifies the mock is set up correctly.
    const routeCount = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        return data.length;
      } catch {
        return -1;
      }
    });
    // The mock intercepts and returns 1 item
    expect(routeCount).toBe(1);
  });

  test('mocking a POST /api/applications to return 500 error', async ({ page }) => {
    /**
     * PATTERN: Simulate server errors to test error handling in the UI.
     * Use case: "What does the UI show when the application submission fails?"
     * You can't make the real API fail on demand — but you can mock it.
     */
    await page.route('**/api/applications', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.continue();
      }
    });

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId: '1' }),
        headers: { 'Content-Type': 'application/json' },
      });
      return { status: res.status };
    });

    expect(response.status).toBe(500);
  });

  test('mocking a slow API response to test loading state', async ({ page }) => {
    /**
     * PATTERN: Add artificial delay to test loading spinners / skeleton screens.
     * Use case: "Does the app show a loading indicator while data loads?"
     */
    await page.route('**/api/jobs*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // In a real app, you'd assert loading state appears then resolves:
    // await expect(page.getByTestId('jobs-skeleton')).toBeVisible();
    // await expect(page.getByTestId('jobs-skeleton')).not.toBeVisible();
    // For now, just confirm the mock delays correctly
    const start = Date.now();
    await page.evaluate(() => fetch('/api/jobs').catch(() => {}));
    expect(Date.now() - start).toBeGreaterThanOrEqual(900);
  });

  test('intercepting and modifying a request before it goes out', async ({ page }) => {
    /**
     * PATTERN: Inspect or modify outgoing requests.
     * Use case: verify the correct headers/body are sent with a request.
     */
    let capturedBody: unknown = null;

    await page.route('**/api/applications', async route => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'new-app' }) });
    });

    await page.evaluate(async () => {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'job-1', coverLetter: 'Hello' }),
      });
    });

    expect(capturedBody).toMatchObject({ jobId: 'job-1' });
  });

  test('blocking specific requests (e.g. analytics)', async ({ page }) => {
    /**
     * PATTERN: Block unwanted requests in tests.
     * Use case: prevent analytics/tracking calls from polluting test runs
     * or slow things down. Also useful for testing offline behaviour.
     */
    await page.route('**/analytics**', route => route.abort());
    await page.route('**/tracking**', route => route.abort());

    // Confirm blocked requests throw a network error
    const result = await page.evaluate(async () => {
      try {
        await fetch('/analytics/event');
        return 'success';
      } catch {
        return 'blocked';
      }
    });
    expect(result).toBe('blocked');
  });
});

// ── Cross-role flow test ──────────────────────────────────────────
test.describe('Cross-role flows', () => {
  test('application posted by applicant appears in employer dashboard', async ({ browser }) => {
    /**
     * PATTERN: Multi-context test — two different users, two browser contexts.
     * This is the most powerful test type for role-based apps.
     *
     * Flow:
     *   1. Applicant logs in and submits an application
     *   2. Employer logs in (separately) and sees the new application
     */
    const COVER = 'I am applying for this position with great enthusiasm and relevant experience.';

    // Step 1: Applicant applies
    const applicantCtx = await browser.newContext();
    const applicantPage = await applicantCtx.newPage();

    await applicantPage.goto('/');
    await applicantPage.evaluate(() => { localStorage.removeItem('jb_seeded'); localStorage.clear(); });
    await applicantPage.goto('/#/login');
    await applicantPage.getByTestId('email-input').fill('applicant@test.com');
    await applicantPage.getByTestId('password-input').fill('password123');
    await applicantPage.getByTestId('login-submit').click();
    await applicantPage.waitForURL(/#\/applicant\/dashboard/);

    await applicantPage.goto('/#/jobs/job-2');
    await applicantPage.getByTestId('apply-button').click();
    await applicantPage.getByTestId('cover-letter-input').fill(COVER);
    await applicantPage.getByTestId('resume-input').setInputFiles(
      base.info().file.replace('permissions.spec.ts', '../fixtures/files/sample-resume.pdf')
    );
    await applicantPage.getByTestId('submit-application').click();
    await expect(applicantPage.getByTestId('apply-modal')).not.toBeVisible();

    // Step 2: Employer checks their applicants for job-2
    // (same browser, new context = separate session)
    const employerCtx = await browser.newContext();
    const employerPage = await employerCtx.newPage();

    await employerPage.goto('/#/login');
    await employerPage.getByTestId('email-input').fill('employer@test.com');
    await employerPage.getByTestId('password-input').fill('password123');
    await employerPage.getByTestId('login-submit').click();
    await employerPage.waitForURL(/#\/employer\/dashboard/);

    await employerPage.goto('/#/employer/jobs/job-2/applicants');
    const count = await employerPage.getByTestId('applicants-count').textContent();
    expect(count).toContain('1 application');

    await applicantCtx.close();
    await employerCtx.close();
  });
});
