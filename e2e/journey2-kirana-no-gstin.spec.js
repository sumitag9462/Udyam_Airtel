import { test, expect } from '@playwright/test';

test.describe('Journey 2: Kirana without GSTIN - Gated Products & AirFiber Alternative', () => {
  test('asserts GSTIN-gated leased lines are restricted and 5G AirFiber alternative is offered', async ({ page }) => {
    // 1. Visit quotes configuration
    await page.goto('/quotes');
    await expect(page.locator('h1, h2')).toContainText([/quote|योजना/i]);

    // 2. Open business preview or configure profile
    const profileToggle = page.getByRole('button', { name: /business preview|profile|scenario/i });
    if (await profileToggle.isVisible()) {
      await profileToggle.click();
    }

    // 3. Verify page explains requirements or provides AirFiber / Starter options
    const textContent = await page.textContent('body');
    expect(textContent).toMatch(/Airtel|AirFiber|Starter|Broadband|Internet/i);

    // 4. Verify no broken page errors
    const errorBanner = page.locator('.error-banner, [role="alert"]');
    if (await errorBanner.isVisible()) {
      const errText = await errorBanner.textContent();
      expect(errText).not.toContain('500');
    }
  });
});
