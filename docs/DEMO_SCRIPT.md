# 3-Minute Live Demo Script: Udyam One

**Audience:** Airtel Leadership & SYNC 2026 Jury  
**Track:** Digital Track A (Project Udyam Digital)  
**Tone:** Confident, transparent, data-driven, engineering-led.

---

## Pre-Demo Quick Setup (30 Seconds Before Presentation)
1. Ensure Docker or local stack is running: MongoDB replica set, Server (`http://localhost:3001`), Client (`http://localhost:5173`).
2. Have two browser tabs open:
   - **Tab 1 (Customer Onboarding):** `http://localhost:5173/login`
   - **Tab 2 (Executive Back-Office):** `http://localhost:5173/backoffice` (Logged in as Staff / Advisor)

---

## Minute 0:00 – 0:30 | The Commercial Leak & Business Problem

> *"Good morning, leaders. In Airtel’s 5,000 historical SMB leads, only **7.36%** activate. The biggest tragedy isn't at the end — **65% of lost leads drop before a needs assessment even happens**, because business owners have zero time for field sales visits. Another 1,113 drop at quote confusion, 273 at paperwork, and 220 at installation delays.*
>
> *Today, we present **Udyam One** — an honest, mobile-first regulated onboarding engine that plugs all four leaks."*

**Action:** Show the landing page with the 4 key stages: Advisor, Transparent Quote, Smart KYC, and Order Tracker.

---

## Minute 0:30 – 1:15 | Conversational AI Advisor & Transparent Quote

> *"First, we eliminate the 65% pre-assessment drop. An SMB owner logs in via mobile OTP and chats with our AI advisor in conversational Hindi or English."*

**Action:**
1. Click **"Quick Login (Owner)"** on `/login` or enter phone number `9876543210`.
2. Go to `/advisor`. Select Hindi:
   > *"Namaste! Humare paas 12 employees hain, Delhi mein manufacturing unit hai, aur bill delay hota hai."*
3. Show the Profile Card auto-updating in real-time.
4. **Point out the Architecture:**
   > *"Notice: The LLM never calculates prices or percentages. Under our Non-negotiable Rules, the server rules engine owns facts, while the LLM emits templates with placeholders. Our adversarial response guard strictly blocks any unauthorized currency or percentages."*
5. Click **"View Generated Quote"** (`/quotes`).
6. Point to the **Single Monthly Price**, toggle an Add-on (e.g. Static IP or Secure Internet), and show the **Business Preview Scenario** ("Peak Sale Festival" / "Office Expansion") simulating financial impact before purchase.
7. Click **"Accept Quote & Lock Price"** -> Price is permanently locked via cryptographic hash and Idempotency-Key.

---

## Minute 1:15 – 2:00 | Smart KYC & Planted Defect Benchmark (K01–K12)

> *"Next, we plug the 273 paperwork drops with Smart KYC. We never claim deceptive 'Instant KYC'. Clean cases auto-verify, while uncertain ones route honestly to human review."*

**Action:**
1. Arrive on `/kyc`. Show the **DPDP Act 2023 Consent Notice**:
   > *"Rule 7: No KYC upload is allowed without active, versioned explicit consent. Uploading without consent yields an immediate HTTP 403."*
2. Check the box and click **"Grant Consent"**.
3. Use the **Benchmark Specimen Selector**:
   - **Test 1 (Clean Specimen K03):** Select `K03 (Ganesh Woodcraft)`. Click **"Verify Documents Instantly"**.
     - Watch progress: AES-256-GCM encryption -> Laplacian blur check -> OCR extraction -> 19 checks.
     - **Result:** `AUTO-APPROVED` (Green Badge). Click **"Inspect 19 Regulated Checks"** to show all C01–C19 checks passing transparently.
   - **Test 2 (Planted Defect K01):** Select `K01 (Cancelled GSTIN)`.
     - **Result:** `REJECTED` (C10 Hard Blocker: GSTIN cancelled in mock registry).
   - **Test 3 (Image Blur K04):** Select `K04 (Blurred GST cert)`.
     - **Result:** `SENT TO HUMAN REVIEW` (C05 Laplacian variance 1.25 < 50; routed to back-office).

---

## Minute 2:00 – 2:40 | Order Tracker & Provisioning Simulator

> *"Post-KYC, installation delay is the #1 drop. Udyam One eliminates the black box."*

**Action:**
1. Click **"Track Order & Installation"** (`/tracker`).
2. Show the **Estimated Activation Date** (clearly labeled *(Estimated)* per Rule 14).
3. Select an installation appointment in the **Interactive Slot Picker** (choose tomorrow morning `09:00 - 12:00`).
4. Click **"▶ Next Provisioning Stage"** on the Jury Demo Simulator:
   - Stage 1: Feasibility passed with live optical telemetry (`-18dBm`).
   - Stage 2: Technician dispatched for confirmed slot.
   - Stage 3: CPE Airtel Xstream router installed.
   - Stage 4: Service activated!
5. Point out the **"Need Special Wiring?"** button:
   > *"If an owner needs a router placed in an industrial warehouse, they raise a proactive Help Request directly in the app. Zero telephone call-center wait time."*

---

## Minute 2:40 – 3:00 | Executive Back-Office & ML Propensity Recovery

> *"Finally, what happens to the leads we didn't close? We flip to the Airtel Executive Back-Office."*

**Action:**
1. Switch to Tab 2 (`/backoffice`).
2. Point to the **Funnel & Leak Analysis**:
   > *"Here are the exact numbers from the 5,000 lead case dataset: 3,406 contacted, 1,974 assessed, 861 quoted, 588 KYC, 368 activated — 7.36% conversion."*
3. Click the **"Unclosed Leads Queue"** tab:
   > *"Every unclosed lead is ranked by our L2-regularized Logistic Regression model (ROC AUC 0.688). Advisors immediately see high-propensity leads (e.g. 24.8% probability) with transparent drivers: +Active GSTIN, +Referral source, +40 Employees. One click allows advisors to intervene and recover revenue."*
4. Conclude:
   > *"Udyam One: Deterministic rules, guarded AI, regulated DPDP compliance, and end-to-end transparent delivery. Thank you."*
