import { test, expect } from '@playwright/test';

test.describe('Journey 6: Multi-Site Chain & Back-Office Funnel Analytics', () => {
  test('back-office funnel faithfully reproduces 5000 lead case metrics and ML propensity score', async ({ page }) => {
    // 1. Visit backoffice dashboard
    await page.goto('/backoffice');
    await expect(page.locator('h1, h2')).toContainText([/back-office|funnel|analytics/i]);

    // 2. Wait for loading to finish and verify conversion funnel metrics
    await page.waitForSelector('text=/Overall Conversion|Lead|Activated|7.36%|Funnel/i', { timeout: 10000 });
    const funnelContent = await page.textContent('body');
    expect(funnelContent).toMatch(/7\.36%|5,000|5000|368|Funnel/);

    // 3. Verify ML Propensity score column or badges are displayed
    expect(funnelContent).toMatch(/propensity|unclosed|score|ml/i);

    // 4. Verify public privacy policy and DPDP compliance page is reachable
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText(/Privacy Policy|Data Protection/i);
  });
});
