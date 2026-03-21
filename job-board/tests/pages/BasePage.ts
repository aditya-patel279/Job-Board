import { type Page, type Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly toast: Locator;
  readonly toastMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.getByTestId('navbar');
    this.toast = page.getByTestId('toast');
    this.toastMessage = page.getByTestId('toast-message');
  }

  async navigate(hash: string) {
    await this.page.goto(`/#${hash}`);
  }

  async getToastMessage() {
    await expect(this.toast.first()).toBeVisible();
    return this.toastMessage.first().textContent();
  }

  async waitForToast(text?: string) {
    await expect(this.toast.first()).toBeVisible();
    if (text) await expect(this.toastMessage.first()).toContainText(text);
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
  }

  async getCurrentHash() {
    return this.page.evaluate(() => window.location.hash);
  }

  async getNavUserName() {
    return this.page.getByTestId('nav-user-name').textContent();
  }

  async getNavRoleBadge() {
    return this.page.getByTestId('nav-role-badge').textContent();
  }

  async logout() {
    await this.page.getByTestId('logout-button').click();
  }
}
