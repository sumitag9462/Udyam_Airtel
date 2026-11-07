# Udyam One: System Integrations Matrix
**Airtel Sync 2026 Hackathon · Problem Statement Track A: Digital Onboarding & Enterprise Connectivity**

---

## 1. Principles of Integration Honesty

In accordance with Airtel SYNC 2026 Hackathon evaluation standards, Udyam One maintains radical transparency regarding technical boundaries:
- **No Mock-Masking:** Simulated workflows are explicitly labeled in both the user interface and codebase with visual badges (e.g. `Simulated Preview`, `Simulated OTP`).
- **Production-Grade Architecture:** Components labeled as *Fully Implemented* run true production-grade logic (such as cryptographic hashing, AES-256-GCM encryption, and Zod schema validations).

---

## 2. Comprehensive Integrations Classification

| Module / Service | Category | Integration Status | Implementation Details & Boundaries |
|---|---|---|---|
| **Mobile OTP Authentication** | Identity & Access | **Simulated Integration** | Generates real 6-digit numeric codes with 60-second rate-limiting cooldowns; codes are dispatched to a simulated dev outbox collection (`Notification`) rather than an external SMS aggregator. |
| **Staff RBAC & Session Management** | Identity & Access | **Fully Implemented** | Production bcrypt password hashing (cost factor 12), dual-token JWT architecture (15-min access token in httpOnly cookie, 7-day refresh token with automatic rotation and family reuse invalidation). |
| **Enterprise Product Catalogue** | Commercial Engine | **Fully Implemented** | Seeded from `data/product_catalogue.csv` directly into MongoDB `Product` collection; 25 enterprise SKUs with eligibility rules, speed tiers, add-ons, and pricing bounds. |
| **Rules-Based Pricing & Bundling Engine** | Commercial Engine | **Fully Implemented** | Pure deterministic rules engine (`backend/src/rules/`); computes base plans, add-ons, setup fees, and generates cryptographic SHA-256 price hashes to guarantee contract immutability. |
| **AI Business Advisor** | Natural Language Processing | **Partially Implemented** | State machine, bilingual extraction, and intent classification are fully implemented. LLM runs deterministic offline rules via `MockProvider` by default; external Claude Sonnet API integration is functional via `LLM_PROVIDER=anthropic`. |
| **LLM Response Guard & Compliance Filter** | Security & Compliance | **Fully Implemented** | Adversarial regex tokenizers inspect every assistant message prior to client transmission; strictly quarantines and sanitizes raw currency amounts, unapproved SKU codes, or fabricated percentages. |
| **Business Continuity & Scenario Simulator** | Decision Support | **Fully Implemented** | Mathematical rules calculation demonstrating 20% budget cut trade-offs, fibre link cut cellular failover protection, and multi-site branch scaling (clearly labeled as a rules simulation). |
| **DPDP Act 2023 Consent Management** | Legal & Compliance | **Fully Implemented** | Itemized unbundled notices (Notice v1.0), SHA-256 hashed IP and User-Agent audit logging, instant consent withdrawal API, automated TTL retention policies, and Section 11 data portability JSON export. |
| **Document Vault & Authenticated Encryption** | Cryptography & Storage | **Fully Implemented** | Files stored locally using AES-256-GCM authenticated encryption at rest (`[12-byte IV][16-byte Auth Tag][Ciphertext]`) with unique IV generation per document. |
| **Image Quality & Blur Detection** | Signal Processing | **Fully Implemented** | Real-time Laplacian discrete convolution variance calculated via Sharp; rejects degraded or blurred document captures with variance $< 50$. |
| **Statutory Check Pipeline (C01–C19)** | Regulatory Verification | **Fully Implemented** | Evaluates 19 canonical verification checks including MOD-36 GSTIN checksum, document completeness, entity classification, address freshness, and signatory match. |
| **GSTIN & Udyam Registry Verification** | External Registry | **Simulated Integration** | Validates official format regex and MOD-36 checksums; performs status lookups against preloaded offline datasets (`mock_gstin_registry.csv`, `mock_udyam_registry.csv`) rather than direct GSTN/MCA live APIs. |
| **DigiLocker Integration** | Identity & Access | **Simulated Integration** | Demonstrates instant document retrieval workflow using pre-extracted specimen fields; labeled as a simulated integration. |
| **Order State Machine & Idempotency** | Provisioning & Fulfillment | **Fully Implemented** | Sequential state transitions (`QUOTE_ACCEPTED` $\rightarrow$ `FEASIBILITY` $\rightarrow$ `INSTALL_SCHEDULED` $\rightarrow$ `WIRING` $\rightarrow$ `ACTIVATED`) with database uniqueness constraints enforced via `Idempotency-Key` headers. |
| **Optical Telemetry & Power Tracking** | Network Telemetry | **Simulated Integration** | Simulates physical optical power signal levels ($-18.0$ to $-24.0\text{ dBm}$), distribution box fiber splicing milestones, and ONT serial terminal registration. |
| **Installation Slot Scheduling** | Resource Scheduling | **Fully Implemented** | 2-hour technician slot selection and persistence in MongoDB order documents with customer rescheduling protection. |
| **Customer Support Callback Dispatch** | Customer Care | **Fully Implemented** | Creates proactive `HelpRequest` records in MongoDB with one-click escalation from the tracker timeline. |
| **Back-Office Funnel Analytics** | Business Intelligence | **Fully Implemented** | Aggregates 5,000 historical synthetic leads, reproducing the audited 7.36% conversion rate (368 activations) and 4 structural leaks. |
| **ML Propensity Scoring Model** | Machine Learning | **Fully Implemented** | L2-regularized Logistic Regression model trained strictly on pre-assessment features to prevent data leakage; measured and verified empirical $\text{ROC AUC} = 0.6879$. |
| **Partner Field Technician Console** | Field Operations | **Fully Implemented** | Mobile-responsive dispatch dashboard at `/partner` allowing field technicians to calibrate optical signal power and transition orders to `ACTIVATED`. |
| **WhatsApp Business API** | Omnichannel Comm | **Future Roadmap** | Architectural stub behind `FEATURE_WHATSAPP` feature flag; documented for post-hackathon rollout via Airtel IQ CPaaS. |
| **Voice Inbound / IVR Calling** | Telephony & Voice | **Future Roadmap** | Architectural stub behind `FEATURE_VOICE` feature flag; documented for post-hackathon rollout via Airtel IQ Voice APIs. |
