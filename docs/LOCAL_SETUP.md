# Udyam One — Local Developer Setup Guide (No Docker)

**Project:** Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)<br/>
**Standard Runtime:** Node.js >= 20.x, npm, Native MongoDB (Homebrew or Atlas)<br/>

---

## 1. Prerequisites

1. **Node.js:** Ensure Node.js 20 LTS or higher is installed (`node -v`).
2. **MongoDB (Native or Atlas):**
   * **macOS (Homebrew):**
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community
     mongod --config /opt/homebrew/etc/mongod.conf
     ```
   * **Ubuntu / Linux:**
     ```bash
     sudo systemctl start mongod
     ```
   * **MongoDB Atlas (Cloud):**
     Obtain connection string: `mongodb+srv://<user>:<password>@<cluster>/udyam_one?retryWrites=true&w=majority`

---

## 2. Daily Two-Terminal Execution

### Terminal 1: Backend API Server
```bash
cd udyam-one/backend

# Install dependencies (first time only)
npm install

# Configure environment (first time only)
cp .env.example .env

# Seed database with products, registries, and leads (first time only)
npm run seed

# Start server with live reloading
npx nodemon server
```
* Backend runs on **`http://localhost:3001`**.
* Health check: `http://localhost:3001/healthz`
* Readiness check: `http://localhost:3001/readyz`

### Terminal 2: Frontend Client
```bash
cd udyam-one/frontend

# Install dependencies (first time only)
npm install

# Configure environment (first time only)
cp .env.example .env

# Launch Vite development server
npm run dev
```
* Frontend runs on **`http://localhost:5173`**.
* Proxy automatically forwards `/api` requests to `http://127.0.0.1:3001/api`.

---

## 3. Environment Variables Reference

### `backend/.env`
| Key | Default / Sample | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime mode (`development`, `test`, `production`) |
| `PORT` | `3001` | Express HTTP listen port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/udyam_one` | Connection string for MongoDB |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `JWT_ACCESS_SECRET` | 32+ char secret | Signs short-lived access tokens |
| `JWT_REFRESH_SECRET` | 32+ char secret | Signs refresh tokens |
| `OTP_MODE` | `simulated` | Logs OTP to `/api/v1/dev/outbox` (code defaults to `123456`) |
| `LLM_PROVIDER` | `mock` | `mock` (deterministic offline rules) or `anthropic` |
| `FILE_ENC_KEY` | Base64 32-byte key | AES-256-GCM encryption key for documents at rest |
| `KYC_REFERENCE_DATE` | `2026-07-15` | Reference date for recency calculations |

### `frontend/.env`
| Key | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api/v1` | Same-origin API prefix routed via Vite proxy |

---

## 4. Troubleshooting & FAQ

1. **Vite shows HTML instead of API JSON:**
   * Ensure `backend/server.js` is running on port 3001.
   * Check `curl http://localhost:3001/healthz` directly in terminal.
2. **MongoDB connection refused (`ECONNREFUSED 127.0.0.1:27017`):**
   * Verify native mongod is active: `lsof -i :27017`.
   * Start MongoDB with `mongod --config /opt/homebrew/etc/mongod.conf`.
3. **CORS error when accessing from mobile on local Wi-Fi:**
   * Vite binds to `0.0.0.0:5173`. Open `http://<your-laptop-lan-ip>:5173` on your mobile.
   * Requests route through same-origin `/api` proxy directly to backend without CORS preflight blocks.
