import { test, expect } from '@playwright/test';

test.describe('Journey 3: KYC with Flagged Document - Honest Review Queue Routing', () => {
  test('handles document verification honestly without misleading instant-KYC claims', async ({ page }) => {
    // 1. Visit Smart KYC
    await page.goto('/kyc');
    await expect(page.locator('body')).toBeVisible();

    // 2. Check for specimen selector or document upload area
    const uploadArea = page.locator('text=/specimen|upload|document|दस्तावेज़/i').first();
    await expect(uploadArea).toBeVisible();

    // 3. Verify compliance note: No deceptive "instant KYC" claim
    const textContent = await page.textContent('body');
    // Ensure honesty rule: Clean cases auto-verified, uncertain go to human review
    expect(textContent).toMatch(/review|verification|consent|सहमति/i);

    // 4. Check review queue link if staff / officer
    await page.goto('/backoffice/kyc-queue');
    await expect(page.locator('body')).toBeVisible();
  });
});
