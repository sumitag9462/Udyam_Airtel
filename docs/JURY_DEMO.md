# Udyam One — 180-Second Live Jury Demonstration Script

**Platform:** Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)<br/>
**URL:** [http://localhost:5173](http://localhost:5173)<br/>
**Timing:** Exactly 3 minutes (≤180s)<br/>
**Execution Environment:** Native Node.js + Express + Native MongoDB (No Docker)<br/>

---

## Pre-Demo Checklist (30s before jury)
* Native MongoDB is running: `lsof -i :27017`
* Backend is running: `cd udyam-one/backend && npx nodemon server`
* Frontend is running: `cd udyam-one/frontend && npm run dev`
* Open [http://localhost:5173](http://localhost:5173) in browser

---

## 180-Second Demonstration Script

### Part 1: Leak #1 — Conversational Needs Discovery (0:00 – 0:45)
1. **Landing:** Start on `http://localhost:5173`. Point out the 4-stage funnel friction metrics from the 5,000 synthetic leads (65.2% exit before assessment). Click **Find My Plan**.
2. **Advisor Welcome:** Arrive at `/advisor`. Show guest mode with active rules engine badge.
3. **Conversational Intake:** In the input, paste the golden law office prompt (or click the quick-reply chip):
   > *"We have a law office in Delhi with 14 employees and one location. We need business internet, email and cloud backup. Our maximum budget is ₹5,000 per month."*
4. **Deterministic Evaluation:** Click **Send**.
   * Note that within 300ms, the advisor extracts business type, Delhi location, 14 staff, single location, cloud email, and 1TB backup.
   * Point out that the LLM generated words only; all numbers and eligibility were evaluated by `server/src/rules/engine.js`.
   * Click **Select Plan →** on the recommended Standard tier or click **View Plan Quotes →**.

---

### Part 2: Leak #2 — Single Transparent Quote & Continuity Preview (0:45 – 1:15)
1. **Authoritative Tiers:** On `/quotes`, show the three transparent tiers:
   * **Starter:** ₹3,248/mo (Itemized: Base ₹2,749 + requested P17 1TB Cloud Backup ₹499).
   * **Standard (Recommended):** ₹4,634/mo (Within budget badge).
   * **Resilient:** ₹5,133/mo (Highlighted with amber `+₹133/mo over budget` badge).
2. **Business Preview Scenarios:** Scroll to section 3. Click **Fibre Cut Resilience**. Show the simulation: automatic 4G backup failover (P09) triggers with zero downtime.
3. **Accept Quote:** Click **Accept Quote & Proceed**.

---

### Part 3: Leak #3 — Seamless Auth & Smart KYC (1:15 – 2:05)
1. **Instant OTP Login:**
   * Enter phone `9876543210`, click **Send OTP**.
   * Enter simulated dev code `123456`, click **Verify & Continue**.
   * Show that quote configuration and profile were preserved across authentication!
2. **DPDP Compliance Gate:**
   * On `/kyc`, show explicit Itemized Notice v1.0. Unchecked consent strictly blocks uploads (HTTP 403).
   * Check consent. Click **Verify Clean Specimen (K03)** or upload documents.
   * Smart KYC executes 19 checks (C01–C19): MOD-36 checksum, Laplacian variance image blur check (>50 variance), and active registry check.
   * Case auto-approves (`VERIFIED`). Show AES-256-GCM encrypted storage.

---

### Part 4: Leak #4 — Delivery Telemetry & Back-Office Recovery (2:05 – 3:00)
1. **Order Provisioning Tracker:** On `/tracker`, show real-time optical telemetry (-19.4 dBm calibrated signal) and 2-hour technician appointment scheduling.
2. **Executive Back-Office Dashboard:** Navigate to `/backoffice` (or sign in as `admin@airtel.com` / `DemoPassword123!`):
   * Display real seeded 5,000-lead historical funnel (7.36% activation, 3,026 pre-assessment dropouts).
   * Show unclosed leads ranked by our L2-regularized **Logistic Regression Propensity Model (AUC 0.688)** with transparent decision drivers.
3. **Closing Statement:** *"Udyam One transforms Airtel's regulated SMB acquisition from a 7.36% leak-prone funnel into a verified, transparent, DPDP-compliant automated pipeline."*
