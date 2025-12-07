import { expect, test } from '@playwright/test';

test.describe('View Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');
  });

  test('should display all view tabs on Timeline page', async ({ page }) => {
    // Should be on Timeline by default
    const header = page.locator('header');

    await expect(header.locator('button:has-text("Timeline")')).toBeVisible();
    await expect(header.locator('button:has-text("Resources")')).toBeVisible();
    await expect(header.locator('button:has-text("Cost")')).toBeVisible();
    await expect(header.locator('button:has-text("Dependencies")')).toBeVisible();
  });

  test('should have Timeline tab selected by default', async ({ page }) => {
    const timelineTab = page.locator('header button:has-text("Timeline")');
    await expect(timelineTab).toHaveClass(/text-primary-700/);
    await expect(timelineTab).toHaveClass(/border-primary-500/);
  });

  test('should switch to Resources view when tab clicked', async ({ page }) => {
    await page.click('header button:has-text("Resources")');

    const resourcesTab = page.locator('header button:has-text("Resources")');
    await expect(resourcesTab).toHaveClass(/text-primary-700/);

    // Timeline tab should no longer be selected
    const timelineTab = page.locator('header button:has-text("Timeline")');
    await expect(timelineTab).not.toHaveClass(/text-primary-700/);
  });

  test('should switch to Cost view when tab clicked', async ({ page }) => {
    await page.click('header button:has-text("Cost")');

    const costTab = page.locator('header button:has-text("Cost")');
    await expect(costTab).toHaveClass(/text-primary-700/);
  });

  test('should switch to Dependencies view when tab clicked', async ({ page }) => {
    await page.click('header button:has-text("Dependencies")');

    const depsTab = page.locator('header button:has-text("Dependencies")');
    await expect(depsTab).toHaveClass(/text-primary-700/);
  });

  test('should show view tab icons', async ({ page }) => {
    const header = page.locator('header');

    // Check each tab has an icon
    await expect(header.locator('button:has-text("Timeline")').locator('text=/📅/')).toBeVisible();
    await expect(header.locator('button:has-text("Resources")').locator('text=/👥/')).toBeVisible();
    await expect(header.locator('button:has-text("Cost")').locator('text=/💰/')).toBeVisible();
    await expect(header.locator('button:has-text("Dependencies")').locator('text=/🔗/')).toBeVisible();
  });

  test('should not show view tabs on other pages', async ({ page }) => {
    // Navigate to Settings
    await page.click('aside button:has-text("Settings")');

    // View tabs should not be visible on Settings page
    const header = page.locator('header');
    await expect(header.locator('button:has-text("Timeline")')).not.toBeVisible();
  });

  test('should preserve view tab selection when returning to Timeline', async ({ page }) => {
    // Switch to Cost view
    await page.click('header button:has-text("Cost")');
    const costTab = page.locator('header button:has-text("Cost")');
    await expect(costTab).toHaveClass(/text-primary-700/);

    // Navigate to Systems
    await page.click('aside button:has-text("Systems")');

    // Navigate back to Timeline
    await page.click('aside button:has-text("Timeline")');

    // Cost tab should still be selected
    await expect(costTab).toHaveClass(/text-primary-700/);
  });
});
