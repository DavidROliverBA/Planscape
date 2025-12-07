import { expect, test } from '@playwright/test';

test.describe('Resource Heatmap View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');
    // Navigate to Resources view tab
    await page.click('header button:has-text("Resources")');
  });

  test('should show empty state when no resource pools exist', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No resource pools' })).toBeVisible();
    await expect(page.locator('text=Create resource pools to see utilisation heatmap')).toBeVisible();
  });

  test('should have Resources tab selected', async ({ page }) => {
    const resourcesTab = page.locator('header button:has-text("Resources")');
    await expect(resourcesTab).toHaveClass(/text-primary-700/);
  });

  test('should switch back to Timeline view', async ({ page }) => {
    await page.click('header button:has-text("Timeline")');

    const timelineTab = page.locator('header button:has-text("Timeline")');
    await expect(timelineTab).toHaveClass(/text-primary-700/);

    const resourcesTab = page.locator('header button:has-text("Resources")');
    await expect(resourcesTab).not.toHaveClass(/text-primary-700/);
  });
});
