# 03 — Risk Register and Test Backlog
**Airtel SYNC 2026 · Enterprise Track A (Project Udyam Digital)**  
**Document ID:** `docs/readiness/03_RISK_AND_TEST_BACKLOG.md`  
**Date:** November 7, 2026  
**Repository Path:** `/Users/sumitagrawal/Desktop/AIRTEL HACKATHON/udyam-one`  

---

## 1. Executive Risk Summary

Following comprehensive forensic testing across all backend microservices, database schemas, and frontend viewports, **zero Critical or High severity blockers** remain that would prevent hackathon submission or a live 5–7 minute demonstration. All prior Phase 1 bugs (V01–V07) have been verified fixed. The minor remaining risks are low-impact operational boundaries with established mitigations.

---

## 2. Ranked Risk Register

| Risk ID | Severity | Category | Observed Symptom & Reproducible Trigger | Business & Demo Impact | Built-in Mitigation / Repair Intent | Blocker Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **RSK-01** | Low | Operations | Document photo taken with extreme blur or glare | Extraction failure on low-end cameras | Sharp Laplacian blur pre-check catches blur client-side; low confidence scans route to Human Review Desk (`/admin/kyc`) without dropping the lead. | **NON-BLOCKER** |
| **RSK-02** | Low | Integration | Government GST registry API timeout (>3s) | Delayed pre-filling during live lookup | Graceful circuit breaker falls back to document-only OCR extraction with background re-verification flag. | **NON-BLOCKER** |
| **RSK-03** | Low | Demo Perception | Judges ask if optical dBm power telemetry is physical | Telemetry is simulated in hackathon demo | Transparent disclosure: explicitly label in demo script and `LIMITATIONS.md` that optical values (-19.4 dBm) operate within realistic telco physical ranges. | **NON-BLOCKER** |
| **RSK-04** | Low | UX / Navigation | User clicks browser back button after order checkout | Stale form state on checkout page | Route guard detects existing order and redirects directly to `/tracker` with active status. | **NON-BLOCKER** |
| **RSK-05** | Low | Operations | In-flight installation order when user revokes DPDP consent | Active installation blocked | Order status transitions to `KYC_ACTION_NEEDED` with administrative hold until consent is restored or order refunded. | **NON-BLOCKER** |

---

## 3. Verified Test Backlog & Quality Gates

| Test ID | Test Category | Target Subsystem | Execution Method | Expected Behavior | Measured Result |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TST-01** | Functional | Mobile OTP Login | API `POST /auth/otp/verify` | Dispatches simulated code, verifies OTP, issues JWT pair | **PASS** |
| **TST-02** | Functional | AI Advisor Dialogue | API `POST /advisor/chat` | Extracts business parameters, maintains context, suggests plans | **PASS** |
| **TST-03** | Security | LLM Response Guard | Unit `tests/advisor/` | Regex catches and intercepts raw currency, SKUs, and discounts | **PASS** |
| **TST-04** | Functional | Deterministic Bundling | Unit `tests/rules/` | Pure functions match catalog pricing and Golden bundles | **PASS** |
| **TST-05** | Security | Quote Immutability | API `POST /quotes/:id/accept` | Computes SHA-256 priceHash; rejects subsequent mutation (409) | **PASS** |
| **TST-06** | Concurrency | Concurrent Quote Lock | Script `test-concurrency.js` | 10 concurrent acceptances resolve idempotently without price drift | **PASS** |
| **TST-07** | Concurrency | Order Deduplication | Script `test-concurrency.js` | 10 concurrent checkouts with same idempotency key create 1 order | **PASS** |
| **TST-08** | Security | DPDP Consent Gate | API `POST /kyc/upload` | Blocks file upload without consent (403); allows with consent (200)| **PASS** |
| **TST-09** | Security | AES-256-GCM Vault | Unit `tests/kyc/` | Files encrypted with unique IVs; decrypted payload matches SHA-256 | **PASS** |
| **TST-10** | Functional | 19 KYC Canonical Checks | Unit `tests/kyc/` | Evaluates C01–C19 against 12 challenge specimens (K01–K12) | **PASS** |
| **TST-11** | Security | Cross-Tenant IDOR | API `GET /quotes/:id` | User B blocked from reading User A quotes or orders (403) | **PASS** |
| **TST-12** | Security | Token Family Rotation | Unit `tests/api/auth.test.js`| Rotates refresh token; revokes family on reuse attempt (401) | **PASS** |
| **TST-13** | E2E Browser | Real Journey 1 | Playwright Chromium | Hindi clinic onboarding from discovery to tracker | **PASS** |
| **TST-14** | E2E Browser | Real Journey 2 | Playwright Chromium | Kirana store without GSTIN offered 5G AirFiber | **PASS** |
| **TST-15** | E2E Browser | Real Journey 3 | Playwright Chromium | Rejected specimen re-upload workflow | **PASS** |
| **TST-16** | E2E Browser | Real Journey 4 | Playwright Chromium | Cancelled GSTIN fails active registry check | **PASS** |
| **TST-17** | E2E Browser | Real Journey 5 | Playwright Chromium | LLM fallback to deterministic rules engine | **PASS** |
| **TST-18** | E2E Browser | Real Journey 6 | Playwright Chromium | Multi-site chain funnel reproduces 5,000 lead case metrics | **PASS** |
| **TST-19** | Financial | Business Claims Audit | Script `check-business-claims`| Validates 5,000 leads, 7.36% baseline, and ₹15.2M ARR uplift | **PASS** |
| **TST-20** | Static Code | Linting & Syntax | Script `npm run lint` | ESLint v9 Flat Config reports 0 errors across repo | **PASS** |
