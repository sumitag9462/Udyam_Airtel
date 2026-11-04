# Pitch Deck to Application Traceability Matrix

> [!NOTE]
> **Airtel SYNC 2026 Hackathon · Digital Track A (Project Udyam Digital)**  
> Authoritative traceability mapping every slide of the official **7-Slide Jury Presentation Deck** directly to working application routes, backend endpoints, database models, test suites, and non-negotiable architectural rules.  
> An optional 10-slide extended case breakdown is preserved in Appendix A.

---

## 1. Primary Seven-Slide Pitch Traceability Matrix

| Slide # | Slide Title | Strategic Objective & Case Problem | Application Screen / URL | Backend Endpoint & Service | Ground Truth Data Source | Non-Negotiable Rule Satisfied |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **Slide 1** | **Executive Challenge: The 7.36% SMB Baseline** | 92.64% of SMB leads fail to activate (only 368 / 5,000 activate); ₹15,053 blended CAC; 17.6-day velocity | `/backoffice` (Executive Command Center), `/admin` | `GET /api/v1/backoffice/funnel`, `GET /api/v1/backoffice/metrics` | `data/smb_leads.csv` (5,000 rows), `scripts/check-business-claims.js` | **Rule 4:** No fabricated data. Metrics faithfully reproduce the exact 7.36% baseline (368 / 5,000). |
| **Slide 2** | **The Four Structural Funnel Leaks** | Visualizing structural leaks: 3,026 pre-assessment (65.3%), 1,113 quote drops, 273 paperwork failures, 220 install delays | `/backoffice` (Funnel & Leaks Tab) | `GET /api/v1/backoffice/funnel` | `smb_leads.csv` stage exit calculations | **Rule 4 & Rule 17:** Honest funnel attrition reporting with exact drop reason cross-tabulation. |
| **Slide 3** | **Architecture & The Rules/LLM Firewall** | Eliminating LLM price/date hallucinations; strict separation of facts (rules engine) from language (LLM) | `/how-it-works`, `docs/ARCHITECTURE.md` | `server/src/rules/engine.js`, `server/src/advisor/guard.js` | `data/product_catalogue.csv` (25 SKUs seeded in MongoDB) | **Rule 1 & Rule 2:** Rules engine owns facts; LLM owns language; response guard rejects raw currency/SKUs. |
| **Slide 4** | **Conversational AI Advisor & Business Preview** | Engaging SMB owners in Hindi/English; resolving pre-assessment drop in $\le 6$ simple questions | `/advisor`, `/recommendations/:sessionId` | `POST /api/v1/advisor/chat`, `GET /api/v1/advisor/sessions/:id` | `Conversation`, `Lead` models | **Rule 13 & Rule 16:** Deterministic fallback, $\le 6$ turns maximum, native bilingual Hindi/English empathy. |
| **Slide 5** | **Smart Paperless KYC & Regulated Verification** | Eliminating 273 paperwork drop-outs via mobile document capture and 19 canonical checks (C01–C19) | `/kyc/:caseId`, `/admin/kyc`, `/backoffice/kyc-queue` | `POST /api/v1/kyc/consent`, `POST /api/v1/kyc/upload`, `GET /api/v1/kyc/review-queue` | `mock_gstin_registry.csv`, `mock_udyam_registry.csv`, 47 specimen images | **Rule 5, 7, 8:** Consent before upload (HTTP 403 gate); AES-256-GCM vault; zero false instant-KYC claims. |
| **Slide 6** | **Optical Telemetry & Self-Serve Tracker** | Eliminating 220 post-KYC install delay cancellations via live telemetry and technician self-scheduling | `/tracker`, `/orders/:id`, `/partner` | `GET /api/v1/orders/:id`, `POST /api/v1/orders/:id/slot`, `PATCH /api/v1/partner/tasks/:id` | `Order`, `HelpRequest` models | **Rule 12 & Rule 14:** Idempotency-Key on order creation; realistic telemetry instead of fake guarantees. |
| **Slide 7** | **Back-Office Recovery, ML Propensity & Commercial ROI** | Recovering lost enterprise ARR via L2 propensity ranking (AUC 0.6879) and ₹15.2M incremental ARR model | `/backoffice` (Unclosed Leads), `/admin/leads` | `GET /api/v1/backoffice/unclosed-leads`, `POST /api/v1/scoring/predict` | `scoring/propensity_model.json` ($N=5,000$), `scripts/check-business-claims.js` | **Rule 6 & Rule 17:** PII masked in all queues; empirical AUC 0.6879 audited; ₹15.2M ARR mathematically proven. |

---

## 2. Technical Verification of Presentation Claims

### Slides 1 & 2: Funnel Baseline & Four Structural Leaks
- **Command:** `npm run test:business`
- **Output:** Reproduces exact 5,000 quarterly leads, 368 activations (7.36%), 3,026 pre-assessment drop-outs (65.3% of lost leads), 1,113 quote drops, 273 paperwork drops, and 220 post-KYC install drops.
- **Automated Test:** `server/tests/backoffice/backoffice.test.js`

### Slide 3: Deterministic Rules & Response Guard
- **Command:** `npm run test:advisor`
- **Output:** 31 tests pass across 25 scripted scenarios. Response guard strictly intercepts and rejects unescaped currency amounts (`₹`, `Rs`, `INR`), bare SKU codes (`P01`–`P25`), and percentages.
- **Automated Test:** `server/tests/advisor/advisor.test.js`

### Slide 4: AI Advisor & Recommendations
- **Command:** `npm run test:e2e` (Journey 1 & Journey 5)
- **Output:** Validates complete Hindi & English dialogue state machine, $\le 6$ questions, and transparent recommendations with add-on toggles.

### Slide 5: Canonical Smart KYC (C01–C19)
- **Command:** `npm test -- tests/kyc/kyc.test.js`
- **Output:** 22 tests pass across all 12 challenge specimens (K01–K12) and 47 documents. Evaluates C05 registry status block on K01, C18 OCR noise on K02, C17 blur on K04, C07 name mismatch on K07, and C15 expired proof on K11.

### Slide 6: Provisioning Telemetry & Tracker
- **Command:** `npm run test:e2e` (Journey 1, Step 4)
- **Output:** Verifies 5-stage sequential optical delivery stepper, interactive 2-hour technician slot selection, and help desk escalation modal.

### Slide 7: Propensity ML & Commercial ROI
- **Command:** `node scripts/check-business-claims.js`
- **Output:** Validates L2-regularized logistic regression ROC AUC = **0.6879** trained without leakage features; mathematically proves ₹15.2M incremental ARR uplift based on recovering 382 accounts @ ₹3,318/mo.

---

## Appendix A: Extended 10-Slide Case Breakdown (Optional)

For reference and extended deep-dive jury inquiries, the original 10-topic case breakdown maps to the 7-slide structure as follows:

| Extended Topic | Corresponding Pitch Slide | Focus Area |
| :--- | :---: | :--- |
| **Topic 1:** Executive Summary & Baseline | **Slide 1** | The 7.36% conversion dilemma and SMB macro context |
| **Topic 2:** Funnel Diagnostics | **Slide 2** | The Four Leaks breakdown across 5,000 leads |
| **Topic 3:** Architecture & Non-Negotiables | **Slide 3** | Rules engine facts vs guarded LLM language |
| **Topic 4:** AI Advisor | **Slide 4** | Multilingual empathy in $\le 6$ questions |
| **Topic 5:** Transparent Quote Builder | **Slide 4** | Single monthly total and business preview simulator |
| **Topic 6:** Smart KYC Pipeline | **Slide 5** | 19 canonical checks and automated registry matching |
| **Topic 7:** Radical Honesty & Review Queue | **Slide 5** | Human review desk and honest non-instant claims |
| **Topic 8:** Provisioning Telemetry Tracker | **Slide 6** | 5-stage optical light level tracker and slot picker |
| **Topic 9:** Unclosed Lead Prioritization | **Slide 7** | Propensity scoring (AUC 0.6879) and sales badges |
| **Topic 10:** DPDP Act & Privacy Governance | **Slide 7 & Privacy Note** | DPDP Act 2023 compliance, data minimisation, right to erasure |
