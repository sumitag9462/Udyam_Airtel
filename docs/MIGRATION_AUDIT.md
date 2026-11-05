# Udyam One — Non-Docker MERN Migration Audit

**Project:** Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)<br/>
**Date:** November 2026<br/>
**Status:** Completed & Verified<br/>

---

## 1. Migration Summary

The project was migrated from a Docker-dependent monorepo structure with `client/` and `server/` into a standard, normal MERN stack architecture with independent `frontend/` and `backend/` folders, running completely natively without Docker.

| Component | Legacy Layout | New Non-Docker Layout | Rationale & Validation |
| :--- | :--- | :--- | :--- |
| **Frontend** | `udyam-one/client/` | `udyam-one/frontend/` | Standard MERN structure. Starts via `npm run dev` (`vite`), binds to `0.0.0.0:5173`. |
| **Backend** | `udyam-one/server/` | `udyam-one/backend/` | Standard MERN structure. Starts via `npx nodemon server` (`server.js`), listens on `3001`. |
| **Database** | Docker Compose `mongo:7` | Native Homebrew MongoDB / MongoDB Atlas | Native service on `127.0.0.1:27017` or Atlas connection string. Transactions decoupled. |
| **Container Files** | `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `mongo-init/` | **Removed completely** | Zero Docker dependency for setup, startup, seed, or acceptance testing. |
| **Data & Specimens** | `udyam-one/data/` | `udyam-one/data/` (Preserved intact) | Read-only synthetic catalogue, 5,000 leads, registries, and 47 KYC specimens. |
| **E2E Tests** | Playwright (Docker webServer) | Native Playwright runner (`frontend` preview) | Executes all 6 journeys natively against live Express and MongoDB. |

---

## 2. Path & Import Audit

1. **Backend Server Entrypoint:**
   - Created `backend/server.js` exporting and launching the Express application.
   - `npx nodemon server` from `backend/` resolves `server.js` directly.
   - Added `nodemon` as a development dependency.

2. **Environment Contract:**
   - `backend/.env.example` and `backend/.env` configured with `MONGO_URI=mongodb://127.0.0.1:27017/udyam_one`.
   - `frontend/.env.example` and `frontend/.env` configured with `VITE_API_BASE_URL=/api/v1`.

3. **Vite Proxy & Same-Origin LAN Access:**
   - Configured `frontend/vite.config.js` with `server.host: '0.0.0.0'` and proxy forwarding `/api` to `http://127.0.0.1:3001`.
   - Updated `frontend/src/api/client.js` `getApiBase()` to use `/api/v1` through the proxy rather than hardcoding port 3001, allowing local Wi-Fi / mobile testing without CORS failures.

4. **Data Path Resolution:**
   - Updated `backend/seed/index.js` and `backend/src/kyc/storage/StorageProvider.js` with resilient path discovery checking `../data` and `./data` so scripts execute properly regardless of working directory.
   - Added `data/encrypted_uploads/` to `.gitignore` to prevent transient local test files from inflating version control.

---

## 3. Preserved Business Logic & Datasets

- **25 Enterprise Catalogue Products** seeded exclusively from `product_catalogue.csv`.
- **5,000 Historical Leads** with verbatim funnel stages, CAC, and drop reasons.
- **Mock GSTIN & Udyam Registries** (3,534 GSTINs, 2,723 Udyam numbers).
- **19 Regulated Smart KYC Checks (C01–C19)** with LAPLACIAN variance blur detection and AES-256-GCM encryption at rest.
- **L2 Logistic Regression Propensity Model** (ROC AUC 0.688) trained on synthetic lead data.
