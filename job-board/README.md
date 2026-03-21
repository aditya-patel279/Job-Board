# HireBoard — Job Board

A role-based job board built with **React + TypeScript**, designed as a
practical playground for learning advanced **Playwright UI automation testing**.

No backend required — everything runs in `localStorage` with a mock API layer
that mirrors real REST patterns, making it perfect for practising `page.route()` mocking.

---

## Quick start

```bash
npm install
npx playwright install
npm run dev          # → http://localhost:5173
npm test             # run all tests
```

---

## Test accounts

| Role | Email | Password |
|---|---|---|
| Employer | employer@test.com | password123 |
| Employer 2 | techcorp@test.com | password123 |
| Applicant | applicant@test.com | password123 |
| Applicant 2 | john@test.com | password123 |

---

## Project structure

```
job-board/
├── src/
│   ├── types/index.ts              ← All TypeScript interfaces
│   ├── mocks/
│   │   ├── data.ts                 ← Seed data (users, jobs, applications)
│   │   └── api.ts                  ← Mock API surface (mirrors REST patterns)
│   ├── context/AuthContext.tsx     ← Auth state + login/register/logout
│   ├── hooks/useRouter.ts          ← Hash-based client-side router
│   ├── components/
│   │   ├── shared/
│   │   │   ├── UI.tsx              ← Button, Input, Badge, Modal, Toast, etc.
│   │   │   ├── Navbar.tsx          ← Role-aware navigation
│   │   │   └── JobsPages.tsx       ← Job listing + Job detail
│   │   ├── auth/AuthPages.tsx      ← Login + Register pages
│   │   ├── employer/
│   │   │   └── EmployerPages.tsx   ← Dashboard, Job form, Applicants view
│   │   └── applicant/
│   │       └── ApplicantPages.tsx  ← Dashboard, Apply modal, Bookmarks
│   ├── App.tsx                     ← Router + layout
│   ├── main.tsx
│   └── index.css
│
├── tests/
│   ├── fixtures/
│   │   ├── auth.fixtures.ts        ← employerPage / applicantPage fixtures
│   │   └── files/
│   │       └── sample-resume.pdf   ← Dummy PDF for upload tests
│   ├── pages/
│   │   ├── BasePage.ts             ← Shared POM base class
│   │   └── JobBoardPages.ts        ← JobsPage, EmployerPage, ApplicantPage POMs
│   └── specs/
│       ├── auth.spec.ts            ← Login, register, logout, redirects
│       ├── jobs.spec.ts            ← Browse, search, filter, detail, bookmarks
│       ├── employer.spec.ts        ← Dashboard, post/edit job, applicant review
│       ├── applicant.spec.ts       ← Apply flow, file upload, tracking
│       └── permissions.spec.ts     ← Role boundaries + API mocking patterns
│
├── playwright.config.ts
├── vite.config.ts
└── .github/workflows/playwright.yml
```

---

## Test commands

| Command | What it does |
|---|---|
| `npm test` | Run all tests headlessly |
| `npm run test:headed` | Watch tests run in the browser |
| `npm run test:ui` | Open Playwright interactive UI |
| `npm run test:debug` | Step through tests with inspector |
| `npm run test:report` | Open last HTML report |
| `npm run test:auth` | Run only auth tests |
| `npm run test:permissions` | Run only permission + API mock tests |

---

## Key patterns to study

### 1. Role-based fixtures (`tests/fixtures/auth.fixtures.ts`)
The most important pattern in this project. Instead of logging in manually
in every test, fixtures handle auth setup once:

```typescript
// In any test file — just import and use:
import { test } from '../fixtures/auth.fixtures';

test('employer can post a job', async ({ employerPage }) => {
  // employerPage is already logged in as an employer
});

test('applicant can apply', async ({ applicantPage }) => {
  // applicantPage is already logged in as an applicant
});
```

### 2. Permission boundary tests (`permissions.spec.ts`)
Don't just check that a button is hidden — check that the *route* is protected:

```typescript
test('applicant redirected from employer dashboard', async ({ applicantPage: page }) => {
  await page.goto('/#/employer/dashboard');
  await expect(page.getByTestId('unauthorized-page')).toBeVisible();
});
```

### 3. API mocking with `page.route()` (`permissions.spec.ts`)
Four patterns you'll use constantly in real projects:

```typescript
// Mock a successful response
await page.route('**/api/jobs', route => route.fulfill({ json: mockData }));

// Simulate a server error
await page.route('**/api/jobs', route => route.fulfill({ status: 500 }));

// Add artificial delay (test loading states)
await page.route('**/api/jobs', async route => {
  await new Promise(r => setTimeout(r, 1000));
  await route.continue();
});

// Inspect outgoing request body
await page.route('**/api/apply', async route => {
  const body = route.request().postDataJSON();
  expect(body.jobId).toBe('job-1');
  await route.continue();
});
```

### 4. File upload testing (`applicant.spec.ts`)
```typescript
await page.getByTestId('resume-input').setInputFiles('tests/fixtures/files/sample-resume.pdf');
await expect(page.getByTestId('selected-file-name')).toHaveText('sample-resume.pdf');
```

### 5. Cross-role flow test (`permissions.spec.ts`)
Two browser contexts, one test — the most powerful pattern:

```typescript
test('applicant applies → employer sees it', async ({ browser }) => {
  const applicantCtx = await browser.newContext();
  const employerCtx = await browser.newContext();
  // applicant applies in their context
  // employer checks dashboard in their context
});
```

---

## What each test file covers

### `auth.spec.ts` (14 tests)
Login success/failure, register as both roles, logout, protected route redirects

### `jobs.spec.ts` (20 tests)
Public job browsing, search by title/company/skill, location/type filters,
job detail page, unauthenticated CTA, employer vs applicant view, bookmarks

### `employer.spec.ts` (17 tests)
Dashboard stats, job list, post new job, form validation, salary validation,
edit job, close listing, view applicants, update status, data isolation

### `applicant.spec.ts` (15 tests)
Dashboard empty state, apply modal, cover letter validation, resume upload,
file type validation, duplicate application prevention, application tracking

### `permissions.spec.ts` (18 tests)
Applicant blocked from employer routes, employer blocked from applicant routes,
guest redirects, data isolation between employers, 5 API mocking patterns,
1 cross-role multi-context flow test

---

## data-testid reference

### Navigation
`navbar`, `nav-logo`, `nav-jobs`, `nav-employer-dashboard`,
`nav-applicant-dashboard`, `nav-bookmarks`, `nav-login`, `nav-register`,
`nav-user`, `nav-user-name`, `nav-role-badge`, `logout-button`

### Auth
`login-page`, `login-form`, `login-error`, `login-submit`,
`register-page`, `register-form`, `register-error`, `register-submit`,
`email-input`, `password-input`, `name-input`, `role-applicant`, `role-employer`,
`go-login`, `go-register`, `test-credentials`

### Jobs
`jobs-page`, `jobs-count`, `jobs-empty`, `search-input`,
`filter-location-type`, `filter-job-type`, `job-list`,
`job-card-{id}`, `job-title`, `job-company`, `job-location`,
`job-location-type`, `job-type`, `job-salary`, `job-tag`,
`applied-badge`, `bookmark-btn-{id}`

### Job detail
`job-detail-page`, `job-detail-title`, `job-detail-company`,
`job-detail-location`, `job-detail-salary`, `job-description`,
`job-requirements`, `job-status-badge`, `apply-button`,
`login-to-apply`, `already-applied-badge`, `employer-cannot-apply`,
`back-to-jobs`

### Employer dashboard
`employer-dashboard`, `post-job-button`, `employer-stats`,
`stat-open-jobs`, `stat-total-applications`, `stat-new-applications`,
`stat-closed-jobs`, `employer-job-list`, `employer-job-{id}`,
`employer-job-title`, `job-status-{id}`, `view-applicants-{id}`,
`edit-job-{id}`, `no-jobs-empty`, `empty-post-button`

### Job form
`job-form-page`, `job-form`, `job-title-input`, `job-company-input`,
`job-description-input`, `job-requirements-input`, `job-location-input`,
`job-location-type-select`, `job-type-select`, `salary-min-input`,
`salary-max-input`, `job-tags-input`, `submit-job-button`,
`close-job-button`, `back-to-dashboard`

### Applicants
`applicants-page`, `applicants-job-title`, `applicants-count`,
`applicant-list`, `applicant-card-{id}`, `applicant-name`,
`applicant-email`, `app-status-{id}`, `review-btn-{id}`,
`no-applicants-empty`, `application-modal`, `cover-letter`,
`resume-filename`, `current-status`, `status-actions`,
`set-status-reviewed`, `set-status-interview`,
`set-status-offered`, `set-status-rejected`

### Applicant dashboard
`applicant-dashboard`, `applicant-stats`, `stat-total`,
`stat-interview`, `stat-pending`, `stat-offered`,
`application-list`, `application-card-{id}`,
`application-job-title`, `application-company`,
`application-status-{id}`, `no-applications-empty`,
`browse-jobs-btn`, `go-browse`

### Apply modal
`apply-modal`, `apply-form`, `apply-error`, `apply-job-title`,
`apply-job-company`, `cover-letter-input`, `resume-input`,
`selected-file-name`, `resume-error`, `submit-application`,
`cancel-apply`

### Bookmarks
`bookmarks-page`, `bookmarks-count`, `bookmarked-job-list`,
`bookmarked-job-{id}`, `bookmarked-job-title`,
`remove-bookmark-{id}`, `no-bookmarks-empty`,
`go-browse-from-bookmarks`

### Shared
`app`, `toast-container`, `toast`, `toast-message`, `toast-dismiss`,
`modal-overlay`, `modal-close`, `unauthorized-page`, `not-found-page`,
`loading-screen`
