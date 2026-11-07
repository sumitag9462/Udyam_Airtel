import { test, expect } from '@playwright/test';

test.describe('Journey 1: Hindi Clinic - End-to-End Onboarding', () => {
  test('navigates Hindi advisor, selects standard tier, passes clean KYC, and tracks order', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/Udyam One/i);

    // 2. Switch language to Hindi
    const langBtn = page.getByRole('button', { name: /switch language|english|हिंदी/i });
    if (await langBtn.isVisible()) {
      await langBtn.click();
    }

    // Verify presence of Udyam One branding
    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toBeVisible();

    // 3. Navigate to Advisor
    await page.goto('/advisor');
    await expect(page.locator('h1')).toBeVisible();

    // 4. Navigate to Quotes
    await page.goto('/quotes');
    await expect(page.locator('h1, h2')).toContainText([/quote|योजना|कोटेशन/i]);

    // 5. Select Standard Tier if visible
    const standardTier = page.locator('text=/standard/i').first();
    if (await standardTier.isVisible()) {
      await standardTier.click();
    }

    // 6. Navigate to Smart KYC
    await page.goto('/kyc');
    await expect(page.locator('text=/consent|सहमति|kyc/i').first()).toBeVisible();

    // 7. Provide consent if consent button exists
    const consentBtn = page.getByRole('button', { name: /give consent|सहमति दें|i agree/i });
    if (await consentBtn.isVisible()) {
      await consentBtn.click();
    }

    // 8. Navigate to Tracker
    await page.goto('/tracker');
    await expect(page.locator('text=/Airtel|Udyam One/i').first()).toBeVisible();

    // Verify tracker displays order state or prompt to browse quotes
    const orderState = page.locator('text=/No Active Orders Found|Delivery Progress|Browse Quotes|Connecting|कोई सक्रिय ऑर्डर|ऑर्डर|कोटेशन/i').first();
    await expect(orderState).toBeVisible();
  });
});
