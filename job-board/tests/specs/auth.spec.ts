import { test, expect } from '../fixtures/auth.fixtures';

test.describe('Authentication', () => {

  test.describe('Login', () => {
    test('employer can log in and lands on employer dashboard', async ({ employerPage: page }) => {
      await expect(page).toHaveURL(/#\/employer\/dashboard/);
      await expect(page.getByTestId('employer-dashboard')).toBeVisible();
      await expect(page.getByTestId('nav-role-badge')).toHaveText('employer');
    });

    test('applicant can log in and lands on applicant dashboard', async ({ applicantPage: page }) => {
      await expect(page).toHaveURL(/#\/applicant\/dashboard/);
      await expect(page.getByTestId('applicant-dashboard')).toBeVisible();
      await expect(page.getByTestId('nav-role-badge')).toHaveText('applicant');
    });

    test('shows error for wrong password', async ({ guestPage: page }) => {
      await page.goto('/#/login');
      await page.getByTestId('email-input').fill('employer@test.com');
      await page.getByTestId('password-input').fill('wrongpassword');
      await page.getByTestId('login-submit').click();
      await expect(page.getByTestId('login-error')).toBeVisible();
      await expect(page.getByTestId('login-error')).toContainText('Invalid');
    });

    test('shows error for unknown email', async ({ guestPage: page }) => {
      await page.goto('/#/login');
      await page.getByTestId('email-input').fill('nobody@test.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('login-submit').click();
      await expect(page.getByTestId('login-error')).toBeVisible();
    });

    test('submit button is present and clickable', async ({ guestPage: page }) => {
      await page.goto('/#/login');
      await expect(page.getByTestId('login-submit')).toBeEnabled();
    });
  });

  test.describe('Register', () => {
    test('registers a new applicant and redirects to applicant dashboard', async ({ guestPage: page }) => {
      await page.goto('/#/register');
      await page.getByTestId('name-input').fill('New Applicant');
      await page.getByTestId('email-input').fill('newuser@example.com');
      await page.getByTestId('password-input').fill('securepassword');
      await page.getByTestId('role-applicant').click();
      await page.getByTestId('register-submit').click();
      await expect(page).toHaveURL(/#\/applicant\/dashboard/);
    });

    test('registers a new employer and redirects to employer dashboard', async ({ guestPage: page }) => {
      await page.goto('/#/register');
      await page.getByTestId('name-input').fill('New Company');
      await page.getByTestId('email-input').fill('newcompany@example.com');
      await page.getByTestId('password-input').fill('securepassword');
      await page.getByTestId('role-employer').click();
      await page.getByTestId('register-submit').click();
      await expect(page).toHaveURL(/#\/employer\/dashboard/);
    });

    test('shows validation errors when form is empty', async ({ guestPage: page }) => {
      await page.goto('/#/register');
      await page.getByTestId('register-submit').click();
      await expect(page.locator('.field-error').first()).toBeVisible();
    });

    test('shows error for password shorter than 8 characters', async ({ guestPage: page }) => {
      await page.goto('/#/register');
      await page.getByTestId('name-input').fill('Test User');
      await page.getByTestId('email-input').fill('test@test.com');
      await page.getByTestId('password-input').fill('short');
      await page.getByTestId('register-submit').click();
      await expect(page.getByText('At least 8 characters')).toBeVisible();
    });

    test('shows error for duplicate email', async ({ guestPage: page }) => {
      await page.goto('/#/register');
      await page.getByTestId('name-input').fill('Dup User');
      await page.getByTestId('email-input').fill('employer@test.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('register-submit').click();
      await expect(page.getByTestId('register-error')).toContainText('already registered');
    });
  });

  test.describe('Logout', () => {
    test('employer can log out and nav shows login/signup', async ({ employerPage: page }) => {
      await page.getByTestId('logout-button').click();
      await expect(page.getByTestId('nav-login')).toBeVisible();
      await expect(page.getByTestId('nav-register')).toBeVisible();
    });

    test('after logout, protected routes redirect to login', async ({ employerPage: page }) => {
      await page.getByTestId('logout-button').click();
      await page.goto('/#/employer/dashboard');
      await expect(page).toHaveURL(/#\/login/);
    });
  });
});
