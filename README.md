# Udyam One — Regulated SMB Onboarding & Telecommunication Delivery Platform

**Airtel SYNC 2026 | Digital Track A (Project Udyam Digital)**  
Built by a Principal Full-Stack Engineer for a jury of Airtel leaders probing edge cases.

---

## 1. Executive Summary & Problem Solved

Across 5,000 historical Airtel SMB leads, **only 7.36% (368 leads) activate**:
- **Leak #1 (65.2% / 3,026 leads lost before needs assessment):** Solved by our **24/7 Conversational AI Advisor** in conversational Hindi & English conducting instant, low-friction needs discovery without scheduled visits.
- **Leak #2 (1,113 leads lost at quote stage):** Solved by a **Single Transparent Monthly Quote** with instant add-on toggles and interactive **Business Preview Scenarios** (e.g., festival sales surge, branch expansion).
- **Leak #3 (273 leads lost to paperwork):** Solved by **Smart KYC** executing 19 regulated verification checks (C01–C19) with MOD-36 checksum, Laplacian blur detection, and AES-256-GCM encrypted storage.
- **Leak #4 (220 leads lost post-KYC to install delays):** Solved by an **Auditable Order Delivery Tracker** with real-time optical telemetry, an interactive slot picker, and proactive technician routing.
- **Revenue Recovery:** An executive **Role-Gated Back-Office** ranks unclosed leads using an L2-regularized **Logistic Regression Propensity Model (ROC AUC: 0.688)** with transparent driver explanations.

---

## 2. Non-Negotiable Architecture Rules Enforced

1. **The Rules Engine owns Facts; the LLM owns Language:** The LLM never calculates a price, tax, date, or product eligibility. Every figure is evaluated deterministically by the rules engine (`server/src/rules/engine.js`).
2. **Placeholder-Only Output & Adversarial Response Guard:** The LLM outputs bracketed placeholders (`{{quote.monthlyTotal}}`). An adversarial server regex guard strictly blocks and sanitizes any raw currency amounts, percentages, or product codes.
3. **Immutable Catalogue Data:** 25 enterprise products loaded exclusively from `data/product_catalogue.csv`. Zero hardcoding.
4. **DPDP Act 2023 Compliance:** Pre-collection explicit consent notice (`Notice v1.0`), strict 403 consent gate on uploads, AES-256-GCM authenticated encryption at rest, one-click consent withdrawal, and automated TTL erasure (30 days for rejected, 180 days for approved).
5. **No Deceptive Instant-KYC Claims:** Clean cases auto-verify; uncertain ones route honestly to human review.
6. **PII Masking:** GSTIN, Udyam, ID numbers, and phone numbers are masked in all logs and UI views.
7. **Idempotency:** `POST /quotes/:id/accept` and `POST /orders` require an `Idempotency-Key` header.
8. **Never Claim Guarantees:** All installation timelines are explicitly labeled *(Estimated)*.

---

## 3. Tech Stack

- **Runtime:** Node.js >= 20 LTS, ES modules, separate `frontend/` and `backend/` packages
- **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query, Zustand, React Router 6, react-i18next
- **Backend:** Express 4, Zod schema validation, Mongoose 8, Helmet, CORS, Cookie-Parser, Pino structured logging
- **Database:** Native MongoDB (Homebrew / systemd / MongoDB Atlas) on `mongodb://127.0.0.1:27017/udyam_one`
- **OCR & Vision:** Tesseract.js (`eng+hin`), Sharp (Laplacian variance image blur detection)
- **Cryptography:** Node.js `crypto` AES-256-GCM authenticated encryption with 12-byte random IVs and 16-byte auth tags
- **Testing:** Jest, Supertest, Fast-check property testing, Playwright E2E

---

## 4. Run Udyam One Without Docker (Quickstart Guide)

> [!NOTE]
> Zero Docker containers required. Run natively with standard Node.js and MongoDB.

### Prerequisites
1. **Node.js:** `>= 20.x` (`node -v`)
2. **MongoDB (Native or Atlas):**
   - **macOS:** `brew tap mongodb/brew && brew install mongodb-community && mongod --config /opt/homebrew/etc/mongod.conf`
   - **Linux:** `sudo systemctl start mongod`
   - **Atlas (Cloud):** Set `MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/udyam_one` in `backend/.env`

---

### Terminal A: Backend API Server
```bash
cd udyam-one/backend

# 1. Install dependencies (first time only)
npm install

# 2. Configure environment (first time only)
cp .env.example .env

# 3. Seed synthetic database (25 SKUs, 5,000 leads, registries)
npm run seed

# 4. Start backend with live reloading
npx nodemon server
```
- **Backend API:** `http://localhost:3001/api/v1`
- **Liveness & Readiness:** `http://localhost:3001/healthz`, `http://localhost:3001/readyz`

---

### Terminal B: Frontend Client
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
- The Vite development proxy forwards all `/api` requests to `http://127.0.0.1:3001`.

---

### Automated Verification & Testing
```bash
# Run 15 Jest backend test suites (177 tests)
cd udyam-one/backend && npm test

# Run mathematical statutory business claims & ARR checks
cd udyam-one/backend && npm run test:business

# Run Playwright real-browser E2E journeys
cd udyam-one && npx playwright test
```

---

## 5. Demo Credentials

| Role | Login Method | Identifier | Password / OTP | Default Landing |
|:---|:---|:---|:---|:---|
| **SMB Business Owner** | Mobile OTP | Phone: `9876543210` | Auto-filled dev outbox code `123456` | `/advisor` |
| **Airtel Staff Advisor** | Email Login | `advisor@airtel.com` | `AirtelStaff@2026` | `/backoffice` |
| **System Administrator** | Email Login | `admin@airtel.com` | `AirtelStaff@2026` | `/backoffice` |

---

## 6. Project Documentation Index

### Release & Audit Deliverables:
- [Run Without Docker: Local Setup Guide](docs/LOCAL_SETUP.md)
- [Non-Docker MERN Migration Audit](docs/MIGRATION_AUDIT.md)
- [UI Defect Fix Audit](docs/UI_FIX_AUDIT.md)
- [Jury Live Demo Script (180 Seconds)](docs/JURY_DEMO.md)
- [Final Release Report & Readiness Scorecard](docs/FINAL_RELEASE_REPORT.md)
- [Baseline Audit & Defect Verification](docs/BASELINE_AUDIT.md)
- [Release Route Matrix (49 Routes Audited)](docs/RELEASE_ROUTE_MATRIX.md)
- [Release API Matrix (REST Endpoints & Security)](docs/RELEASE_API_MATRIX.md)
- [Comprehensive Test Report](docs/TEST_REPORT.md)
- [Legal & DPDP Claims Audit](docs/LEGAL_CLAIMS_AUDIT.md)
- [Business Case, Cohort Economics & ARR Proof](docs/business-case-support.md)
- [Seven-Slide Pitch Deck Traceability](docs/DECK_TO_APP_TRACEABILITY.md)
- [Architecture Decision Log (ADR)](docs/DECISION_LOG.md)
- [UX Bug Bash & Accessibility Audit](docs/UX_BUG_BASH.md)
- [Deployment & Operations Guide](DEPLOYMENT.md)

### Architectural & Technical References:
- [Architecture & Sequence Diagrams](docs/ARCHITECTURE.md)
- [DPDP Privacy & Compliance Note](docs/PRIVACY.md)
- [Smart KYC Ground Truth & Defect Catalog](docs/kyc-groundtruth.md)
- [Smart KYC Measured Performance & Benchmark](docs/kyc-results.md)
- [Real vs Simulated Components Matrix](docs/REAL_VS_SIMULATED.md)
- [Assumptions Register](docs/ASSUMPTIONS.md)
- [REST API Specification](docs/API.md)
- [OpenAPI 3.0 YAML Definition](docs/openapi.yaml)
