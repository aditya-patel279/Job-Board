import { test as base, type Page, type BrowserContext } from '@playwright/test';

/**
 * Custom fixtures that give every test a pre-authenticated page.
 * No manual login needed in tests — just use employerPage or applicantPage.
 *
 * This is one of the most important patterns in real-world Playwright testing.
 */

async function seedAndLogin(page: Page, email: string, password: string) {
  await page.goto('/');
  // Reset seed flag so fresh data loads
  await page.evaluate(() => {
    localStorage.removeItem('jb_seeded');
    localStorage.clear();
  });
  await page.goto('/#/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit').click();
  // Wait for redirect away from login
  await page.waitForFunction(() => !window.location.hash.includes('/login'));
}

interface JobBoardFixtures {
  employerPage: Page;
  applicantPage: Page;
  guestPage: Page;
  // Dual-context for cross-role tests
  employerContext: BrowserContext;
  applicantContext: BrowserContext;
}

export const test = base.extend<JobBoardFixtures>({
  employerPage: async ({ page }, use) => {
    await seedAndLogin(page, 'employer@test.com', 'password123');
    await use(page);
  },

  applicantPage: async ({ page }, use) => {
    await seedAndLogin(page, 'applicant@test.com', 'password123');
    await use(page);
  },

  guestPage: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('jb_seeded');
      localStorage.clear();
    });
    await page.goto('/#/jobs');
    await use(page);
  },

  // Separate browser contexts for cross-role flow tests
  employerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await seedAndLogin(page, 'employer@test.com', 'password123');
    await use(context);
    await context.close();
  },

  applicantContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await seedAndLogin(page, 'applicant@test.com', 'password123');
    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';
