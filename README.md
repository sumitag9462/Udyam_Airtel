# Udyam One — Regulated SMB Onboarding & Telecommunication Delivery Platform

**Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)**<br/>
*A unified, non-Docker MERN stack platform designed for a jury of Airtel leaders probing architectural, regulatory, and commercial edge cases.*

---

## 1. Executive Summary & Problem Solved

In Airtel's historical baseline cohort of 5,000 micro, small, and medium business (SMB) leads, **only 7.36% (368 leads) activate**. The remaining 4,632 leads drop out across four quantifiable commercial leaks:

```
  5,000 Inbound Inquiries
     │
     ├── [Leak #1: Pre-Assessment Drop] ──── 3,026 leads lost (65.3% of drops)
     ▼
  1,974 Needs Assessed
     │
     ├── [Leak #2: Quote Stage Drop-Out] ─── 1,113 leads lost (24.0% of drops)
     ▼
    861 Quotes Accepted
     │
     ├── [Leak #3: Paperwork / KYC Drag] ───   273 leads lost (5.9% of drops)
     ▼
    588 KYC Completed
     │
     ├── [Leak #4: Installation Delay] ─────   220 leads lost (4.8% of drops)
     ▼
    368 Activated Customers (7.36% Baseline Conversion)
```

### The Four Funnel Leaks & Engineering Solutions
1. **Leak #1 (3,026 leads lost before needs assessment):** SMB owners lack time for scheduled field-sales appointments. **Udyam One solves this** with an instant **24/7 Conversational AI Advisor** in conversational Hindi and English that extracts business requirements (employees, premises, cloud needs, budget) in under 6 conversational turns.
2. **Leak #2 (1,113 leads lost at quote stage):** Complex telecom jargon and hidden charges cause customer drop-off. **Udyam One solves this** with a **Single Transparent Monthly Quote** featuring instant add-on toggles, visual budget awareness indicators, and interactive **Business Preview Scenarios** (e.g. branch office expansion, festival sales surge, fibre link failover).
3. **Leak #3 (273 leads lost to paperwork):** Vague compliance requirements and physical document collection cause friction and abandonment. **Udyam One solves this** with **Smart Paperless KYC** executing 19 canonical statutory checks (C01–C19), MOD-36 checksum calculation, Laplacian blur detection, and AES-256-GCM encrypted storage under strict DPDP Act 2023 compliance.
4. **Leak #4 (220 leads lost post-KYC to install delays):** Customers lack visibility into physical trenching and optical line provisioning. **Udyam One solves this** with an **Auditable Order Delivery Tracker** featuring a 5-stage sequential optical stepper, interactive 2-hour technician slot selection, and real-time optical power calibration (-19.4 dBm).
5. **Revenue Recovery via Machine Learning:** Field sales teams previously chased unranked leads. **Udyam One solves this** with an executive **Back-Office Command Center** ranking unclosed leads via an **L2-regularized Logistic Regression Propensity Model (ROC AUC: 0.688)** trained strictly on pre-assessment features to prevent data leakage. Recovering just 382 incremental leads unlocks **₹15.2M in annualized recurring revenue (ARR)**.

---

## 2. Core Architecture Rules & Non-Negotiables

1. **The Rules Engine owns Facts; the LLM owns Language:** The language model never calculates prices, taxes, discounts, or product eligibility. Every figure is evaluated deterministically by the rules engine (`backend/src/rules/`).
2. **Adversarial Response Guard:** The LLM emits structured placeholders (`{{quote.monthlyTotal}}`). An adversarial server regex guard strictly blocks and sanitizes any raw currency amounts, percentages, or product SKU codes.
3. **Immutable Catalogue Data:** 25 enterprise telecommunication products loaded exclusively from `data/product_catalogue.csv`. Zero hardcoding.
4. **DPDP Act 2023 Statutory Compliance:** Pre-collection itemized notice (`Notice v1.0`), strict `HTTP 403 (CONSENT_REQUIRED)` upload gate, AES-256-GCM authenticated encryption at rest with unique 12-byte IVs, one-click consent withdrawal, and automated TTL erasure (30 days for rejected, 180 days for approved).
5. **Radical Honesty in KYC Dispositions:** Clean documents auto-verify; degraded, blurry, or ambiguous documents route honestly to human review. We never make deceptive "instant approval" claims.
6. **Masking & PII Protection:** GSTIN, Udyam, ID numbers, and mobile numbers are masked across all server logs, responses, and UI components.
7. **Idempotency & Concurrency Locks:** `POST /quotes/:id/accept` and `POST /orders` require an `Idempotency-Key` header with database-level uniqueness constraints and atomic price-hash locks.
8. **Honest Provisioning Claims:** All installation timelines are explicitly labeled *(Estimated)* based on catalogue install duration formulas.

---

## 3. Repository Architecture & Layout

The project follows a standard non-Docker MERN layout with independent `frontend/` and `backend/` directories:

```
udyam-one/
├── frontend/                     # React 18 + Vite 6 Single Page Application
│   ├── package.json              # Client scripts & dependencies
│   ├── vite.config.js            # Vite build config & proxy to backend:3001
│   ├── index.html                # Single page app entrypoint
│   ├── .env.example              # Template client environment variables
│   ├── public/                   # Public assets & icons
│   └── src/
│       ├── app/                  # Application router, providers, route guards
│       ├── pages/                # Route pages (Landing, Login, Advisor, Quote, KYC, Order, Backoffice, Partner)
│       ├── components/           # Reusable UI system (Navbar, Footer, Modal, Button, Alert)
│       ├── features/             # Business domain components (advisor, quotes, kyc, tracker, backoffice)
│       ├── api/                  # Axios HTTP client, interceptors, and query hooks
│       ├── store/                # Zustand client UI state stores
│       ├── i18n/                 # Localization configuration (English & Hindi)
│       └── utils/                # Formatting, masking, and validation utilities
├── backend/                      # Node.js + Express + Mongoose REST API Server
│   ├── package.json              # Server scripts, dependencies, Jest configs
│   ├── server.js                 # Server entrypoint: `npx nodemon server`
│   ├── .env.example              # Template server environment variables
│   ├── src/
│   │   ├── app.js                # Express app configuration & middleware pipeline
│   │   ├── index.js              # Server lifecycle & database connection
│   │   ├── config/               # Database, auth, and environment configuration
│   │   ├── routes/               # Express REST routers (auth, advisor, quotes, kyc, orders, leads, backoffice)
│   │   ├── controllers/          # HTTP request handlers & response orchestration
│   │   ├── middleware/           # Auth guards, role checks, DPDP consent gate, error handler
│   │   ├── models/               # Mongoose database schemas & indexes
│   │   ├── services/             # Core business logic (quoteService, orderService, leadService)
│   │   ├── rules/                # Pure deterministic rules engine (pricing, bundling, eligibility)
│   │   ├── advisor/              # Intent classification, slot extraction, dialogue management
│   │   ├── llm/                  # Mock LLM provider & adversarial regex guard
│   │   ├── kyc/                  # 19 statutory verification checks (C01–C19) & OCR pipeline
│   │   ├── scoring/              # L2-regularized propensity scoring model
│   │   └── utils/                # Crypto (AES-256-GCM), MOD-36 checksum, logger
│   ├── seed/                     # Seed scripts for 25 SKUs, 5,000 leads, synthetic registries
│   └── tests/                    # 15 Jest unit and integration test suites (177 tests)
├── data/                         # Read-only source datasets (CSVs and challenge specimens K01–K12)
├── scripts/                      # Verification, concurrency, and validation test runners
├── e2e/                          # Playwright end-to-end browser journey test suites
├── docs/                         # Comprehensive project, architectural, and statutory documentation
├── .gitignore                    # Clean git ignores for node_modules, build outputs, and .env files
└── README.md                     # Master project documentation
```

---

## 4. Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend Client** | React 18, Vite 6, Tailwind CSS 3, TanStack Query v5, Zustand v5, React Router v6, react-i18next (English & Hindi), Lucide Icons, Recharts |
| **Backend API** | Node.js >= 20 LTS (ES Modules), Express 4, Zod 3, Mongoose 8, Helmet 8, CORS, Cookie-Parser, Pino structured logging |
| **Database** | Native MongoDB 7/8 Community Edition or MongoDB Atlas (zero Docker containers) |
| **Computer Vision & OCR** | Tesseract.js 5 (`eng+hin`), Sharp 0.33 (Laplacian variance kernel for blur detection) |
| **Cryptography** | Node.js `crypto` AES-256-GCM authenticated encryption with 12-byte IVs and 16-byte auth tags |
| **Machine Learning** | L2-regularized Logistic Regression Propensity Classifier (ROC AUC: 0.6879) |
| **Testing & Quality** | Jest 29, Supertest 7, Fast-check property testing, Playwright Chromium (headless & headed) |

---

## 5. Run Udyam One Without Docker (Quickstart Guide)

> [!NOTE]
> Zero Docker containers required. Run natively with standard Node.js and MongoDB.

### Step 1: Prerequisites
1. **Node.js:** Ensure Node.js 20 LTS or higher is installed:
   ```bash
   node -v   # Should output v20.x or higher
   ```
2. **MongoDB (Native or Atlas):**
   - **macOS (Homebrew):**
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community
     brew services start mongodb/brew/mongodb-community
     ```
   - **Linux (Ubuntu / Debian systemd):**
     ```bash
     sudo systemctl start mongod
     sudo systemctl status mongod
     ```
   - **MongoDB Atlas (Cloud):** Set `MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/udyam_one` in `backend/.env`.

---

### Step 2: Launch Backend API Server (Terminal A)

```bash
cd udyam-one/backend

# 1. Install dependencies (first time only)
npm install

# 2. Configure environment (first time only)
cp .env.example .env

# 3. Seed synthetic database (25 SKUs, 5,000 leads, registries)
npm run seed

# 4. Start backend server with live reload
npx nodemon server
```
- **Backend API Base:** `http://localhost:3001/api/v1`
- **Liveness Probe:** `http://localhost:3001/healthz`
- **Readiness Probe:** `http://localhost:3001/readyz`

---

### Step 3: Launch Frontend Client (Terminal B)

In a separate terminal:
```bash
cd udyam-one/frontend

# 1. Install dependencies (first time only)
npm install

# 2. Configure environment (first time only)
cp .env.example .env

# 3. Launch Vite development server
npm run dev
```
- **Web Application:** `http://localhost:5173`
- The Vite development proxy forwards all `/api` traffic directly to `http://127.0.0.1:3001` with cookies and headers preserved.

---

## 6. Demo Role Credentials & Login Matrix

| Role | Portal / Route | Login Method | Identifier | Password / OTP | Default View |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SMB Business Owner** | `/login` | Mobile OTP | `9876543210` | Dev outbox code `123456` | Advisor & Quotes (`/advisor`) |
| **Airtel Staff Advisor** | `/login` (Staff Tab) | Email + Password | `advisor@airtel.com` | `AirtelStaff@2026` | Funnel & Lead Recovery (`/backoffice`) |
| **System Administrator** | `/login` (Staff Tab) | Email + Password | `admin@airtel.com` | `AirtelStaff@2026` | Full Backoffice & Audit (`/backoffice`) |
| **Field Partner Engineer** | `/login` (Staff Tab) | Staff Auth | `partner@airtel.com` | `AirtelStaff@2026` | Field Provisioning Desk (`/partner`) |

---

## 7. Smart KYC Engine: 19 Statutory Checks (C01–C19)

Udyam One implements a statutory verification pipeline evaluating 19 canonical checks without deceptive claims:

| Check ID | Verification Description | Statutory Target & Mechanism | Verdict Impact |
| :--- | :--- | :--- | :--- |
| **C01** | Document Type Identification | Evaluates whether uploaded file matches claimed category | Hard Blocker if mismatched |
| **C02** | GSTIN Format Validation | Evaluates 15-character alphanumeric regex structure | Hard Blocker on syntax error |
| **C03** | GSTIN MOD-36 Checksum | Validates ISO/IEC 7064 Mod 37,36 Luhn-variant checksum | Hard Blocker on checksum mismatch |
| **C04** | GSTIN Registry Existence | Validates presence in 3,534 synthetic tax registry entries | Hard Blocker if not found |
| **C05** | GSTIN Active Status | Rejects cancelled, suspended, or inactive registrations | Hard Blocker if non-active |
| **C06** | Legal Name Consistency | Fuzzy Jaro-Winkler string match between GSTIN and application | Warning / Route to Human Review |
| **C07** | Trade Name Consistency | Matches operating business name across registered records | Warning / Route to Human Review |
| **C08** | PAN Extraction & Verification | Extracted 10-character PAN matches positions 3–12 of GSTIN | Hard Blocker on structural mismatch |
| **C09** | PAN Status Active | Confirms tax registry PAN status is valid and active | Hard Blocker if invalid |
| **C10** | Constitution of Business | Verifies entity type (Proprietorship, Pvt Ltd, Partnership) | Routing gate for signatory check |
| **C11** | Address Proof Document Type | Verifies electricity bill, lease deed, or bank statement | Hard Blocker if unacceptable type |
| **C12** | Address Proof Recency | Validates document date is within 90 days of baseline | Warning / Route to Human Review |
| **C13** | Address Consistency | Matches installation premise with registered principal place | Warning / Route to Human Review |
| **C14** | Signatory ID Validation | Verifies Aadhaar (last 4 digits) or Passport/Voter ID | Hard Blocker if missing |
| **C15** | Signatory Name Match | Verifies authorized director / proprietor identity | Warning / Route to Human Review |
| **C16** | OCR Extraction Confidence | Assesses word-level confidence from Tesseract.js engine | Flags low-confidence extractions |
| **C17** | Document Blur & Quality | Sharp Laplacian variance kernel (threshold: variance $\ge$ 100) | Flags illegible/blurry captures |
| **C18** | Document Tampering Check | Analyzes EXIF metadata, compression anomalies, and dimensions | Flags suspicious modifications |
| **C19** | Sanctions & AML Screening | Deterministic PEP & sanctions list matching | Hard Blocker if flagged |

### Challenge Benchmark Applicants (K01–K12)
The KYC pipeline is evaluated against a benchmark dataset of 12 real-world challenge applicants:
- **K01 (Cancelled GSTIN):** Fails **C05** (Registry status cancelled) $\to$ Hard blocker, verdict `REJECTED`.
- **K02 (Mismatched PAN):** Fails **C08** (PAN does not match characters 3–12 of GSTIN) $\to$ Hard blocker, verdict `REJECTED`.
- **K03 (Stale Utility Bill):** Fails **C12** (Document older than 90 days) $\to$ Routed to `HUMAN_REVIEW`.
- **K04 (Blurry Capture):** Fails **C17** (Laplacian variance $<$ 100) $\to$ Routed to `HUMAN_REVIEW`.
- **K05–K12:** Test name mismatches, missing signatory ID, invalid entity types, and pristine clean documents auto-approving with `PASSED`.

---

## 8. Concurrency, Race Conditions & Data Integrity

The system guarantees consistency without requiring MongoDB replica-set transactions through atomic document operations and uniqueness indexes:

1. **Atomic Quote Acceptance & Price Hash Locks:**
   - Every calculated quote contains an immutable SHA-256 `priceHash` derived from active product SKUs and quantities.
   - When an applicant accepts a quote (`POST /quotes/:id/accept`), the backend recomputes the price from the catalogue and executes an atomic `findOneAndUpdate` matching `_id` and current `priceHash`.
   - If parallel acceptance calls occur or catalogue prices shift, only one update succeeds, preventing quote price drift.

2. **Idempotent Order Creation with Unique Keys:**
   - Every order creation request requires an `Idempotency-Key` HTTP header.
   - The `orders` MongoDB collection enforces a unique compound index on `{ userId: 1, idempotencyKey: 1 }`.
   - Concurrent duplicate submissions are caught via MongoDB duplicate key error code `11000` and safely return the existing order document without creating duplicate records or throwing 500 errors.

3. **Isolated Guest Advisor Sessions:**
   - Unauthenticated visitors receive a secure, isolated `guestSessionId` stored in local state and validated against server-side session stores.
   - Upon sign-in, the guest conversation and associated draft quotes are atomically transferred to the authenticated user ID (`POST /advisor/session/transfer`), preserving conversational context without cross-session contamination.

---

## 9. Automated Testing & Verification Commands

All test suites execute natively without third-party network dependencies:

```bash
# 1. Run 15 Jest backend unit & integration suites (177 tests)
cd udyam-one/backend && npm test

# 2. Verify all 40 database seed integrity assertions
cd udyam-one/backend && npm run seed:verify

# 3. Verify statutory business claims & ARR mathematical proof (15 assertions)
cd udyam-one/backend && npm run test:business

# 4. Run high-concurrency & race-condition test suite (10 quote accepts, 10 orders, 5 parallel orders)
cd udyam-one && node scripts/test-concurrency.js

# 5. Run full multi-role end-to-end customer, advisor, and partner journey
cd udyam-one && node scripts/verify-full-journeys.js

# 6. Run Playwright real-browser E2E journeys (Chromium headless)
cd udyam-one && npx playwright test

# 7. Check production frontend build
cd udyam-one/frontend && npm run build
```

---

## 10. Environment Variables Contract

### `backend/.env`
| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development`, `test`, `production`) |
| `PORT` | `3001` | Express HTTP listen port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/udyam_one` | Standalone native MongoDB or Atlas connection URI |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `JWT_ACCESS_SECRET` | 32+ character random secret | Signs short-lived access JWT tokens |
| `JWT_REFRESH_SECRET` | 32+ character random secret | Signs long-lived refresh JWT tokens |
| `OTP_MODE` | `simulated` | Logs OTPs to in-memory `/api/v1/dev/outbox` |
| `LLM_PROVIDER` | `mock` | `mock` (deterministic dialogue rules) or `anthropic` |
| `FILE_ENC_KEY` | Base64-encoded 32-byte key | AES-256-GCM symmetric key for document encryption |
| `KYC_REFERENCE_DATE` | `2026-07-15` | Baseline date for address proof 90-day recency check |

### `frontend/.env`
| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api/v1` | Same-origin API prefix routed through the Vite proxy |

---

## 11. Real vs. Simulated Boundaries Matrix

In accordance with strict hackathon transparency rules, all prototype integrations that cannot connect to live telecom production infrastructure are clearly identified:

| Subsystem | Operational Reality | Prototype Simulation Implementation | UI & Code Labeling |
| :--- | :--- | :--- | :--- |
| **Product Catalogue** | Real (synthetic data) | 25 SKUs loaded from `product_catalogue.csv` | Labeled "Catalogue SKUs" |
| **Rules & Pricing Engine** | Real | Pure deterministic pricing, bundling, and tax math | Server-side source of truth |
| **Adversarial Response Guard** | Real | Regex firewall blocking currency, SKUs, percentages | "Response Guard Active" |
| **Government Registries** | Simulated | 3,534 GSTINs and 2,723 Udyams seeded into MongoDB | "Simulated Registry Lookup" |
| **OCR & Image Quality** | Real | Sharp Laplacian variance + Tesseract.js | "OCR & Blur Quality Analysis" |
| **KYC Canonical Checks** | Real | 19 statutory checks (C01–C19) | "19 Regulated Verification Checks" |
| **SMS / Mobile OTP** | Simulated | In-memory dev outbox (`/api/v1/dev/outbox`) | "Simulated OTP (Dev Outbox)" |
| **Payment Gateway** | Simulated | Realistic checkout with Drop Reason #28 simulator | "Simulated Commercial E-Sign" |
| **Optical Provisioning** | Simulated | 5-stage sequential optical stepper | "Calibrated Optical Signal (-19.4 dBm)" |
| **ML Propensity Prioritization**| Real (model) | L2-regularized Logistic Regression (AUC: 0.688) | "ML Propensity Score" |

---

## 12. Comprehensive Documentation Index

### Release, Audit & Verification Reports
- [Master Live Demonstration Runbook](docs/DEMO_GUIDE.md) — Timed 5–7 minute jury walkthrough with 4 customer segment profiles.
- [System Integrations Matrix](docs/INTEGRATIONS.md) — Authoritative classification of fully implemented vs. simulated components.
- [Architectural Limitations & Boundaries](docs/LIMITATIONS.md) — Honest disclosure of technical assumptions and production migration roadmap.
- [Run Without Docker: Local Setup Guide](docs/LOCAL_SETUP.md) — Comprehensive native macOS, Linux, and Atlas setup instructions.
- [Non-Docker MERN Migration Audit](docs/MIGRATION_AUDIT.md) — Structural diff, removed containers, and entrypoint mapping.
- [UI Defect Fix Audit](docs/UI_FIX_AUDIT.md) — Root cause analysis and verified fixes for all 6 UI regressions.
- [180-Second Live Jury Demo Script](docs/JURY_DEMO.md) — Click-by-click timed walkthrough covering the 4 funnel leaks.
- [Final Release Readiness Scorecard](docs/FINAL_RELEASE_REPORT.md) — 13-gate production readiness scorecard.
- [Comprehensive Measured Test Report](docs/TEST_REPORT.md) — Complete stdout output from all 15 Jest suites and 6 E2E journeys.
- [Real vs. Simulated Components Matrix](docs/REAL_VS_SIMULATED.md) — Detailed simulation boundary registry.
- [Seven-Slide Pitch Deck Traceability](docs/DECK_TO_APP_TRACEABILITY.md) — Line-by-line mapping from slide claims to codebase artifacts.
- [Architecture Decision Log (ADR)](docs/DECISION_LOG.md) — Formal records of key architectural decisions (ADR-01 to ADR-09).

### Technical & Statutory References
- [Architecture & Sequence Diagrams](docs/ARCHITECTURE.md) — Complete component topologies and interaction sequences.
- [DPDP Act 2023 Compliance & Privacy Note](docs/PRIVACY.md) — Statutory alignment with Indian data protection laws.
- [Smart KYC Ground Truth & Benchmark](docs/kyc-results.md) — Evaluation results across challenge applicants K01–K12.
- [REST API Specification](docs/API.md) — Endpoint contracts, schemas, headers, and security scopes.
- [OpenAPI 3.0 YAML Definition](docs/openapi.yaml) — Standard machine-readable API specification.
