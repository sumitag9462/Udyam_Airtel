# Udyam One — Phase 2 Functional Test & QA Verification Report
**Airtel SYNC 2026 Hackathon | Track A: Digital Onboarding & Enterprise Connectivity**  
**Date:** November 7, 2026  
**QA Lead & Security Reviewer:** Senior Full-Stack QA Automation Engineer  
**Test Environment:** macOS Darwin, Node.js v20+, MongoDB 7.0 (Local Daemon port 27017)  
**Backend URL:** `http://localhost:3001` | **Frontend URL:** `http://localhost:5173`

---

## 1. Quality Assurance Overview

Phase 2 focused on rigorous multi-tier quality assurance to ensure **Udyam One** is resilient, functionally complete, and ready for live hackathon demonstration. Testing spanned seven complementary layers:

1. **Unit & Mathematical Integrity:** Jest testing of pricing engines, rule properties, catalog consistency, and financial models.
2. **API & Integration Testing:** Supertest test suites covering authentication, token rotation, quote generation, KYC pipeline, order lifecycle, and backoffice analytics.
3. **End-to-End Browser Testing:** Playwright Chromium automation validating full user journeys from landing to installation tracking.
4. **Scripted Journey Validation (Journeys A through F):** Dedicated automated execution of the 6 mandatory problem statement scenarios.
5. **High Concurrency & Idempotency Testing:** Multi-threaded parallel API calls verifying race conditions and deduplication.
6. **Cross-Device & Mobile Responsiveness:** Layout, text wrapping, and touch navigation audit across 375px (mobile), 768px (tablet), and 1440px (desktop) viewports.
7. **Security, Privacy & DPDP Compliance:** PII phone masking, consent collection, JWT expiry, and RBAC matrix enforcement.

---

## 2. Test Execution Summary

| Test Layer | Test Suite / Command | Total Tests | Passed | Failed | Duration | Status |
|---|---|---|---|---|---|---|
| Unit & Integration | `npm test` (Jest) | 177 | 177 | 0 | 8.38s | ✅ PASS |
| Advisor Scenarios | `npm run test:advisor` | 31 | 31 | 0 | 1.06s | ✅ PASS |
| Financial Model | `npm run test:business` | 15 | 15 | 0 | 0.85s | ✅ PASS |
| Seed Data Verification | `npm run seed:verify` | 40 | 40 | 0 | 0.92s | ✅ PASS |
| Browser E2E | `npm run test:e2e` (Playwright) | 6 | 6 | 0 | 5.80s | ✅ PASS |
| Concurrency & Race | `node scripts/test-concurrency.js` | 26 | 26 | 0 | 1.84s | ✅ PASS |
| Mandatory Journeys A–F | `node scripts/verify-journeys-a-to-f.js`| 6 | 6 | 0 | 2.10s | ✅ PASS |
| Code Quality / Lint | `npm run lint` (ESLint 9) | 41 checks | 41 | 0 errors | 2.45s | ✅ PASS |
| Production Build | `npm run build` (Vite) | 147 modules | 147 | 0 errors | 1.68s | ✅ PASS |

---

## 3. Detailed Verification of Mandatory Journeys (A through F)

### Journey A: English-Speaking Professional Office (Delhi CA / Law Firm)
- **Objective:** Complete end-to-end onboarding: discovery, quote generation, SHA-256 price lock, DPDP consent, Smart KYC verification, order creation, and installation slot scheduling.
- **Observed Flow:**
  1. Authenticated user via phone OTP (`9947276048`).
  2. Advisor gathered profile requirements: Delhi legal practice, 14 users, 1 site, high reliability.
  3. Generated Standard Tier Quote (`Q-2026-F2253E`) with monthly total ₹3,938/mo.
  4. Accepted quote with idempotency key, producing SHA-256 hash `fa94d184d14ce10f...`.
  5. Granted explicit DPDP consent for document verification.
  6. Uploaded Specimen K03 (Clean GSTIN certificate). 19 of 19 automated specification checks passed; verdict: `auto_approved`.
  7. Placed simulated checkout order: `ORD-20261107-18851D` (initial stage: `FEASIBILITY_CONFIRMED`).
  8. Scheduled installation slot for `2026-11-20 (10:00 - 12:00)`; persisted to MongoDB `selectedSlot`.
- **Verdict:** **PASSED** (Full persistence and state transitions verified).

---

### Journey B: Hindi-Speaking Professional Office (Jaipur Kirana Store)
- **Objective:** Test conversational discovery in Hindi (`hi`), switch language mid-stream to English (`en`), verify context preservation, and lock quotation.
- **Observed Flow:**
  1. Authenticated user via phone OTP (`9994427268`).
  2. Advisor received initial query in Hindi: `"नमस्ते, मेरी जयपुर में एक किराना दुकान है। हमें बिलिंग और यूपीआई के लिए इंटरनेट चाहिए।"`.
  3. Advisor responded in Hindi, capturing business type (retail) and low budget requirement.
  4. User sent follow-up in English: `"Also we need a static IP for billing POS"`.
  5. Advisor preserved Hindi history while seamlessly incorporating `static_ip` into the requirements slice.
  6. Generated and locked quote in Hindi context: `Q-2026-A7E25F` (₹3,042/mo).
- **Verdict:** **PASSED** (Bilingual state and context persistence confirmed).

---

### Journey C: Invalid KYC & Re-Upload Workflow
- **Objective:** Upload an invalid/cancelled GSTIN document (Specimen K01), verify automatic rejection with explicit failure codes, and re-upload valid document (K03) to achieve automated approval.
- **Observed Flow:**
  1. Uploaded specimen K01 (containing cancelled GSTIN `07AAAAA0000A1Z5`).
  2. KYC Verification engine executed 19 specification checks.
  3. Checks C02 (format) and C03 (checksum) passed, but check C05 failed (`GSTIN Status: CANCELLED`).
  4. Verdict returned: `rejected` with failure code `C05` and user-friendly explanation: *"Your GSTIN is registered as Cancelled in the national registry. Please provide an active GSTIN or Udyam certificate."*
  5. User re-uploaded clean Specimen K03 (`07AABCA1234A1Z5`).
  6. Pipeline re-evaluated; all 19 checks passed; verdict updated to `auto_approved` with case status `verified`.
- **Verdict:** **PASSED** (Zero silent failures; truthful rejection codes returned).

---

### Journey D: Price-Sensitive Business (Dynamic 20% Budget Cut)
- **Objective:** Simulate a small business facing budget constraints and request a dynamic 20% budget reduction without compromising core connectivity.
- **Observed Flow:**
  1. Created baseline retail quote: ₹1,997/mo.
  2. Invoked scenario preview endpoint `POST /api/v1/quotes/:id/preview` with `{ scenario: 'budget_cut' }`.
  3. Pricing engine targeted a 20% reduction (target $\le$ ₹1,597/mo).
  4. Rules engine evaluated line items and safely downgraded non-critical add-ons while preserving primary fibre connectivity.
  5. Result: Optimized total ₹1,398/mo (total monthly savings: ₹599/mo).
  6. Trade-off breakdown itemized the specific removed/downgraded product with exact savings figures.
- **Verdict:** **PASSED** (Mathematical optimization verified).

---

### Journey E: Complex Multi-Site Business (Assisted Sales Lead)
- **Objective:** Configure a multi-branch business (4 restaurant locations, 35 employees, 8 security cameras), verify indicative pricing flag, and confirm lead routing to backoffice sales queue.
- **Observed Flow:**
  1. Created enterprise quote with `numSites: 4`, `employeeCount: 35`, and `cameras: 8`.
  2. Quote `Q-2026-95B128` generated at ₹7,992/mo with `indicativeOnly: true` (since multi-site installations require physical fibre route surveys).
  3. Authenticated backoffice advisor (`advisor@airtel.com`).
  4. Queried `GET /api/v1/backoffice/unclosed-leads`.
  5. Retrieved unclosed enterprise leads queue (50 leads), ranked transparently by ML propensity percentage.
- **Verdict:** **PASSED** (Enterprise routing and backoffice ranking verified).

---

### Journey F: Existing Order Management & Slot Rescheduling
- **Objective:** Access an existing order, verify ownership isolation, update installation schedule slot, and confirm database persistence.
- **Observed Flow:**
  1. User A retrieved existing order `ORD-20261107-18851D` from Journey A.
  2. Verified current status: `INSTALL_SCHEDULED`.
  3. Rescheduled installation date to `2026-11-25` with time window `14:00 - 17:00`.
  4. Verified immediate MongoDB write and read-back: `selectedSlot.slotDate` accurately returned `2026-11-25` and `selectedSlot.timeWindow` returned `14:00 - 17:00`.
- **Verdict:** **PASSED** (Complete persistence verified).

---

## 4. Playwright End-to-End Browser Automation Results

| Test File | Description | Execution Time | Result |
|---|---|---|---|
| `e2e/journey1-hindi-clinic.spec.js` | Hindi advisor chat, Standard quote selection, Specimen K03 upload, Order placement & Tracker view | 694ms | ✅ PASS |
| `e2e/journey2-kirana-no-gstin.spec.js` | Kirana shop journey, leased line bandwidth restriction check, 5G AirFiber alternative selection | 282ms | ✅ PASS |
| `e2e/journey3-kyc-honesty.spec.js` | Verification of document honesty, no misleading "instant KYC" marketing claims | 390ms | ✅ PASS |
| `e2e/journey4-cancelled-gstin.spec.js` | C05 failure on cancelled GSTIN specimen, verifying format check passes while registry check rejects | 3.01s | ✅ PASS |
| `e2e/journey5-advisor-fallback.spec.js` | Network fallback and grace handling when LLM provider is disconnected | 280ms | ✅ PASS |
| `e2e/journey6-funnel-analytics.spec.js` | Backoffice analytics validation: 5,000 lead funnel reproduction & ML propensity ranking | 276ms | ✅ PASS |

---

## 5. High-Concurrency & Idempotency Testing

To ensure the system survives high-traffic demo environments without duplicate billing or race conditions, `scripts/test-concurrency.js` was executed:

1. **10 Concurrent Quote Acceptances:** 10 parallel HTTP requests to accept the same quote simultaneously.
   - Result: All 10 returned HTTP 200 with identical SHA-256 price hashes (`074c5f80cbd...`). Zero price drift.
2. **10 Concurrent Order Placements (Same Idempotency Key):** 10 parallel order placement calls.
   - Result: All 10 returned HTTP 201; exactly 1 unique order ID was created (`ORD-20261107-412467`). Zero duplicate orders.
3. **5 Distinct Parallel Orders:** 5 distinct users placing orders concurrently.
   - Result: 5 unique orders created with exact pricing.

---

## 6. Mobile & Cross-Device Responsiveness Audit

Screenshots were captured and audited using Playwright across 11 core screens at three standard breakpoints:

- **Mobile Viewport (375 × 667 px):** Zero horizontal scrollbars (`overflow-x: hidden`), touch targets $\ge 44\text{px}$, sticky bottom action bars on Quote and Checkout pages.
- **Tablet Viewport (768 × 1024 px):** 2-column grid reflow, collapsible drawer navigation, comfortable readability.
- **Desktop Viewport (1440 × 900 px):** 3-column tier comparison cards, side-by-side backoffice analytics and lead inspection panels.

---

## 7. Security, Privacy & DPDP Act 2023 Compliance

1. **Phone Number Masking:** Owners' phone numbers are masked in all logs and frontend views (e.g. `******1828`). In MongoDB, phone numbers are stored as salted HMAC-SHA256 hashes (`phoneHash`) with only `phoneLast4` in plaintext.
2. **Explicit DPDP Consent:** Prior to document ingestion, users must check the DPDP consent modal specifying purpose (`KYC_VERIFICATION`), retention period (90 days post-activation), and revocation rights.
3. **JWT Access & Refresh Token Rotation:** Short-lived access tokens (15m) paired with httpOnly, secure refresh tokens (7d) with automatic token family rotation and reuse detection.
4. **Strict RBAC Middleware:**
   - Public: `/healthz`, `/readyz`, `/auth/owner/otp/send`, `/auth/owner/otp/verify`
   - Owner only: `/quotes`, `/orders`, `/kyc`
   - Staff only (`advisor`, `partner`, `admin`): `/backoffice/*`
   - Cross-tenant data isolation: Owners can strictly only query orders, quotes, and KYC cases matching their authenticated `userId`.
