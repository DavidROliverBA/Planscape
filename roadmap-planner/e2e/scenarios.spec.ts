import { expect, test } from '@playwright/test';

test.describe('Scenario Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');
  });

  test('should display scenario selector in header', async ({ page }) => {
    // Scenario selector is visible in header
    await expect(page.locator('#scenario-select')).toBeVisible();
  });

  test('should show Baseline as the default scenario', async ({ page }) => {
    const scenarioSelect = page.locator('#scenario-select');
    await expect(scenarioSelect).toHaveValue('baseline');
  });

  test('should show baseline indicator in scenario selector', async ({ page }) => {
    // Baseline scenario should have a pin icon indicator
    const scenarioSelect = page.locator('#scenario-select');
    await expect(scenarioSelect).toContainText('Baseline');
  });

  test('should indicate baseline scenario in dropdown', async ({ page }) => {
    // The baseline option should have "(Baseline)" indicator
    const baselineOption = page.locator(
      '#scenario-select option[value="baseline"]',
    );
    await expect(baselineOption).toContainText('Baseline');
  });
});

test.describe('Zoom Level', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');
    // Timeline is the default view and has zoom control
  });

  test('should display zoom level selector on Timeline view', async ({
    page,
  }) => {
    await expect(page.locator('label:has-text("Zoom")')).toBeVisible();
    await expect(page.locator('#zoom-select')).toBeVisible();
  });

  test('should have Year as the default zoom level', async ({ page }) => {
    const zoomSelect = page.locator('#zoom-select');
    await expect(zoomSelect).toHaveValue('Year');
  });

  test('should have all zoom level options', async ({ page }) => {
    const zoomSelect = page.locator('#zoom-select');

    await expect(zoomSelect.locator('option[value="Quarter"]')).toHaveText(
      'Quarter',
    );
    await expect(zoomSelect.locator('option[value="HalfYear"]')).toHaveText(
      'Half Year',
    );
    await expect(zoomSelect.locator('option[value="Year"]')).toHaveText('Year');
    await expect(zoomSelect.locator('option[value="3Years"]')).toHaveText(
      '3 Years',
    );
    await expect(zoomSelect.locator('option[value="5Years"]')).toHaveText(
      '5 Years',
    );
    await expect(zoomSelect.locator('option[value="10Year"]')).toHaveText(
      '10 Years',
    );
  });

  test('should change zoom level when selecting a different option', async ({
    page,
  }) => {
    const zoomSelect = page.locator('#zoom-select');

    await zoomSelect.selectOption('Quarter');
    await expect(zoomSelect).toHaveValue('Quarter');

    await zoomSelect.selectOption('5Years');
    await expect(zoomSelect).toHaveValue('5Years');
  });
});
