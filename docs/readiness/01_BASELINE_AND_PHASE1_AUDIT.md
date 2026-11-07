# 01 — Baseline and Phase 1 Bug Verification Report
**Airtel SYNC 2026 · Enterprise Track A (Project Udyam Digital)**  
**Document ID:** `docs/readiness/01_BASELINE_AND_PHASE1_AUDIT.md`  
**Evaluation Role:** Senior QA Architect, MERN Engineer, Data Integrity & Privacy Reviewer  
**Date:** November 7, 2026  
**Repository Path:** `/Users/sumitagrawal/Desktop/AIRTEL HACKATHON/udyam-one`  

---

## 1. Source Manifest & Provenance

| Source Artifact | File Path / Location | Version / Date | Status | Provenance & Case Reference |
| :--- | :--- | :---: | :---: | :--- |
| **Official Case Study PDF** | `docs/Airtel_SYNC_Case.pdf` | Oct 2026 | **Inspected** | Airtel SYNC 2026 / YTL Hackathon Track A: Project Udyam Digital (Pages 1–6). Prepared by Ankit Srivastava. |
| **Official Synthetic Dataset** | `data/smb_leads.csv` | Apr–Jun 2026 | **Inspected** | 5,000 synthetic MSME lead records with funnel stages, drop reasons, acquisition costs, and churn. |
| **Product Catalogue** | `data/product_catalogue.csv` | Oct 2026 | **Inspected** | 25 Accel Business SKUs with setup fees, city tier availability, and dependency constraints. |
| **Mock GSTIN Registry** | `data/mock_gstin_registry.csv` | Oct 2026 | **Inspected** | 3,534 GSTIN records (3,266 Active, 167 Cancelled, 101 Suspended) with valid checksums (PAN char 4 = `X`). |
| **Mock Udyam Registry** | `data/mock_udyam_registry.csv` | Oct 2026 | **Inspected** | 2,723 Udyam numbers with district code `00`. |
| **Challenge KYC Documents** | `data/kyc_documents/` | Oct 2026 | **Inspected** | 47 specimen document images across 12 test applicants (`K01`–`K12`) with planted defects. |
| **7-Slide Jury Presentation** | `docs/DECK_TO_APP_TRACEABILITY.md` | Nov 2026 | **Inspected** | Slide-by-slide traceability connecting the team's 7-slide deck to routes, models, and tests. |
| **Phase 1 Implementation Report**| `docs/FINAL_RELEASE_REPORT.md` | Nov 2026 | **Inspected** | Phase 1 bug fix claims, route matrices, and initial test outputs. |

---

## 2. Baseline Repository Facts & Change Control

- **Branch:** `main`
- **Short Commit SHA:** `0c6f5ee`
- **Working Tree Status:** Dirty (staged/unstaged files contain bug-bash fixes, translations, and test harnesses). Zero unauthorized destructive commits, stashes, or force-pushes executed.
- **Top-Level Layout:**
  - `backend/`: Express 4.21, Node v26 ESM, Mongoose 8.9, Pino logger, Jest test suites.
  - `frontend/`: React 18 SPA, Vite 6.4.5, Tailwind CSS, Lucide icons, i18next bilingual engine.
  - `data/`: CSV registries, seed files, and encrypted document storage.
  - `docs/`: Technical specifications, architecture diagrams, runbooks, and audit trails.
  - `scripts/`: Verification harnesses for claims, concurrency, customer journeys, and milestones.
  - `e2e/`: Playwright Chromium real-browser end-to-end journey tests.
- **Runtime Environment:**
  - Node.js: `v26.5.0`
  - MongoDB: `8.3 Community` (Standalone local replica set on `127.0.0.1:27017`)
  - Express API Backend: Port `3001`
  - Vite Frontend Dev Server: Port `5173`

---

## 3. Architecture Map & Feature Inventory

```
Frontend Route/Page  --> Component/State --> API Call/Method --> Backend Route --> Controller/Service --> DB Model --> Integration Type --> Evidence
```

| Feature / Capability | Frontend Route | UI Component | Backend API Route | Controller / Service | MongoDB Model | Integration Mode | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Landing & Positioning** | `/` | `Landing.jsx` | `GET /catalogue` | `catalogueController.js` | `Product` | Internal DB | **PASS (Operational)** |
| **Passwordless Mobile OTP** | `/auth` | `authStore.js` | `POST /auth/otp/*` | `authController` $\to$ `authService` | `User`, `OtpChallenge` | Simulated Outbox | **PASS (Operational)** |
| **Staff JWT Login & RBAC** | `/auth` | `authStore.js` | `POST /auth/staff/login` | `authController` $\to$ `authService` | `User`, `RefreshToken` | Bcrypt / JWT | **PASS (Operational)** |
| **Bilingual i18n Toggle** | Global | `Navbar.jsx` | `i18n/index.js` | Static Dict + `GET /catalogue/faq` | None / Static | Reactive i18n | **PASS (Operational)** |
| **GenAI Business Advisor** | `/advisor` | `AdvisorChat.jsx` | `POST /advisor/chat` | `advisorController` $\to$ `MockProvider`| `Conversation`, `Lead`| Hybrid (Rules+LLM)| **PASS (Operational)** |
| **Response Regex Guard** | N/A | Server Middleware| `backend/src/advisor/guard.js` | Regex interceptor | None | Deterministic | **PASS (Operational)** |
| **3-Tier Quotation Engine**| `/quotes/:id`| `QuotePage.jsx` | `POST /quotes` | `quoteController` $\to$ `quoteService` | `Quote` | Deterministic Rules | **PASS (Operational)** |
| **Business Preview Simulator**| `/quotes/:id`| `BusinessPreview.jsx` | Pure Client / Rules | `scenarios.js` | None | Interactive Model | **PASS (Operational)** |
| **20% Budget Cut Optimization**| `/quotes/:id`| `BusinessPreview.jsx` | `POST /rules/scenarios/budget-cut`| `rules.js` $\to$ `scenarios.js` | `Quote` | Deterministic Alg | **PASS (Operational)** |
| **Quote Immutability Lock**| `/quotes/:id`| `QuoteAcceptModal.jsx`| `POST /quotes/:id/accept` | `quoteController.js` | `Quote` (`priceHash`)| SHA-256 Lock | **PASS (Operational)** |
| **DPDP Statutory Consent** | `/kyc` | `KycPage.jsx` | `POST /kyc/consent` | `kycController.js` | `Consent` | HTTP 403 Gate | **PASS (Operational)** |
| **Smart KYC Specimen Upload**| `/kyc` | `KycUploader.jsx` | `POST /kyc/upload` | `kycController` $\to$ `pipeline.js` | `KycCase`, `Document`| 19 Checks (C01–C19)| **PASS (Operational)** |
| **Document Encryption Vault**| N/A | Backend Provider | `LocalEncryptedStorageProvider.js` | AES-256-GCM authenticated cipher | `Document` | Cryptographic | **PASS (Operational)** |
| **Simulated E-Sign & Checkout**| `/checkout`| `CheckoutPage.jsx`| `POST /orders` | `orderController` $\to$ `orderService` | `Order` | Idempotent Sandbox | **PASS (Operational)** |
| **Order Milestone Stepper** | `/tracker` | `TrackerPage.jsx` | `GET /orders/:id` | `orderController` $\to$ `orderService` | `Order` | 5-Stage Stepper | **PASS (Operational)** |
| **2-Hour Slot Scheduler** | `/tracker` | `TrackerPage.jsx` | `POST /orders/:id/slot` | `orderController` $\to$ `orderService` | `Order` | Persisted Slot | **PASS (Operational)** |
| **Optical Telemetry Monitor**| `/tracker` | `TrackerPage.jsx` | `GET /orders/:id` | `orderService.js` (Rx Power) | `Order` | Simulated dBm | **PASS (Simulated)** |
| **"My Udyam" Customer Portal**| `/me` | `MyUdyamPage.jsx` | `GET /me/overview` | `meController.js` | Aggregated Collections| Internal API | **PASS (Operational)** |
| **DPDP Data Portability Export**| `/me/privacy`| `PrivacyCentrePage.jsx`| `GET /me/export` | `meController.js` | Export JSON | Section 11 Export | **PASS (Operational)** |
| **DPDP Right to Erasure** | `/me/privacy`| `PrivacyCentrePage.jsx`| `POST /privacy/erasure` | `meController.js` | Anonymized Records | Section 12 Erasure| **PASS (Operational)** |
| **Executive Backoffice Funnel**| `/backoffice`| `FunnelTab.jsx` | `GET /backoffice/funnel` | `backofficeController.js` | `Lead` (5,000 rows) | Groundtruth Model | **PASS (Operational)** |
| **ML Propensity Scoring** | `/backoffice`| `LeadCard.jsx` | `POST /scoring/predict` | `scoring/engine.js` | `propensity_model.json`| L2 Logistic Regress| **PASS (Operational)** |
| **KYC Exception Review Desk**| `/admin/kyc`| `KycReviewPage.jsx` | `GET /kyc/review-queue` | `kycController.js` | `KycCase` | Staff Queue | **PASS (Operational)** |
| **Field Partner Portal** | `/partner` | `PartnerDashboard.jsx`| `GET /partner/tasks` | `partnerController.js` | `Order` (Field tasks) | Partner RBAC | **PASS (Operational)** |

---

## 4. Independent Verification of Seven Phase 1 Reported Issues (V01–V07)

```
+-----+----------------------------------+-------------------------+-------------------------+--------------------+
| ID  | Issue Description                | Code Evidence           | Executed Test Evidence  | Final Status       |
+-----+----------------------------------+-------------------------+-------------------------+--------------------+
| V01 | AI Advisor Duplicate Greetings   | `AdvisorChat.jsx:32`    | `verify-phase1-fixes.js`| PASS (Verified)    |
| V02 | English/Hindi Switching          | `i18n/index.js`, Navbar | `verify-phase1-fixes.js`| PASS (Verified)    |
| V03 | Order Creation & Track Order 404 | `orderService.js:84`    | `verify-phase1-fixes.js`| PASS (Verified)    |
| V04 | Quote Acceptance & Price Lock    | `quoteController.js:145`| `test-concurrency.js`   | PASS (Verified)    |
| V05 | Advisor ↔ Quote Data Sync        | `engine.js`, `api.js`   | `verify-phase1-fixes.js`| PASS (Verified)    |
| V06 | Dynamic 20% Budget Cut Math      | `scenarios.js:137`      | `verify-phase1-fixes.js`| PASS (Verified)    |
| V07 | Smart KYC IDs & Consent Gate     | `pipeline.js:68`        | `validate-phase3-4-5.js`| PASS (Verified)    |
+-----+----------------------------------+-------------------------+-------------------------+--------------------+
```

### Forensic Details:
- **V01 (Advisor Chat Greetings):** Initial mount in React 18 StrictMode previously triggered repeated greetings. Resolved by checking existing conversation history before dispatching initial welcome. Multi-turn dialogue verified across 3 personas (micro retail, clinic, multi-site). Conversation messages persisted in MongoDB (`Message count: 4`). Status: **PASS**.
- **V02 (Bilingual i18n Switching):** Verified 100% parity across `en/translation.json` and `hi/translation.json`. Language switcher in navbar updates UI immediately without page reload, persisting choice in `localStorage`. Dynamic FAQ endpoint delivers translated Hindi strings. Status: **PASS**.
- **V03 (Order Creation & Track Order):** Verified that `POST /orders` creates a persisted order with unique ID `ORD-20261107-XXXXXX`. Eliminated invalid `ORD-NEW` routing; tracker resolves `ORD-NEW` to the user's latest active order in MongoDB. Direct lookup returns HTTP 200 OK. Zero-order users see a truthful empty state. Status: **PASS**.
- **V04 (Quote Acceptance & Immutability Lock):** On `POST /quotes/:id/accept`, server validates catalog pricing, locks status to `accepted`, and computes a SHA-256 `priceHash`. In `test-concurrency.js`, 10 concurrent acceptances resolved idempotently (status 200). Subsequent modification attempts rejected with HTTP 409 Conflict (`QUOTE_IMMUTABLE`). Status: **PASS**.
- **V05 (Advisor ↔ Quote Data Sync):** Extracted business profile fields (business type, city tier, employee count, must-haves) are accurately received by the quote engine. Calculated monthly totals agree exactly between Advisor preview and Quote Builder (`₹4,634/mo`). Status: **PASS**.
- **V06 (Dynamic 20% Budget Cut):** Fixed reversed parameter bug in `backend/src/routes/rules.js`. Baseline ₹3,396/mo optimized to ₹2,398/mo (Saved ₹998/mo) with explicit trade-offs. Post-optimization line items dynamically recalculated via `POST /quotes/:id/preview`. Status: **PASS**.
- **V07 (Smart KYC Upload & Consent Gate):** Document upload without active DPDP consent is rejected with HTTP 403 `CONSENT_REQUIRED`. Uploading with consent creates a `KycCase` with valid MongoDB ObjectIds resolving both `quoteId` and `leadId`. Evaluates 19 canonical checks and stores ciphertext via AES-256-GCM. Status: **PASS**.

---

## 5. Initial Reliability & Security Read-Only Screening

1. **Authentication & Session Security:**
   - Dual-track authentication: Owner passwordless mobile OTP + Staff Bcrypt-hashed password login.
   - Access tokens have 15-minute expiry; refresh tokens have 7-day expiry with token family rotation. Replay attacks trigger immediate revocation (HTTP 401 `TOKEN_REUSE`).
2. **Access Control & IDOR Prevention:**
   - Server-side authorization enforces `req.user.id` scoping on quotes, orders, and documents.
   - User B attempting to view User A's quote or order receives HTTP 403 `FORBIDDEN`.
   - Backoffice and KYC queue routes require explicit `staff` role.
3. **Document Encryption at Rest:**
   - AES-256-GCM encryption with unique 12-byte IVs and 16-byte authentication tags per file.
   - Raw documents never written to disk in unencrypted form. Decryption verified via SHA-256 checksum match.
4. **DPDP Act 2023 Compliance:**
   - Section 6 affirmative, itemized consent required before document upload.
   - Section 11 machine-readable JSON data portability download (`GET /api/v1/me/export`).
   - Section 12 certified right to erasure with file shredding and record anonymization (`POST /api/v1/privacy/erasure`).
5. **Secret Hygiene:**
   - Zero secrets committed to git. All `.env.example` files contain safe placeholders.

---

## 6. Baseline Actual Test Execution Logs

- **Backend Unit & Integration:** `npm test` passed (15/15 suites, 177/177 tests in 8.75s).
- **Advisor Scenarios:** `npm run test:advisor` passed (31/31 tests across all 25 scenarios in 1.27s).
- **Browser E2E Journeys:** `npm run test:e2e` passed (6/6 Playwright Chromium journeys in 5.6s).
- **Concurrency & Idempotency:** `node scripts/test-concurrency.js` passed (10 quote locks, 10 order dedupes, 5 distinct parallel orders).
- **Business Claims Audit:** `npm run test:business` passed (15/15 mathematical claims verified, ₹15.2M ARR model).
- **Database Seed & Funnel Verifier:** `npm run seed:verify` passed (40/40 database assertions verified).
- **Static Code Analysis:** `npm run lint` passed (0 errors, 31 warnings).
- **Frontend Production Build:** `npm run build` passed (Vite built in 998ms).
- **Service Health Probes:** `GET /healthz` (200 healthy), `GET /readyz` (200 connected).
