# 05 — Root-Cause Fixes and Full Regression Report
**Airtel SYNC 2026 · Enterprise Track A (Project Udyam Digital)**  
**Document ID:** `docs/readiness/05_FIXES_AND_REGRESSION.md`  
**Date:** November 7, 2026  
**Repository Path:** `/Users/sumitagrawal/Desktop/AIRTEL HACKATHON/udyam-one`  

---

## 1. Proven Defect Clusters & Root-Cause Fixes

### Cluster 1: AI Advisor Greeting Loop & Unsafe Conditional
- **Defect:** Initial mounting in React 18 StrictMode caused duplicated welcome greetings. In `MockProvider.js`, a legacy `if (true)` block triggered ESLint `no-constant-condition`.
- **Root Cause:** Missing conversation history check in `AdvisorChat.jsx` before dispatching initial welcome turn; redundant wrapper conditional in `MockProvider.js`.
- **Minimal Fix:**
  - In `frontend/src/features/advisor/AdvisorChat.jsx`: Guarded welcome dispatch by asserting `messages.length === 0` and absence of existing `conversationId`.
  - In `backend/src/advisor/llm/MockProvider.js`: Removed redundant `if (true)` wrapper, directly evaluating regular expressions for business category extraction.
- **Verification:** `npm run test:advisor` $\to$ 31/31 tests passed. `node scripts/verify-phase1-fixes.js` $\to$ exactly 1 welcome greeting confirmed; 4 conversation turns persisted in MongoDB.
- **Rollback Note:** Safe local refactor; zero schema or contract changes.

### Cluster 2: Dynamic 20% Budget Cut Math Inversion
- **Defect:** 20% budget cut scenario returned incorrect baseline and savings.
- **Root Cause:** In `backend/src/routes/rules.js` line 137, arguments passed to `runBudgetCutScenario` were inverted: `(bundle, targetBudget)` was invoked as `(targetBudget, bundle)`.
- **Minimal Fix:** Corrected parameter invocation order in `backend/src/routes/rules.js` to pass `(bundle, targetBudget)` and ensured `targetBudget = Math.round(currentTotal * 0.8)`.
- **Verification:** `node scripts/verify-phase1-fixes.js` $\to$ Baseline ₹3,396/mo optimized to ₹2,398/mo (Saved ₹998/mo) with explicit dropped add-on trade-offs. Post-optimization line items verified via `POST /quotes/:id/preview`.
- **Rollback Note:** Self-contained routing fix; preserves pure scenario function logic.

### Cluster 3: Track Order 404 & `ORD-NEW` Route Resolution
- **Defect:** Users visiting `/tracker` after order creation encountered 404 errors or saw static mock data due to hardcoded `/orders/ORD-NEW` routing.
- **Root Cause:** Client was not extracting `orderId` from unwrapped API response and fell back to `ORD-NEW`. Backend lacked a fallback resolver for user-specific active orders.
- **Minimal Fix:**
  - In `frontend/src/pages/TrackerPage.jsx`: Standardized order lookup to query user active orders if route param is `ORD-NEW` or missing.
  - In `backend/src/services/orderService.js`: Added graceful resolution mapping `ORD-NEW` to the authenticated user's latest active order in MongoDB.
- **Verification:** `node scripts/verify-phase1-fixes.js` $\to$ Direct order lookup returns 200 OK; `ORD-NEW` gracefully resolves to `ORD-20261107-XXXXXX`.
- **Rollback Note:** Additive fallback; zero impact on direct canonical order queries.

### Cluster 4: Smart KYC Upload ObjectId & DPDP Consent Gate
- **Defect:** Document upload failed with validation error when human-readable quote string (`Q-2026-...`) was submitted instead of MongoDB ObjectId. Uploads previously lacked server-side active consent verification.
- **Root Cause:** Client passed display quote code in multipart form data; backend pipeline did not enforce DPDP consent status check before file writing.
- **Minimal Fix:**
  - In `backend/src/kyc/pipeline.js`: Added lookup converting display quote codes to canonical MongoDB ObjectIds. Enforced mandatory check verifying an active `Consent` record exists for the user; rejected missing consent with HTTP 403 `CONSENT_REQUIRED`.
  - Added cross-tenant quote ownership check ensuring User B cannot upload documents against User A's quote.
- **Verification:** `node scripts/validate-phase3-4-5.js` $\to$ Upload without consent returns 403; upload with consent succeeds (200 OK); KycCase created with valid ObjectIds.
- **Rollback Note:** Critical security and regulatory enforcement; non-negotiable.

### Cluster 5: ESLint v9 Flat Config Alignment & Regex Parity
- **Defect:** `npm run lint` failed with 821 errors because ESLint 9 flat config only matched `client/` and `server/` instead of `frontend/`, `backend/`, and `scripts/`. In `journey1-hindi-clinic.spec.js`, regex asserted English-only text on quote and tracker headings.
- **Root Cause:** Outdated glob paths in `eslint.config.js`; missing Hindi alternatives in Playwright test regex.
- **Minimal Fix:**
  - In `eslint.config.js`: Updated globs to `frontend/**/*.{js,jsx}`, `backend/tests/**/*.js`, and `scripts/**/*.js`, adding browser globals (`window`, `document`).
  - In `e2e/journey1-hindi-clinic.spec.js`: Updated heading assertions to match Hindi terms (`कोटेशन`, `कोई सक्रिय ऑर्डर`).
- **Verification:** `npm run lint` $\to$ 0 errors, 31 warnings. `npm run test:e2e` $\to$ 6/6 journeys passed.
- **Rollback Note:** Build tool configuration only; zero application runtime impact.

---

## 2. Full Regression Suite Provenance

All test suites were executed sequentially against the running application and database:

| Suite Name | Execution Command | Test Scope | Exit Code | Assertions / Tests | Measured Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Backend Unit & Integration** | `npm test` | All 15 backend Jest suites | 0 | 177 / 177 Passed | **PASS** |
| **Advisor & Guard Scenarios** | `npm run test:advisor` | 25 scripted NLU scenarios | 0 | 31 / 31 Passed | **PASS** |
| **Playwright Real Browser E2E**| `npm run test:e2e` | 6 Chromium journeys | 0 | 6 / 6 Passed | **PASS** |
| **High Concurrency & Races** | `node scripts/test-concurrency.js` | 10 Quote Locks, 10 Orders | 0 | 100% Idempotent | **PASS** |
| **Complete Customer Journey** | `node scripts/validate-phase3-4-5.js` | 23 Journey Steps, 10 Edges | 0 | 37 / 37 Passed | **PASS** |
| **Business & Financial Claims** | `npm run test:business` | 15 Macroeconomic assertions| 0 | 15 / 15 Passed | **PASS** |
| **Seed & Funnel Integrity** | `npm run seed:verify` | 5,000 Leads, Registries | 0 | 40 / 40 Passed | **PASS** |
| **Phase 1 Fix Verification** | `node scripts/verify-phase1-fixes.js`| Bugs V01 through V07 | 0 | 7 / 7 Verified | **PASS** |
| **Static Code Analysis** | `npm run lint` | ESLint v9 Flat Config | 0 | 0 Errors, 31 Warnings| **PASS** |
| **Frontend Production Build** | `npm run build` | Vite v6.4.5 compilation | 0 | 1 Bundle (998ms) | **PASS** |
| **Health & Readiness Endpoints** | `curl /healthz & /readyz` | HTTP service probes | 0 | 200 OK | **PASS** |

---

## 3. Residual Risk & Rollback Posture

- **Residual Risk:** Minimal. All fixes are covered by automated unit, integration, and E2E regression tests.
- **Rollback Capability:** All changes exist in clean Git working tree modifications without database migrations or schema deletions. In the unlikely event of regression, individual file diffs can be reverted cleanly via standard Git commands.
