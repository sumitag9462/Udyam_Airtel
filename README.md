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

- **Runtime:** Node.js 20 LTS, ES modules, npm workspaces (`client`, `server`)
- **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query, Zustand, React Router 6, react-i18next
- **Backend:** Express 4, Zod schema validation, Mongoose 8, Helmet, CORS, Cookie-Parser, Pino structured logging
- **Database:** MongoDB 7 single-node replica set (transactions enabled)
- **OCR & Vision:** Tesseract.js (`eng+hin`), Sharp (Laplacian variance image blur detection)
- **Cryptography:** Node.js `crypto` AES-256-GCM authenticated encryption with 12-byte random IVs and 16-byte auth tags
- **Testing:** Jest, Supertest, Fast-check property testing

---

## 4. Quickstart Guide

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose (for MongoDB replica set)

### 1. Start MongoDB Replica Set
```bash
docker compose up -d mongo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database
Seeds 25 products, 5,000 SMB leads, 3,534 GSTIN registry entries, 2,723 Udyam registry entries, and demo staff accounts:
```bash
npm run seed
```

### 4. Run Test Suites
Executes all 14 comprehensive test suites across the monorepo:
```bash
npm test
```

### 5. Launch Development Servers
```bash
npm run dev
```
- **Client:** `http://localhost:5173`
- **Server API:** `http://localhost:3001/api/v1`
- **Health Checks:** `http://localhost:3001/healthz`, `http://localhost:3001/readyz`

---

## 5. Demo Credentials

| Role | Login Method | Identifier | Password / OTP | Default Landing |
|:---|:---|:---|:---|:---|
| **SMB Business Owner** | Mobile OTP | Phone: `9876543210` | Auto-filled dev outbox code `123456` | `/advisor` |
| **Airtel Staff Advisor** | Email Login | `advisor@airtel.com` | `AirtelStaff@2026` | `/backoffice` |
| **System Administrator** | Email Login | `admin@airtel.com` | `AirtelStaff@2026` | `/backoffice` |

---

## 6. Project Documentation Index

### Release & Audit Deliverables (Section 55):
- [Final Release Report & Readiness Scorecard](docs/FINAL_RELEASE_REPORT.md)
- [Baseline Audit & Defect Verification](docs/BASELINE_AUDIT.md)
- [Release Route Matrix (49 Routes Audited)](docs/RELEASE_ROUTE_MATRIX.md)
- [Release API Matrix (REST Endpoints & Security)](docs/RELEASE_API_MATRIX.md)
- [Comprehensive Test Report](docs/TEST_REPORT.md)
- [Legal & DPDP Claims Audit](docs/LEGAL_CLAIMS_AUDIT.md)
- [Business Case, Cohort Economics & ARR Proof](docs/business-case-support.md)
- [Seven-Slide Pitch Deck Traceability](docs/DECK_TO_APP_TRACEABILITY.md)
- [Architecture Decision Log (ADR)](docs/DECISION_LOG.md)
- [3-Minute Timed Jury Demo Script (≤180s)](docs/FINAL_DEMO_SCRIPT.md)
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
