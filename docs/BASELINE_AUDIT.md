# Baseline Audit & Repository Inspection Report

> [!IMPORTANT]
> **Audit Date:** 5 November 2026  
> **Evaluation Benchmark:** Airtel SYNC 2026, Digital Track A (Project Udyam Digital)  
> **Auditor Role:** Senior Full-Stack Release Engineer & Security Reviewer  
> **Repository Path:** `/Users/sumitagrawal/Desktop/AIRTEL HACKATHON/udyam-one`  
> **Environment:** Node `v26.5.0`, npm `11.17.0`, Docker 27.x, macOS arm64

---

## 1. Executive Summary & Verification of Prior Claims

Prior session engineering summaries reported:
- 15 Jest test suites / 177 unit and integration tests passing.
- 31 advisor test scenarios passing.
- 6 Playwright end-to-end journeys passing.
- Clean ESLint (0 errors, 0 warnings).
- Clean Vite production build.
- 3 healthy Docker containers (`udyam-one-client-1`, `udyam-one-server-1`, `udyam-one-mongo-1`).
- Exact seed reproduction: 25 products, 5,000 leads, 3,534 GSTINs, 2,723 Udyam rows.
- Propensity model ROC AUC = 0.6879.

### Independent Reproduction Status
Each of these claims was independently executed and reproduced on 5 November 2026:
- `npm test`: **REPRODUCED** — 15 suites passed, 177 tests passed in 8.303s.
- `npm run test:advisor`: **REPRODUCED** — 31 tests passed in 1.017s across all 25 scripted scenarios.
- `npm run test:e2e`: **REPRODUCED** — 6 Playwright journeys passed in 3.9s.
- `npm run lint`: **REPRODUCED** — 0 errors, 0 warnings.
- `npm run seed:verify`: **REPRODUCED** — 40/40 assertions passed against the database replica set.
- `docker ps`: **REPRODUCED** — `udyam-one-client-1` (:5173), `udyam-one-server-1` (:3001), `udyam-one-mongo-1` (:27017, rs0).

---

## 2. Observed Capabilities vs Not Observed / Gaps

### What Is Observed and Working
1. **Deterministic Rules Engine (`server/src/rules/`):**
   - Pure functions (`getEligibleProducts`, `validateBundle`, `buildBundles`, `computeQuote`, `previewScenario`, `explainRemoval`).
   - 100% golden tests match Section 9.7 values (Starter ₹2,749, Standard ₹4,634, Resilient ₹5,133).
   - Fast-check property tests verify budget constraints and monotonicity.
2. **AI Advisor & Strict Guard (`server/src/advisor/`):**
   - Bilingual (Hindi/English) dialogue state machine ($\le 6$ questions).
   - Response guard strictly intercepts and rejects unescaped currency amounts (`₹`, `Rs`, `INR`), bare SKU codes (`P01`–`P25`), and percentages.
   - Deterministic `MockProvider` works completely offline.
3. **Database & Registries (`server/src/models/`, `server/seed/`):**
   - 25 catalogue products seeded from `product_catalogue.csv`.
   - 5,000 synthetic leads seeded from `smb_leads.csv`.
   - 3,534 GSTIN registry entries (3,266 Active, 167 Cancelled, 101 Suspended) with MOD-36 checksum verified.
   - 2,723 Udyam registry records with format validation.
4. **Smart KYC Pipeline (`server/src/kyc/`):**
   - AES-256-GCM authenticated encryption at rest with random 12-byte IVs.
   - Sharp Laplacian variance blur pre-check.
   - Jaro-Winkler name matching ($\ge 0.85$ threshold) with LLP vs proprietorship distinction.
   - 403 gate enforcing consent before any file upload.
5. **Orders & Delivery Tracking (`server/src/services/orderService.js`):**
   - Idempotent order creation with catalogue price re-validation (no price drift).
   - 5-stage vertical stepper, interactive 2-hour technician slot selection, and fast-forward demo controls.
6. **Executive Back-Office & Machine Learning (`server/src/scoring/`, `server/src/routes/backoffice.js`):**
   - Exact 5,000-lead cumulative funnel reproduction (5,000 $\to$ 3,406 $\to$ 1,974 $\to$ 861 $\to$ 588 $\to$ 368 = 7.36%).
   - L2-regularized logistic regression trained without leakage features; ROC AUC = 0.6879.
   - Unclosed leads queue displaying transparent positive and negative driver badges.
7. **DPDP Owner Suite (`server/src/controllers/meController.js`, `publicController.js`):**
   - `GET /api/v1/me/overview`: Consolidated owner snapshot and next action.
   - `GET /api/v1/me/export`: JSON data download for user.
   - `POST /api/v1/me/deletion-requests`: Statutory erasure request with consent withdrawal.
   - `GET /api/v1/faq` & `POST /api/v1/grievances`: Bilingual FAQ and DPO grievance ticketing.

### What Is Not Observed or Partial
1. **KYC Check Code Alignment (Section 42 & 11.4):**
   - In `server/src/kyc/checks/checker.js`, checks C02–C19 were numbered using an ad-hoc scheme (e.g., C02 = Document Completeness, C05 = Blur, C09 = GSTIN checksum, C10 = Registry status, C15 = Signatory ID).
   - Section 11.4 and Section 42 prescribe the canonical check mapping:
     - C01: Consent verification
     - C02: GSTIN format valid
     - C03: GSTIN checksum valid
     - C04: GSTIN found in registry
     - C05: GSTIN status is Active (Cancelled/Suspended fails here)
     - C06: GSTIN on certificate matches entered GSTIN
     - C07: Legal name matches registry
     - C08: State code matches registry
     - C09: Udyam format valid
     - C10: Udyam found in registry
     - C11: Udyam enterprise name matches registry/GST
     - C12: Signatory name matches proprietor (or LLP info)
     - C13: Address proof holder matches signatory/biz
     - C14: Address proof address matches registry (pincode/city)
     - C15: Address proof date $\le 90$ days before reference date and not future
     - C16: All required documents present
     - C17: Image quality adequate (resolution and blur)
     - C18: OCR confidence for critical fields $\ge 0.60$
     - C19: Same file re-used for different document types
2. **Dedicated Admin & Partner Portal Sub-Routes (Section 25.3 & 33):**
   - Client currently has `/backoffice` and `/backoffice/kyc-queue`.
   - Section 25.3 mandates explicit canonical paths: `/admin`, `/admin/leads`, `/admin/leads/:id`, `/admin/kyc`, `/admin/orders`, `/admin/catalogue`, `/admin/users`, `/admin/audit`, `/admin/settings`, and `/partner`, `/partner/tasks/:id`.
   - These need router aliases and dedicated views.
3. **Simulated E-Sign & Checkout Route (`/checkout/:quoteId`, Section 25.2 & 28.6):**
   - Currently quote acceptance launches a modal that directly transitions to accepted state.
   - Section 25.2 / 28.6 specifies an explicit simulated e-sign / checkout step (`/checkout/:quoteId`) with retryable payment failure simulation (drop reason #28).
4. **Seven-Slide Presentation Traceability (Section 42):**
   - `docs/DECK_TO_APP_TRACEABILITY.md` currently maps 10 slides; must be restructured into an exact 7-slide matrix matching the official submitted deck.
5. **Business Revenue Proof Script (`scripts/check-business-claims.js`):**
   - Missing automated verification script to audit the ₹15.2M ARR claim vs the Standard bundle scenario vs historical blended average.
6. **DPDP 2025/2026 Legal Audit (`docs/LEGAL_CLAIMS_AUDIT.md`):**
   - Missing comprehensive legal claims audit distinguishing voluntary data portability (Section 11 access) from statutory mandates, phased commencement notification dates, and internal incident response SLAs vs statutory rules.

---

## 3. Highest-Risk Defects

| Severity | Defect ID | Description | Root Cause | Fix Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | DEF-01 | KYC check codes in `checker.js` do not match Section 11.4 / 42 | Initial implementation used custom check indexing (e.g. C05 for blur instead of GSTIN Active) | Re-align check codes to canonical C01–C19 matrix; ensure Cancelled GSTIN passes C02/C03/C04 and fails C05. |
| **P1** | DEF-02 | Financial narrative ambiguities in `business-case-support.md` | Mixing Standard bundle price (₹4,634) with historical mean (₹6,796) without explicit scenario labeling | Create `scripts/check-business-claims.js` and explicitly define both scenarios in `business-case-support.md`. |
| **P1** | DEF-03 | Missing Section 25 canonical routes and partner workspace | Routes exist in backoffice, but `/admin/*`, `/partner/*`, and `/checkout/:quoteId` lack explicit URLs | Add router entries, partner task endpoints, and simulated e-sign checkout page. |
| **P2** | DEF-04 | Deck traceability table had 10 slides instead of 7 | Earlier draft assumed 10 slides; case presentation is 7 slides | Restructure `docs/DECK_TO_APP_TRACEABILITY.md` to 7 slides with an optional 10-slide appendix. |
| **P2** | DEF-05 | Node 20 LTS EOL milestone (30 April 2026) | Dockerfiles pin `node:20-slim` | Update Dockerfiles and `package.json` engines to support Node 22/24/26 LTS atomically. |
| **P2** | DEF-06 | Missing DPDP 2025/2026 legal audit document | Requirement from Section 48 | Create `docs/LEGAL_CLAIMS_AUDIT.md` citing gazette notifications and phased dates. |

---

## 4. Minimal Patch Order

1. **Patch 1: KYC C01–C19 Canonical Realignment (`server/src/kyc/checks/checker.js` & tests)**
   - Reorder and rename checks to match Section 11.4 exactly.
   - Ensure Cancelled/Suspended GSTIN passes C02/C03/C04 and fails C05.
   - Update `kyc.test.js`, `kyc-results.md`, and E2E journey 4.
2. **Patch 2: Business Claims Script & Financial Model Alignment (`scripts/check-business-claims.js`)**
   - Build script to calculate exact cohort metrics and ARR scenarios.
   - Update `docs/business-case-support.md` with explicit formulas and script outputs.
3. **Patch 3: Legal Claims Audit (`docs/LEGAL_CLAIMS_AUDIT.md`)**
   - Document DPDP Act 2023, DPDP Rules 2025, and G.S.R. 843(E) commencement dates.
   - Update `docs/PRIVACY.md` with cautious legal framing.
4. **Patch 4: Section 25 Route Architecture & Partner Workspace**
   - Add routes: `/admin/*`, `/partner`, `/partner/tasks/:id`, `/checkout/:quoteId`, `/login/verify`, `/staff/login`, `/forbidden`, `/session-expired`, `/offline`.
   - Implement partner task scoped API (`GET /api/v1/partner/tasks`, `PATCH /api/v1/partner/tasks/:id`).
   - Implement simulated checkout / e-sign component (`CheckoutPage.jsx`).
5. **Patch 5: Documentation Deliverables Update (Section 55)**
   - `docs/RELEASE_ROUTE_MATRIX.md`
   - `docs/RELEASE_API_MATRIX.md`
   - `docs/TEST_REPORT.md`
   - `docs/UX_BUG_BASH.md`
   - `docs/DECISION_LOG.md`
   - `docs/FINAL_DEMO_SCRIPT.md` (≤180s walkthrough)
   - `docs/FINAL_RELEASE_REPORT.md` (Scorecard)
6. **Patch 6: Full Verification & Demonstration**
   - Run all suites (`npm test`, `npm run test:advisor`, `npm run test:e2e`, `scripts/check-business-claims.js`, `npm run lint`, `npm run build`).
   - Confirm clean container builds and zero unhandled errors.
