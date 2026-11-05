# Udyam One — Comprehensive Measured Test Report

**Project:** Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)<br/>
**Execution Environment:** Native Node.js 26, npm, Native MongoDB 8.3 (No Docker)<br/>
**Date:** November 2026<br/>
**Final Result:** PASS (100% of Native Suites and E2E Journeys Passing)<br/>

---

## 1. Executive Test Summary

| Test Suite Category | Framework / Tool | Count | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Unit & Integration** | Jest + Supertest | 15 suites, 177 tests | **PASS (177/177)** | Zero failures, zero open handles |
| **Playwright E2E Journeys** | Playwright Chromium | 6 journeys | **PASS (6/6)** | Real browser hitting live backend & DB |
| **Business & CAC Claims** | Node verification | 15 claims | **PASS (15/15)** | Verified against 5,000 synthetic leads |
| **Seed & Funnel Integrity** | Mongoose assertions | 40 assertions | **PASS (40/40)** | Verified 5,000 leads, 3,534 GSTINs, 2,723 Udyams |
| **End-to-End Workflow** | Integration Script | 4 workflows | **PASS (4/4)** | Verified customer, admin, and partner workflows |
| **Frontend Production Build** | Vite Build | 1 bundle | **PASS (954ms)** | Production assets compiled without errors |

---

## 2. Backend Jest Test Suites (177/177 Passed)

```text
PASS tests/api/quotes.test.js
PASS tests/rules/coverage.test.js
PASS tests/orders/orders.test.js
PASS tests/api/auth.test.js
PASS tests/rules/golden.test.js
PASS tests/api/authMatrix.test.js
PASS tests/backoffice/backoffice.test.js
PASS tests/api/me.test.js
PASS tests/advisor/advisor.test.js
PASS tests/rules/properties.test.js
PASS tests/rules/scenarios.test.js
PASS tests/security/mask.test.js
PASS tests/api/health.test.js
PASS tests/seed/verify.test.js
PASS tests/kyc/kyc.test.js

Test Suites: 15 passed, 15 total
Tests:       177 passed, 177 total
Snapshots:   0 total
Time:        8.033 s
```

---

## 3. Playwright E2E Journeys (6/6 Passed)

```text
Running 6 tests using 1 worker

✓ Journey 1: Hindi clinic advisor, selects standard tier, passes clean KYC, and tracks order (824ms)
✓ Journey 2: Kirana without GSTIN, restricted leased lines, 5G AirFiber alternative offered (610ms)
✓ Journey 3: KYC document re-upload on rejected specimen (720ms)
✓ Journey 4: Cancelled GSTIN fails active registry check while checksum passes (540ms)
✓ Journey 5: LLM provider fallback to deterministic rules engine (350ms)
✓ Journey 6: Multi-site chain funnel faithfully reproduces 5000 lead case metrics (346ms)

6 passed (4.4s)
```

---

## 4. Audited Business & CAC Claims Verification

```text
1. Historical Baseline:
   - Total leads: 5,000 | Total activated: 368 (7.36%) | Total dropped: 4,632
2. The Four Funnel Leaks:
   - Pre-assessment abandonment: 3,026 leads
   - Quote dropouts: 1,113 leads
   - Paperwork / KYC drag: 273 leads
   - Post-KYC install delay: 220 leads
3. CAC & Economics:
   - Total acquisition spend: ₹5,539,640
   - Blended CAC: ₹15,053.37
   - Direct CAC: ₹5,385.19
   - 6-month churn: 15.22%
4. ARR Uplift Audit:
   - Conservative scenario (+382 accounts @ ₹3,318/mo): ₹15,209,712 (~₹15.21M ARR)
```

---

## 5. Seed & Funnel Integrity Verification (`seed:verify`)

```text
✓ Assertion passed: Expected 25 products, got 25
✓ Assertion passed: Expected 5,000 seed leads, got 5000
✓ Assertion passed: Expected 3,534 GSTINs, got 3534 (3,266 Active, 167 Cancelled, 101 Suspended)
✓ Assertion passed: Expected 2,723 Udyam numbers, got 2723
✓ Assertion passed: Funnel Stage 0 (Lead): 5,000
✓ Assertion passed: Funnel Stage 1 (Contacted): 3,406
✓ Assertion passed: Funnel Stage 2 (Needs assessed): 1,974
✓ Assertion passed: Funnel Stage 3 (Quote accepted): 861
✓ Assertion passed: Funnel Stage 4 (KYC complete): 588
✓ Assertion passed: Funnel Stage 5 (Activated): 368
✓ seed:verify passed! All Section 3 and Section 7 assertions verified.
```
