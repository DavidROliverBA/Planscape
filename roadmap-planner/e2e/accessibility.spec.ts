// Accessibility tests using axe-core for WCAG 2.1 Level AA compliance
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 Level AA Compliance', () => {
  test('Timeline page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Capabilities page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Capabilities' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Initiatives page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Initiatives' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Resources page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Resources' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Scenarios page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Scenarios' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Settings page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Resource Heatmap view should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Resources' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Cost Profile view should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Cost' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Dependency Graph view should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Dependencies' }).click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
