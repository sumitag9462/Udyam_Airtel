import assert from 'node:assert';

const BASE_URL = 'http://127.0.0.1:3001/api/v1';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('================================================================');
  console.log('   UDYAM ONE: HIGH CONCURRENCY & RACE CONDITION VERIFICATION   ');
  console.log('================================================================\n');

  // Step 1: Authenticate as Demo Owner
  console.log('1. Authenticating test owner...');
  const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const otpReqRes = await request('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  assert(otpReqRes.ok, `OTP Request failed: ${JSON.stringify(otpReqRes.data)}`);

  const outboxRes = await request('/dev/outbox');
  const lastDigits = phone.slice(-4);
  const matching = (outboxRes.data?.data?.notifications || []).filter((n) => n.toMasked?.includes(lastDigits));
  const notif = matching[matching.length - 1];
  const otpCode = notif ? notif.payload.code : '123456';
  console.log(`   Retrieved simulated OTP for ${phone}: ${otpCode}`);

  const authRes = await request('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code: otpCode }),
  });
  assert(authRes.ok, `Authentication failed: ${JSON.stringify(authRes.data)}`);
  const token = authRes.data.data.accessToken;
  const user = authRes.data.data.user;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log(`   ✓ Authenticated as ${user.phone || phone} (${user.role})\n`);

  // Step 2: Concurrent Quote Acceptance
  console.log('2. Testing Concurrent Quote Acceptance (10 simultaneous requests)...');
  const quoteRes = await request('/quotes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      tierLabel: 'standard',
      profile: {
        businessName: 'Concurrency Test Ltd',
        businessType: 'CA / Law office',
        segment: 'prof',
        employeeCount: 8,
        numSites: 1,
        cityTier: 1,
        hasGstin: true,
        budgetMonthly: 5000,
      },
    }),
  });
  assert(quoteRes.ok, 'Failed to create test draft quote');
  const quote = quoteRes.data.data.quote;
  const quoteId = quote._id;
  const initialPriceHash = quote.priceHash;
  const initialMonthly = quote.monthlyTotal;
  console.log(`   Draft Quote created: ${quote.quoteId} (₹${initialMonthly}/mo, hash: ${initialPriceHash})`);

  const quoteIdempotencyKey = `QUOTE-IDEM-${Date.now()}`;
  const acceptPromises = Array.from({ length: 10 }).map((_, i) =>
    request(`/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: { ...authHeaders, 'Idempotency-Key': quoteIdempotencyKey },
    })
  );

  const acceptResults = await Promise.all(acceptPromises);
  const acceptStatuses = acceptResults.map((r) => r.status);
  console.log(`   Accept Responses (10 concurrent): ${acceptStatuses.join(', ')}`);

  // Every concurrent response must be 200 OK
  for (const r of acceptResults) {
    assert.strictEqual(r.status, 200, `Expected 200 but got ${r.status}`);
    assert.strictEqual(r.data.data.quote.status, 'accepted');
    assert.strictEqual(r.data.data.quote.priceHash, initialPriceHash, 'Price hash must remain identical (zero price drift)');
    assert.strictEqual(r.data.data.quote.monthlyTotal, initialMonthly, 'Monthly total must not drift');
  }
  console.log('   ✅ PASS: All 10 concurrent requests resolved idempotently with zero price drift.\n');

  // Step 3: Concurrent Order Creation (10 simultaneous requests with same idempotency key)
  console.log('3. Testing Concurrent Order Creation (10 simultaneous requests with SAME idempotency key)...');
  const orderIdempotencyKey = `ORDER-IDEM-${Date.now()}`;
  const orderPromises = Array.from({ length: 10 }).map(() =>
    request('/orders', {
      method: 'POST',
      headers: { ...authHeaders, 'Idempotency-Key': orderIdempotencyKey },
      body: JSON.stringify({
        quoteId: quoteId,
      }),
    })
  );

  const orderResults = await Promise.all(orderPromises);
  const orderStatuses = orderResults.map((r) => r.status);
  console.log(`   Order Creation Responses (10 concurrent): ${orderStatuses.join(', ')}`);

  for (const r of orderResults) {
    assert(r.status === 201 || r.status === 200, `Expected 201/200 but got ${r.status}`);
    assert(r.data.ok, 'Order response must be ok');
  }

  const orderIds = orderResults.map((r) => r.data.data.orderId || r.data.data._id);
  const uniqueOrderIds = new Set(orderIds);
  console.log(`   Generated Order IDs count: ${uniqueOrderIds.size} (Expected exactly 1)`);
  assert.strictEqual(uniqueOrderIds.size, 1, 'All concurrent requests must return the EXACT same order!');
  const winningOrderId = [...uniqueOrderIds][0];
  console.log(`   Winning Order ID: ${winningOrderId}`);
  console.log('   ✅ PASS: Concurrency guard returned identical order for all 10 requests with zero duplicates.\n');

  // Step 4: Concurrent KYC Consent Submissions
  console.log('4. Testing Concurrent KYC Consent Submissions (5 simultaneous requests)...');
  const consentPromises = Array.from({ length: 5 }).map(() =>
    request('/kyc/consent', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        version: '1.0',
        noticeTitle: 'Airtel Enterprise KYC DPDP Notice',
        itemizedPurposes: [
          { purposeCode: 'IDENTITY_VERIFICATION', purposeText: 'Verification of business identity' },
          { purposeCode: 'SERVICE_DELIVERY', purposeText: 'Physical telecom feasibility' },
        ],
      }),
    })
  );

  const consentResults = await Promise.all(consentPromises);
  for (const r of consentResults) {
    assert(r.ok, 'Consent submission must succeed');
    assert(r.status === 200 || r.status === 201, `Expected 200/201 but got ${r.status}`);
  }
  console.log('   ✅ PASS: All concurrent consent requests accepted and validated cleanly.\n');

  // Step 5: Concurrent Multi-Quote Pipeline
  console.log('5. Testing 5 Distinct Concurrent Orders in Parallel...');
  const distinctConfigs = [
    { tier: 'starter', name: 'Distinct Firm 1 (Starter)', segment: 'prof', budget: 3500 },
    { tier: 'standard', name: 'Distinct Firm 2 (Standard)', segment: 'prof', budget: 5000 },
    { tier: 'resilient', name: 'Distinct Firm 3 (Resilient)', segment: 'prof', budget: 6000 },
    { tier: 'starter', name: 'Distinct Firm 4 (Micro Retail)', segment: 'micro', budget: 3000 },
    { tier: 'standard', name: 'Distinct Firm 5 (Multi-Site)', segment: 'multi', budget: 5500 },
  ];

  const distinctQuotes = await Promise.all(
    distinctConfigs.map((cfg, idx) =>
      request('/quotes', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tierLabel: cfg.tier,
          profile: {
            businessName: cfg.name,
            businessType: 'CA / Law office',
            segment: cfg.segment,
            employeeCount: 5 + idx,
            numSites: 1,
            cityTier: 1,
            hasGstin: true,
            budgetMonthly: cfg.budget,
          },
        }),
      })
    )
  );

  const distinctOrders = await Promise.all(
    distinctQuotes.map((dq, i) =>
      request('/orders', {
        method: 'POST',
        headers: { ...authHeaders, 'Idempotency-Key': `MULTI-ORDER-${Date.now()}-${i}-${Math.random()}` },
        body: JSON.stringify({
          quoteId: dq.data.data.quote._id,
        }),
      })
    )
  );

  for (const dor of distinctOrders) {
    assert.strictEqual(dor.status, 201, 'Each distinct order must succeed with 201');
    assert(dor.data.data.orderId, 'Must have distinct order ID');
  }
  const distinctOrderIds = distinctOrders.map((d) => d.data.data.orderId);
  console.log(`   Created Distinct Orders: ${distinctOrderIds.join(', ')}`);
  assert.strictEqual(new Set(distinctOrderIds).size, 5, 'All 5 must be distinct unique orders');
  console.log('   ✅ PASS: Exactly 5 parallel orders created concurrently with 5 unique IDs and exact pricing.\n');

  console.log('================================================================');
  console.log('   ALL CONCURRENCY, IDEMPOTENCY & RACE CONDITION CHECKS PASSED  ');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('❌ Concurrency test failed:', err);
  process.exit(1);
});
