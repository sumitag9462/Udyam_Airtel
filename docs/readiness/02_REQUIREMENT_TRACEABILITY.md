# 02 — Official Case-Study Requirement Traceability & Truth Table
**Airtel SYNC 2026 · Enterprise Track A (Project Udyam Digital)**  
**Document ID:** `docs/readiness/02_REQUIREMENT_TRACEABILITY.md`  
**Primary Requirement Authority:** `docs/Airtel_SYNC_Case.pdf` (Oct 2026, Pages 1–6)  
**Date:** November 7, 2026  
**Repository Path:** `/Users/sumitagrawal/Desktop/AIRTEL HACKATHON/udyam-one`  

---

## 1. Official Problem Statement Extraction (from Case PDF)

### The Core Problem (Page 3)
> *"Design and build a digital-first acquisition and onboarding journey that lets a small business owner discover the right bundle, buy it and get it activated with minimal human effort — on a phone, in their preferred language."*

### Key Questions & Evaluation Dimensions (Page 3)
1. **Target Segments (Page 3, 6):** Prioritize MSME segments (Micro retail & services, Professional offices, Small multi-site, Small manufacturers) with appropriate bundles and contract lengths.
2. **Needs Discovery Without Salesperson (Page 3):** Conversational advisor (chat/voice, Hindi & regional languages) asking simple questions and recommending bundles with clear monthly pricing.
3. **Near-Instant Regulated KYC (Page 3):** GSTIN/Udyam lookup, document OCR, DigiLocker, e-sign compliant with DPDP Act 2023 (consent, purpose limitation, data minimisation).
4. **Partner & Field Role (Page 3):** Complement existing sales force and local channel partners rather than competing.
5. **Success Metrics (Page 3, 5):** 3–5 core metrics: lead-to-activation conversion (baseline 7.36%), time to activate (baseline 17.6 days), blended acquisition cost (baseline ₹15,000), 6-month churn (baseline 15.22%).

---

## 2. Mandatory Prototype Pillars Traceability Matrix

| Official Requirement | PDF Source | Pitch Deck Promise | Code Implementation Path | Backend & DB Evidence | Live vs. Simulated | Unmet Condition / Gap | Demo Safe? |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| **M1: GenAI Business Advisor** | Page 3 (Build Challenge) | Empathetic bilingual needs discovery in $\le 6$ simple questions | `AdvisorChat.jsx`, `MockProvider.js`, `guard.js` | `POST /advisor/chat`, `Conversation` model in MongoDB | Hybrid (Rules + LLM) | External live Claude API optional; offline mock active | **YES** |
| **M2: Quote and Checkout** | Page 3 (Build Challenge) | Single transparent monthly price with toggleable add-ons | `QuotePage.jsx`, `quoteService.js`, `scenarios.js` | `POST /quotes`, `Quote` model with SHA-256 `priceHash` | Fully Functional | None (Exact catalog math from 25 SKUs) | **YES** |
| **M3: Smart KYC** | Page 3 (Build Challenge) | Document upload, OCR extraction, GSTIN/Udyam lookup, DPDP consent | `KycUploader.jsx`, `pipeline.js`, `storage.js` | `POST /kyc/upload`, `KycCase`, AES-256-GCM vault | Fully Functional | Uses mock GSTIN/Udyam registries (3,534 & 2,723 rows) | **YES** |
| **M4: Order Tracker** | Page 3 (Build Challenge) | Self-serve order status stepper replacing support calls | `TrackerPage.jsx`, `orderService.js` | `GET /orders/:id`, `Order` model in MongoDB | Fully Functional | Optical power dBm is simulated within telco range | **YES** |

---

## 3. Stretch Goals Traceability Matrix

| Stretch Goal | PDF Source | Pitch Deck Promise | Code Implementation Path | Backend & DB Evidence | Live vs. Simulated | Unmet Condition / Gap | Demo Safe? |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| **S1: Voice or WhatsApp** | Page 3 (Stretch Goals) | Conversational voice discovery & WhatsApp notifications | `dev.js`, `Notification` model | Simulated notification outbox records in DB | Simulated | External WhatsApp/Twilio gateway stubbed | **YES (Disclosed)** |
| **S2: Back-Office Lead Recovery** | Page 3 (Stretch Goals) | Sales view showing unclosed leads and dropped steps | `backofficeController.js`, `FunnelTab.jsx` | `GET /backoffice/funnel`, `GET /backoffice/unclosed-leads` | Fully Functional | None (5,000 baseline leads fully loaded) | **YES** |
| **S3: Propensity Scoring** | Page 3 (Stretch Goals) | Simple propensity score for which leads to prioritize | `scoring/engine.js`, `propensity_model.json` | `POST /scoring/predict`, ROC AUC = 0.6879 | Fully Functional | Offline trained logistic regression model | **YES** |

---

## 4. Integration Truth Table & System Classification

| Subsystem / Provider | Category | Code Path | DB Persistence | Implementation Mode | Judge-Facing Explanation |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **Conversational NLU Engine** | Core | `backend/src/advisor/` | `Conversation` | Hybrid Rules + LLM | Dialogue managed by NLU state machine; pricing guarded by rules engine |
| **Product Catalogue & Pricing**| Core | `backend/src/rules/` | `Product` | Fully Functional | 25 SKUs loaded from `product_catalogue.csv`; 100% deterministic arithmetic |
| **Quote Immutability Vault** | Core | `quoteService.js` | `Quote` | Fully Functional | Cryptographic SHA-256 price lock generated on quote acceptance |
| **19 Canonical KYC Checks** | Core | `backend/src/kyc/` | `KycCase` | Fully Functional | Evaluates 19 canonical checks against mock registries and specimens |
| **AES-256-GCM Document Vault**| Security | `storage.js` | `Document` | Fully Functional | All uploads encrypted on disk using AES-256-GCM with unique IVs |
| **DPDP Compliance Suite** | Privacy | `meController.js` | `Consent` | Fully Functional | Enforces Section 6 consent, Section 11 portability export, Section 12 erasure |
| **Delivery Milestone Tracker** | Core | `orderService.js` | `Order` | Fully Functional | 5-stage optical provisioning stepper with 2-hour technician slot selection |
| **Optical Signal Telemetry** | Core | `orderService.js` | `Order` | Simulated | Telemetry simulated within authentic physical thresholds (-19 to -23 dBm) |
| **SMS / WhatsApp OTP** | Stretch | `routes/dev.js` | `Notification` | Simulated | Dispatched to notifications outbox; production-ready SMS adapter stub |
| **Recurring Payment Mandate** | Core | `orderService.js` | `Order` | Simulated | Instant sandbox simulation of recurring AutoPay mandate |
| **Aadhaar / DigiLocker XML** | Roadmap | `kyc/pipeline.js` | N/A | Future Roadmap | Production gateway adapter prepared for live telco rollout |
| **Airtel Amdocs BSS Connector**| Roadmap | `orderService.js` | N/A | Future Roadmap | TM Forum TMF622 compliant asynchronous event payload prepared |

---

## 5. Deck-to-Code Traceability & Alignment Check

| Slide # | Slide Title | Case Study Grounding | Application Route | Backend Service | Alignment Verdict |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | Executive Challenge: 7.36% Baseline | Page 2, 5 (5,000 leads, ₹15,053 CAC) | `/backoffice` | `backofficeController.js` | **ALIGNED** |
| **2** | The Four Structural Funnel Leaks | Page 5 (Pre-assessment, quote, KYC, delay) | `/backoffice` (Funnel) | `GET /backoffice/funnel` | **ALIGNED** |
| **3** | Rules / LLM Architecture Firewall | Page 3 (GenAI advisor without hallucination)| `/advisor` | `guard.js`, `engine.js` | **ALIGNED** |
| **4** | Vernacular Needs Discovery & Quotes | Page 3 (Conversational advisor in Hindi) | `/advisor`, `/quotes` | `advisorController.js` | **ALIGNED** |
| **5** | Smart KYC & DPDP Act 2023 Compliance| Page 3 (Near-instant KYC, DPDP consent) | `/kyc` | `pipeline.js`, `storage.js` | **ALIGNED** |
| **6** | Optical Telemetry & Delivery Tracker | Page 3 (Order status view, install delay) | `/tracker` | `orderService.js` | **ALIGNED** |
| **7** | Commercial ROI & ₹15.2M ARR Uplift | Page 3, 5 (Success metrics, conversion) | `/backoffice` | `scripts/check-business-claims.js` | **ALIGNED** |
