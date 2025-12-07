import { expect, test } from '@playwright/test';

test.describe('Cost Profile View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');
    // Navigate to Cost view tab
    await page.click('header button:has-text("Cost")');
  });

  test('should show empty state when no initiatives exist', async ({ page }) => {
    await expect(page.locator('text=No cost data')).toBeVisible();
    await expect(page.locator('text=Add initiatives with cost estimates')).toBeVisible();
  });

  test('should have Cost tab selected', async ({ page }) => {
    const costTab = page.locator('header button:has-text("Cost")');
    await expect(costTab).toHaveClass(/text-primary-700/);
  });

  test('should switch back to Timeline view', async ({ page }) => {
    await page.click('header button:has-text("Timeline")');

    const timelineTab = page.locator('header button:has-text("Timeline")');
    await expect(timelineTab).toHaveClass(/text-primary-700/);

    const costTab = page.locator('header button:has-text("Cost")');
    await expect(costTab).not.toHaveClass(/text-primary-700/);
  });

  test('should switch to Dependencies view', async ({ page }) => {
    await page.click('header button:has-text("Dependencies")');

    const depsTab = page.locator('header button:has-text("Dependencies")');
    await expect(depsTab).toHaveClass(/text-primary-700/);

    const costTab = page.locator('header button:has-text("Cost")');
    await expect(costTab).not.toHaveClass(/text-primary-700/);
  });
});
