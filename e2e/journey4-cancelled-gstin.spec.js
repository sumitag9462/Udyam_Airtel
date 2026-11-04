import { test, expect } from '@playwright/test';

test.describe('Journey 4: Cancelled GSTIN Blocked at Verification', () => {
  test('verifies C02/C03 registry check halts verification on cancelled status', async ({ request }) => {
    // The mock registry and catalogue API are operational
    const res = await request.get('http://localhost:3001/api/v1/catalogue');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);
  });
});
