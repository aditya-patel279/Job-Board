import { test, expect } from '../fixtures/auth.fixtures';
import { JobsPage } from '../pages/JobBoardPages';

test.describe('Jobs listing', () => {

  test.describe('Guest / public access', () => {
    test('jobs page is accessible without login', async ({ guestPage: page }) => {
      await expect(page.getByTestId('jobs-page')).toBeVisible();
    });

    test('shows seeded job listings', async ({ guestPage: page }) => {
      const cards = await page.locator('[data-testid^="job-card-"]').all();
      expect(cards.length).toBeGreaterThan(0);
    });

    test('shows job count in subtitle', async ({ guestPage: page }) => {
      const count = await page.getByTestId('jobs-count').textContent();
      expect(count).toMatch(/\d+ open/);
    });

    test('each card shows title, company, location and salary', async ({ guestPage: page }) => {
      const firstCard = page.locator('[data-testid^="job-card-"]').first();
      await expect(firstCard.getByTestId('job-title')).toBeVisible();
      await expect(firstCard.getByTestId('job-company')).toBeVisible();
      await expect(firstCard.getByTestId('job-location')).toBeVisible();
      await expect(firstCard.getByTestId('job-salary')).toBeVisible();
    });

    test('clicking a job card navigates to detail page', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.clickJob(0);
      await expect(page.getByTestId('job-detail-page')).toBeVisible();
    });
  });

  test.describe('Search', () => {
    test('filters jobs by title keyword', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.search('Frontend');
      const titles = await page.getByTestId('job-title').allTextContents();
      expect(titles.every(t => t.toLowerCase().includes('frontend'))).toBeTruthy();
    });

    test('filters jobs by company name', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.search('Acme');
      const companies = await page.getByTestId('job-company').allTextContents();
      expect(companies.every(c => c.toLowerCase().includes('acme'))).toBeTruthy();
    });

    test('filters jobs by skill tag', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.search('TypeScript');
      const cards = await page.locator('[data-testid^="job-card-"]').all();
      expect(cards.length).toBeGreaterThan(0);
    });

    test('shows empty state when no jobs match search', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.search('xyznotexist123');
      await expect(page.getByTestId('jobs-empty')).toBeVisible();
    });

    test('clears results when search is cleared', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.search('Frontend');
      const filteredCount = (await page.locator('[data-testid^="job-card-"]').all()).length;
      await jobsPage.search('');
      const allCount = (await page.locator('[data-testid^="job-card-"]').all()).length;
      expect(allCount).toBeGreaterThanOrEqual(filteredCount);
    });
  });

  test.describe('Filters', () => {
    test('filters by remote location type', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.filterByLocationType('remote');
      const badges = await page.getByTestId('job-location-type').allTextContents();
      expect(badges.every(b => b.toLowerCase() === 'remote')).toBeTruthy();
    });

    test('filters by full-time job type', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.filterByJobType('full-time');
      const badges = await page.getByTestId('job-type').allTextContents();
      expect(badges.every(b => b.toLowerCase() === 'full-time')).toBeTruthy();
    });

    test('combines search and location filter', async ({ guestPage: page }) => {
      const jobsPage = new JobsPage(page);
      await jobsPage.search('Engineer');
      await jobsPage.filterByLocationType('remote');
      const cards = await page.locator('[data-testid^="job-card-"]').all();
      // Either results exist and they match both, or empty state shows
      if (cards.length > 0) {
        const badges = await page.getByTestId('job-location-type').allTextContents();
        expect(badges.every(b => b.toLowerCase() === 'remote')).toBeTruthy();
      } else {
        await expect(page.getByTestId('jobs-empty')).toBeVisible();
      }
    });
  });

  test.describe('Job detail', () => {
    test('shows full job details', async ({ guestPage: page }) => {
      await page.locator('[data-testid^="job-card-"]').first().click();
      await expect(page.getByTestId('job-detail-title')).toBeVisible();
      await expect(page.getByTestId('job-detail-company')).toBeVisible();
      await expect(page.getByTestId('job-detail-salary')).toBeVisible();
      await expect(page.getByTestId('job-description')).toBeVisible();
      await expect(page.getByTestId('job-requirements')).toBeVisible();
    });

    test('back button returns to job list', async ({ guestPage: page }) => {
      await page.locator('[data-testid^="job-card-"]').first().click();
      await page.getByTestId('back-to-jobs').click();
      await expect(page.getByTestId('jobs-page')).toBeVisible();
    });

    test('unauthenticated user sees login-to-apply button', async ({ guestPage: page }) => {
      await page.locator('[data-testid^="job-card-"]').first().click();
      await expect(page.getByTestId('login-to-apply')).toBeVisible();
    });

    test('login-to-apply redirects to login page', async ({ guestPage: page }) => {
      await page.locator('[data-testid^="job-card-"]').first().click();
      await page.getByTestId('login-to-apply').click();
      await expect(page.getByTestId('login-page')).toBeVisible();
    });

    test('employer sees cannot-apply notice on job detail', async ({ employerPage: page }) => {
      await page.goto('/#/jobs');
      await page.locator('[data-testid^="job-card-"]').first().click();
      await expect(page.getByTestId('employer-cannot-apply')).toBeVisible();
      await expect(page.getByTestId('apply-button')).not.toBeVisible();
    });

    test('applicant sees apply button on open job', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs');
      await page.goto('/#/jobs/job-1');
      await expect(page.getByTestId('apply-button')).toBeVisible();
    });
  });

  test.describe('Bookmarks', () => {
    test('applicant can bookmark a job', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs');
      const bookmarkBtn = page.getByTestId('bookmark-btn-job-1');
      await expect(bookmarkBtn).not.toHaveClass(/bookmarked/);
      await bookmarkBtn.click();
      await expect(bookmarkBtn).toHaveClass(/bookmarked/);
    });

    test('bookmarked job appears on saved jobs page', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs');
      await page.getByTestId('bookmark-btn-job-1').click();
      await page.goto('/#/applicant/bookmarks');
      await expect(page.getByTestId('bookmarks-page')).toBeVisible();
      const bookmarkedJobs = await page.locator('[data-testid^="bookmarked-job-"]').all();
      expect(bookmarkedJobs.length).toBeGreaterThan(0);
    });

    test('unbookmarking removes job from saved page', async ({ applicantPage: page }) => {
      await page.goto('/#/jobs');
      await page.getByTestId('bookmark-btn-job-1').click();
      await page.goto('/#/applicant/bookmarks');
      await page.getByTestId('remove-bookmark-job-1').click();
      await expect(page.getByTestId('no-bookmarks-empty')).toBeVisible();
    });

    test('guest user is redirected to login when bookmarking', async ({ guestPage: page }) => {
      const bookmarkBtn = page.locator('[data-testid^="bookmark-btn-"]').first();
      await bookmarkBtn.click();
      await expect(page.getByTestId('login-page')).toBeVisible();
    });

    test('empty bookmarks page shows helpful CTA', async ({ applicantPage: page }) => {
      await page.goto('/#/applicant/bookmarks');
      await expect(page.getByTestId('no-bookmarks-empty')).toBeVisible();
      await expect(page.getByTestId('go-browse-from-bookmarks')).toBeVisible();
    });
  });
});
