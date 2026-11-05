import { test, expect } from '@playwright/test';

test.describe('Journey 4: Cancelled GSTIN Blocked at Statutory C05 Check', () => {
  test('verifies C05 (Active Status) halts verification for cancelled GSTIN, while C02 (format) and C03 (checksum) pass', async ({ page }) => {
    // 1. Authenticate as business owner
    await page.goto('/login');
    await page.fill('#owner-phone', '9876543210');
    await page.click('button:has-text("Get OTP")');
    await page.waitForTimeout(600);

    const autofillBtn = page.locator('button:has-text("Autofill code")');
    if (await autofillBtn.isVisible()) {
      await autofillBtn.click();
    } else {
      for (let i = 0; i < 6; i++) {
        await page.fill(`#otp-${i}`, '1');
      }
    }
    await page.click('button:has-text("Verify & Continue")');
    await page.waitForTimeout(1000);

    // 2. Navigate to /kyc
    await page.goto('/kyc');
    await expect(page.locator('h2:has-text("Smart Document Verification")')).toBeVisible({ timeout: 5000 });

    // 3. Grant DPDP consent if not already granted
    const grantConsentBtn = page.locator('button:has-text("Grant Consent & Continue")');
    if (await grantConsentBtn.isVisible()) {
      const consentCheckbox = page.locator('input[type="checkbox"]').first();
      await consentCheckbox.check();
      await grantConsentBtn.click();
      await page.waitForTimeout(600);
    }

    // 4. Select Specimen K01 (Cancelled GSTIN: 37IHKXV5167L1ZS)
    await page.selectOption('select', 'K01');

    // 5. Trigger automated verification
    await page.click('button:has-text("Verify Documents Instantly")');

    // 6. Assert outcome is strictly REJECTED due to cancelled status
    await expect(page.locator('text=KYC Verification Ineligible / Rejected')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('span:has-text("REJECTED")').first()).toBeVisible();
    await expect(page.locator('text=Hard eligibility blocker: GSTIN Status Active')).toBeVisible();

    // 7. Open 19 checks audit modal
    await page.click('button:has-text("Inspect 19 Regulated Checks")');

    // 8. Assert statutory verification behavior inside modal:
    // C02 (format), C03 (checksum), and C04 (found in registry) pass
    await expect(page.locator('text=C02: GSTIN Format Valid').first()).toBeVisible();
    await expect(page.locator('text=C03: GSTIN Checksum Valid').first()).toBeVisible();
    await expect(page.locator('text=C04: GSTIN Found in Registry').first()).toBeVisible();

    // C05 (Active Status) fails as a HARD BLOCKER
    await expect(page.locator('text=C05: GSTIN Status Active').first()).toBeVisible();
    await expect(page.locator('.fixed span:has-text("HARD BLOCKER")').first()).toBeVisible();
    await expect(page.locator('text=non-active status blocks').first()).toBeVisible();
  });
});
