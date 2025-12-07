import { expect, test } from '@playwright/test';

test.describe('Dependency Graph View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');
    // Navigate to Dependencies view tab
    await page.click('header button:has-text("Dependencies")');
  });

  test('should show empty state when no initiatives exist', async ({ page }) => {
    await expect(page.locator('text=No dependencies')).toBeVisible();
    await expect(page.locator('text=Add initiatives to see the dependency graph')).toBeVisible();
  });

  test('should have Dependencies tab selected', async ({ page }) => {
    const depsTab = page.locator('header button:has-text("Dependencies")');
    await expect(depsTab).toHaveClass(/text-primary-700/);
  });

  test('should switch back to Timeline view', async ({ page }) => {
    await page.click('header button:has-text("Timeline")');

    const timelineTab = page.locator('header button:has-text("Timeline")');
    await expect(timelineTab).toHaveClass(/text-primary-700/);

    const depsTab = page.locator('header button:has-text("Dependencies")');
    await expect(depsTab).not.toHaveClass(/text-primary-700/);
  });

  test('should switch to Resources view', async ({ page }) => {
    await page.click('header button:has-text("Resources")');

    const resourcesTab = page.locator('header button:has-text("Resources")');
    await expect(resourcesTab).toHaveClass(/text-primary-700/);

    const depsTab = page.locator('header button:has-text("Dependencies")');
    await expect(depsTab).not.toHaveClass(/text-primary-700/);
  });

  test('should switch to Cost view', async ({ page }) => {
    await page.click('header button:has-text("Cost")');

    const costTab = page.locator('header button:has-text("Cost")');
    await expect(costTab).toHaveClass(/text-primary-700/);
  });
});
