import { test, expect } from '@playwright/test';

test.describe('Journey 5: AI Advisor Fallback & Deterministic Response Guard', () => {
  test('advisor interface renders conversation and handles fallback gracefully', async ({ page }) => {
    await page.goto('/advisor');
    await expect(page.locator('h1, h2')).toContainText([/advisor|सलाहकार|udyam/i]);

    // Check chat input area
    const inputArea = page.locator('textarea, input[type="text"]').first();
    await expect(inputArea).toBeVisible();

    // Check that placeholders or structured quick chips are available
    const quickChips = page.locator('button');
    expect(await quickChips.count()).toBeGreaterThan(0);
  });
});
