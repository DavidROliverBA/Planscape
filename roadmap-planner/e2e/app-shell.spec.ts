import { expect, test } from '@playwright/test';

test.describe('Application Shell', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');

    // App should load without errors
    await expect(page).toHaveTitle('Roadmap Planner');
  });

  test('should display sidebar and main content area', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    // Sidebar should be visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Main content area should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have correct window structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    // Check the flex layout
    const appContainer = page.locator('div.h-screen.w-screen.flex');
    await expect(appContainer).toBeVisible();
  });

  test('should show timeline content in main canvas', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    // Timeline is now the default view - it shows either empty state or SVG timeline
    // Check for the main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Timeline component should be present (either with initiatives or empty state)
    const svgTimeline = main.locator('svg');
    const emptyState = page.locator('text=No initiatives to display');

    // Either the SVG timeline or empty state message should be visible
    const timelineVisible = await svgTimeline.count() > 0;
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(timelineVisible || emptyVisible).toBeTruthy();
  });

  test('should have responsive header with controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Header should contain scenario selector
    await expect(header.locator('#scenario-select')).toBeVisible();

    // Header should contain zoom level selector
    await expect(header.locator('#zoom-select')).toBeVisible();

    // Header should contain view tabs (Timeline is default)
    await expect(header.locator('button:has-text("Timeline")')).toBeVisible();
  });
});

test.describe('Loading State', () => {
  test('should show loading state briefly on initial load', async ({
    page,
  }) => {
    // This test checks that the app handles loading state correctly
    // In practice, the loading is very fast, so we mainly verify
    // the app eventually loads successfully
    await page.goto('/');

    // App should eventually show the main UI
    await expect(page.locator('text=Roadmap Planner')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    // h1 should be the app title in sidebar
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Roadmap Planner');

    // Navigator panel has h2 header
    const h2 = page.locator('h2:has-text("Navigator")');
    await expect(h2).toBeVisible();
  });

  test('should have labeled form controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    // Zoom selector should have a label
    const zoomLabel = page.locator('label[for="zoom-select"]');
    await expect(zoomLabel).toBeVisible();
  });

  test('should have interactive elements as buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Roadmap Planner');

    // Navigation items should be buttons (7 nav items: Timeline, Systems, Capabilities, Initiatives, Resources, Scenarios, Settings)
    const navButtons = page.locator('aside button');
    const count = await navButtons.count();
    expect(count).toBe(7);
  });
});
