# Deployment, Clean-Clone & Operations Guide

> [!NOTE]
> **Project Udyam Digital · Udyam One (Airtel SYNC 2026 Track A)**  
> Instructions for local development, automated testing, database seeding, Docker container deployment, and health monitoring.

---

## 1. System Architecture & Prerequisites

### Architecture Overview
- **Client (Frontend):** React 18, Vite, Tailwind CSS, TanStack Query, React Router v6, i18next (English & Hindi). Port: `5173` (Dev/Docker) / `4173` (Playwright preview).
- **Server (Backend):** Node.js ES Modules, Express, Mongoose, Zod validation, Pino logging, Sharp blur detection, Tesseract OCR. Port: `3001`.
- **Database:** MongoDB 7.0 Community Edition configured with Single-Node Replica Set (`rs0`) for transaction support. Port: `27017`.

### Prerequisites
- **Node.js:** `>= 20.0.0` (Tested on Node `v26.5.0` on macOS arm64).
- **npm:** `>= 10.0.0` (Workspaces enabled).
- **Docker & Docker Compose:** Docker Desktop 27.x or Docker Engine.

---

## 2. Quick Start: Local Development (Bare Metal)

### Step 1: Clone & Install Dependencies
```bash
cd udyam-one
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment configuration variables:
```ini
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/udyam_one?replicaSet=rs0
JWT_SECRET=super_secret_jwt_signing_key_for_udyam_one_prototype_auth_token_at_least_32_chars
FILE_ENC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
KYC_REFERENCE_DATE=2026-07-15
LLM_PROVIDER=mock
```

### Step 3: Start MongoDB Replica Set
If running MongoDB locally or via Docker:
```bash
docker compose up -d mongo
# Wait 3 seconds for replica set initialization (rs0)
```

### Step 4: Seed Synthetic Data & Verify
```bash
# Seed 25 products, 5,000 leads, 3,534 GSTINs, 2,723 Udyam rows
npm run seed

# Verify all 40 integrity assertions
npm run seed:verify
```

### Step 5: Launch Development Servers
```bash
# Starts both frontend (vite) and backend (nodemon) concurrently
npm run dev
```
- Open `http://localhost:5173` in your browser.
- Backend API accessible at `http://localhost:3001/api/v1`.

---

## 3. Running Automated Test Suites

All tests run locally without third-party network dependencies:

```bash
# 1. Run all Jest unit & integration test suites (177 tests)
npm test

# 2. Run all 25 scripted Advisor dialogue & adversarial response guard tests
npm run test:advisor

# 3. Run statutory mathematical business claims & cohort economics verification (15 assertions)
npm run test:business

# 4. Run Playwright real-browser end-to-end journeys (headless Chromium)
npm run test:e2e

# 5. Check monorepo ESLint (0 errors, 0 warnings)
npm run lint

# 6. Verify client production build
npm run build
```

---

## 4. Production & Demo Deployment via Docker Compose

To run the complete isolated containerized stack:

```bash
# Build and start all 3 services in detached mode
docker compose up --build -d

# Check container status and health checks
docker ps
```

### Expected Docker Services:
1. `udyam-one-mongo-1`: MongoDB 7.0 (`healthy`) on port `27017`
2. `udyam-one-server-1`: Express Backend (`healthy`) on port `3001`
3. `udyam-one-client-1`: Vite / Static Frontend on port `5173`

To inspect container logs:
```bash
docker compose logs -f server
docker compose logs -f client
```

To stop and remove containers:
```bash
docker compose down -v
```

---

## 5. Health Checks & Monitoring Endpoints

- **Liveness Probe:** `GET http://localhost:3001/healthz`  
  Returns `{ ok: true, status: "live", uptime: <seconds> }`
- **Readiness Probe:** `GET http://localhost:3001/readyz`  
  Returns `{ ok: true, status: "ready", database: "connected", replicaSet: "rs0" }`
- **Seed Verification:** `GET http://localhost:3001/api/v1/catalogue`  
  Returns `{ ok: true, data: { products: [...] } }` (25 SKUs)

---

## 6. Demo Role Logins & Quick Access

- **Owner Portal:** `http://localhost:5173/login` (Phone: `9876543210`, OTP: `123456`)
- **Advisor / Admin Command Center:** `http://localhost:5173/login` (Switch to Staff tab: `advisor@airtel.com` / `Advisor@123`)
- **Partner Field Engineering Desk:** `http://localhost:5173/partner`
- **Privacy & DPO Portal:** `http://localhost:5173/account/privacy` and `http://localhost:5173/grievance`
