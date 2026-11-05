# Deployment, Clean-Clone & Operations Guide

> [!NOTE]
> **Project Udyam Digital · Udyam One (Airtel SYNC 2026 Track A)**  
> Instructions for local development, automated testing, database seeding, native deployment, and health monitoring (No Docker).

---

## 1. System Architecture & Prerequisites

### Architecture Overview
- **Frontend (Client):** React 18, Vite, Tailwind CSS, TanStack Query, React Router v6, i18next (English & Hindi). Port: `5173` (Dev) / `4173` (Playwright preview).
- **Backend (Server):** Node.js ES Modules, Express, Mongoose, Zod validation, Pino logging, Sharp blur detection, Tesseract OCR. Port: `3001`.
- **Database:** MongoDB Community Edition (native service or MongoDB Atlas). Port: `27017`.

### Prerequisites
- **Node.js:** `>= 20.0.0` (Tested on Node `v26.5.0` on macOS arm64).
- **npm:** `>= 10.0.0`.
- **MongoDB:** Native service (`brew services start mongodb-community` on macOS, `systemctl start mongod` on Linux) or MongoDB Atlas connection string. Zero Docker required.

---

## 2. Quick Start: Local Development (Bare Metal)

### Step 1: Clone & Configure Backend
```bash
cd udyam-one/backend
npm install
cp .env.example .env
```

Key environment configuration variables in `backend/.env`:
```ini
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/udyam_one
JWT_ACCESS_SECRET=your_32_char_long_random_jwt_access_secret_key_here!
JWT_REFRESH_SECRET=your_32_char_long_random_jwt_refresh_secret_key_here!
FILE_ENC_KEY=9GqoIJG6szGdKWhh+/ex0hvJN34j4P455jphaJ+QkA0=
KYC_REFERENCE_DATE=2026-07-15
LLM_PROVIDER=mock
OTP_MODE=simulated
```

### Step 2: Seed Synthetic Data & Verify
```bash
# Seed 25 products, 5,000 leads, 3,534 GSTINs, 2,723 Udyam rows
npm run seed

# Verify all 40 integrity assertions
npm run seed:verify
```

### Step 3: Launch Backend Server
```bash
npx nodemon server
```
- Backend runs on `http://localhost:3001`.
- Health checks: `http://localhost:3001/healthz`, `http://localhost:3001/readyz`.

### Step 4: Configure & Launch Frontend
In a separate terminal:
```bash
cd udyam-one/frontend
npm install
cp .env.example .env
npm run dev
```
- Open `http://localhost:5173` in your browser.
- Vite dev server proxies `/api` calls directly to `http://127.0.0.1:3001`.

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

## 4. Production Process Management (Native / PM2 / systemd)

For production deployment on Linux / macOS servers without Docker:

### Option A: Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Build frontend production assets
cd udyam-one/frontend
npm run build

# Start backend cluster
cd ../backend
pm2 start server.js --name "udyam-backend" -i max

# Serve frontend via Nginx or static file server proxying /api to port 3001
```

### Option B: Systemd Service (Linux)
Create `/etc/systemd/system/udyam-backend.service`:
```ini
[Unit]
Description=Udyam One Backend API
After=network.target mongod.service

[Service]
Type=simple
User=node
WorkingDirectory=/opt/udyam-one/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now udyam-backend
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
