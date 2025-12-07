import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to initialise
    await page.waitForSelector('text=Roadmap Planner');
  });

  test('should display the application title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Roadmap Planner');
    await expect(page.locator('text=Visual Planning Workbench')).toBeVisible();
  });

  test('should show all navigation items in sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');

    await expect(sidebar.locator('text=Timeline')).toBeVisible();
    await expect(sidebar.locator('text=Systems')).toBeVisible();
    await expect(sidebar.locator('text=Capabilities')).toBeVisible();
    await expect(sidebar.locator('text=Initiatives')).toBeVisible();
    await expect(sidebar.locator('text=Resources')).toBeVisible();
    await expect(sidebar.locator('text=Scenarios')).toBeVisible();
    await expect(sidebar.locator('text=Settings')).toBeVisible();
  });

  test('should highlight Timeline by default', async ({ page }) => {
    const timelineButton = page.locator('aside button:has-text("Timeline")');
    await expect(timelineButton).toHaveClass(/bg-primary-600/);
  });

  test('should navigate to Capabilities when clicked', async ({ page }) => {
    await page.click('aside button:has-text("Capabilities")');

    const capabilitiesButton = page.locator('aside button:has-text("Capabilities")');
    await expect(capabilitiesButton).toHaveClass(/bg-primary-600/);

    // Timeline button should no longer be highlighted
    const timelineButton = page.locator('aside button:has-text("Timeline")');
    await expect(timelineButton).not.toHaveClass(/bg-primary-600/);
  });

  test('should navigate to Initiatives when clicked', async ({ page }) => {
    await page.click('aside button:has-text("Initiatives")');

    const initiativesButton = page.locator('aside button:has-text("Initiatives")');
    await expect(initiativesButton).toHaveClass(/bg-primary-600/);
  });

  test('should navigate to Resources when clicked', async ({ page }) => {
    await page.click('aside button:has-text("Resources")');

    const resourcesButton = page.locator('aside button:has-text("Resources")');
    await expect(resourcesButton).toHaveClass(/bg-primary-600/);
  });

  test('should navigate to Scenarios when clicked', async ({ page }) => {
    await page.click('aside button:has-text("Scenarios")');

    const scenariosButton = page.locator('aside button:has-text("Scenarios")');
    await expect(scenariosButton).toHaveClass(/bg-primary-600/);
  });

  test('should navigate to Settings when clicked', async ({ page }) => {
    await page.click('aside button:has-text("Settings")');

    const settingsButton = page.locator('aside button:has-text("Settings")');
    await expect(settingsButton).toHaveClass(/bg-primary-600/);
  });

  test('should show zoom selector on Timeline view', async ({ page }) => {
    // Timeline is default - zoom should be visible
    await expect(page.locator('label:has-text("Zoom")')).toBeVisible();

    // Navigate to Systems - zoom should still be visible (it's in main header)
    await page.click('aside button:has-text("Systems")');

    // Header with zoom is shown on most views
    await expect(page.locator('#zoom-select')).toBeVisible();
  });

  test('should show version number in sidebar', async ({ page }) => {
    await expect(page.locator('text=v0.1.0')).toBeVisible();
  });
});
