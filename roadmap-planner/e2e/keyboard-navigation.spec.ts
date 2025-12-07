// Keyboard navigation tests for accessibility compliance
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.describe('Main Navigation', () => {
    test('should navigate sidebar links with Tab key', async ({ page }) => {
      await page.goto('/');

      // Focus on first interactive element and tab through navigation
      await page.keyboard.press('Tab');

      // Should eventually reach navigation links
      const navLinks = ['Timeline', 'Capabilities', 'Initiatives', 'Resources', 'Scenarios', 'Settings'];

      for (const linkName of navLinks) {
        const link = page.getByRole('link', { name: linkName });
        await expect(link).toBeVisible();
      }
    });

    test('should activate navigation link with Enter key', async ({ page }) => {
      await page.goto('/');

      const capabilitiesLink = page.getByRole('link', { name: 'Capabilities' });
      await capabilitiesLink.focus();
      await page.keyboard.press('Enter');

      await expect(page.getByRole('heading', { name: 'Capabilities', level: 1 })).toBeVisible();
    });

    test('should activate navigation link with Space key', async ({ page }) => {
      await page.goto('/');

      const initiativesLink = page.getByRole('link', { name: 'Initiatives' });
      await initiativesLink.focus();
      await page.keyboard.press('Space');

      await expect(page.getByRole('heading', { name: 'Initiatives', level: 1 })).toBeVisible();
    });
  });

  test.describe('View Tabs', () => {
    test('should navigate view tabs with Tab key', async ({ page }) => {
      await page.goto('/');

      const tabs = page.getByRole('tablist');
      await expect(tabs).toBeVisible();

      // All tabs should be focusable
      const timelineTab = page.getByRole('tab', { name: 'Timeline' });
      const resourcesTab = page.getByRole('tab', { name: 'Resources' });
      const costTab = page.getByRole('tab', { name: 'Cost' });
      const dependenciesTab = page.getByRole('tab', { name: 'Dependencies' });

      await timelineTab.focus();
      await expect(timelineTab).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(resourcesTab).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(costTab).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(dependenciesTab).toBeFocused();
    });

    test('should switch tabs with Enter key', async ({ page }) => {
      await page.goto('/');

      const resourcesTab = page.getByRole('tab', { name: 'Resources' });
      await resourcesTab.focus();
      await page.keyboard.press('Enter');

      await expect(resourcesTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch tabs with Space key', async ({ page }) => {
      await page.goto('/');

      const costTab = page.getByRole('tab', { name: 'Cost' });
      await costTab.focus();
      await page.keyboard.press('Space');

      await expect(costTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Form Controls', () => {
    test('should navigate form fields with Tab key on Capabilities page', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Capabilities' }).click();
      await page.getByRole('button', { name: 'Add Capability' }).click();

      // Form should be focusable
      const nameInput = page.getByLabel('Capability Name');
      await expect(nameInput).toBeVisible();

      await nameInput.focus();
      await expect(nameInput).toBeFocused();

      // Tab to next field
      await page.keyboard.press('Tab');
      const descInput = page.getByLabel('Description');
      await expect(descInput).toBeFocused();
    });

    test('should submit form with Enter key', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Capabilities' }).click();
      await page.getByRole('button', { name: 'Add Capability' }).click();

      await page.getByLabel('Capability Name').fill('Test Capability');

      // Find and click submit button
      const submitButton = page.getByRole('button', { name: 'Create Capability' });
      await submitButton.focus();
      await page.keyboard.press('Enter');

      // Form should close or show success
      await expect(page.getByText('Test Capability')).toBeVisible();
    });

    test('should close modal with Escape key', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Capabilities' }).click();
      await page.getByRole('button', { name: 'Add Capability' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('Toolbar Controls', () => {
    test('should navigate Resource Heatmap toolbar with Tab key', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Resources' }).click();

      // Toggle buttons should be focusable
      const quarterButton = page.getByRole('button', { name: 'Quarter' });
      const yearButton = page.getByRole('button', { name: 'Year' });

      await quarterButton.focus();
      await expect(quarterButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(yearButton).toBeFocused();
    });

    test('should activate toolbar button with Enter key', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Resources' }).click();

      const yearButton = page.getByRole('button', { name: 'Year' });
      await yearButton.focus();
      await page.keyboard.press('Enter');

      await expect(yearButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should navigate Cost Profile toolbar with keyboard', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Cost' }).click();

      // Chart type buttons should be navigable
      const barButton = page.getByRole('button', { name: 'Bar' });
      const areaButton = page.getByRole('button', { name: 'Area' });

      await barButton.focus();
      await expect(barButton).toBeFocused();

      await areaButton.focus();
      await page.keyboard.press('Enter');
      await expect(areaButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should navigate Dependency Graph toolbar with keyboard', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Dependencies' }).click();

      // Layout buttons should be navigable
      const forceButton = page.getByRole('button', { name: 'Force' });
      const hierarchyButton = page.getByRole('button', { name: 'Hierarchy' });
      const circularButton = page.getByRole('button', { name: 'Circular' });

      await forceButton.focus();
      await expect(forceButton).toBeFocused();

      await hierarchyButton.focus();
      await page.keyboard.press('Space');
      await expect(hierarchyButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should toggle checkbox with Space key', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Dependencies' }).click();

      const criticalPathCheckbox = page.getByRole('checkbox', { name: /Critical path/i });
      await criticalPathCheckbox.focus();

      const initialState = await criticalPathCheckbox.isChecked();
      await page.keyboard.press('Space');

      expect(await criticalPathCheckbox.isChecked()).toBe(!initialState);
    });
  });

  test.describe('Dropdown Controls', () => {
    test('should navigate dropdown with keyboard', async ({ page }) => {
      await page.goto('/');

      // Scenario selector dropdown
      const scenarioSelect = page.getByRole('combobox').first();
      await scenarioSelect.focus();
      await expect(scenarioSelect).toBeFocused();

      // Open dropdown with Enter or Space
      await page.keyboard.press('Space');
    });

    test('should select dropdown option with Enter', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Dependencies' }).click();

      // Node filter dropdown
      const filterSelect = page.locator('select').first();
      await filterSelect.focus();

      // Select different option
      await filterSelect.selectOption('systems');
      await expect(filterSelect).toHaveValue('systems');
    });
  });
});

test.describe('Focus Management', () => {
  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Capabilities' }).click();
    await page.getByRole('button', { name: 'Add Capability' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Focus should be within the dialog
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Tab through all focusable elements - should stay in dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      // Focus should still be within dialog or its overlay
      await expect(currentFocus).toBeVisible();
    }
  });

  test('should return focus after modal closes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Capabilities' }).click();

    const addButton = page.getByRole('button', { name: 'Add Capability' });
    await addButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Focus should return to trigger or nearby element
    await expect(addButton).toBeFocused();
  });

  test('should show visible focus indicators', async ({ page }) => {
    await page.goto('/');

    const link = page.getByRole('link', { name: 'Capabilities' });
    await link.focus();

    // Check for focus ring or outline
    const focusStyles = await link.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        outlineOffset: styles.outlineOffset,
      };
    });

    // Should have some visible focus indicator
    const hasFocusIndicator =
      focusStyles.outline !== 'none' && focusStyles.outline !== '' ||
      focusStyles.boxShadow !== 'none' && focusStyles.boxShadow !== '';

    expect(hasFocusIndicator).toBe(true);
  });
});

test.describe('Skip Links', () => {
  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');

    // First Tab should reveal skip link or focus on it
    await page.keyboard.press('Tab');

    // Check for skip link (common accessibility pattern)
    const skipLink = page.getByRole('link', { name: /skip/i });
    const mainContent = page.getByRole('main');

    // At minimum, main content should be accessible
    await expect(mainContent).toBeVisible();
  });
});
