# System Architecture & Technical Specifications

**Product:** Udyam One — Regulated MERN SMB Onboarding & Delivery Platform  
**Hackathon:** Airtel SYNC 2026, Digital Track A (Project Udyam Digital)  
**Engineering Principle:** Correctness, honesty, and clarity beat feature count.

---

## 1. High-Level Architecture Overview

Udyam One is engineered as a mobile-first, enterprise-grade distributed web application with strict separation between deterministic business rules and non-deterministic natural language generation.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite)"]
        UI_Advisor["AI Advisor Chat (Hindi/English)"]
        UI_Quote["Interactive Quote Configurator & Scenarios"]
        UI_KYC["Smart KYC Upload & Progress Tracker"]
        UI_Tracker["Order Delivery Tracker & Slot Picker"]
        UI_Admin["Back-Office Funnel & Propensity Dashboard"]
    end

    subgraph Security ["Security & Compliance Perimeter"]
        CSRF["Double-Submit CSRF Verification"]
        RateLimit["Endpoint Rate Limiters"]
        RBAC["Role-Based Access Control (Owner / Staff)"]
        Mask["PII Masking & Pino Redaction"]
    end

    subgraph ExpressAPI ["Backend Core (Express 4 LTS)"]
        AuthSvc["Auth & OTP Engine"]
        AdvisorOrch["Advisor State Machine & Orchestrator"]
        Guard["LLM Response Guard & Placeholder Engine"]
        QuoteEngine["Quote & Commercial Engine"]
        KycPipeline["KYC Verification Pipeline (C01-C19)"]
        OrderSvc["Order State Machine & Provisioning Simulator"]
        PropensityEngine["Propensity ML Scorer (AUC 0.688)"]
    end

    subgraph Intelligence ["External Intelligence & OCR"]
        LLM["LLM Provider (Claude Sonnet 4 / Mock Provider)"]
        OCR["OCR Engine (Tesseract.js eng+hin / Mock Specimen)"]
        BlurDetect["Sharp Laplacian Variance Detector"]
    end

    subgraph Persistence ["Persistence & Encrypted Storage"]
        Mongo[("MongoDB 7 Single-Node Replica Set")]
        EncStorage[("Local AES-256-GCM Encrypted Storage Volume")]
    end

    Client --> Security
    Security --> ExpressAPI

    AdvisorOrch --> LLM
    LLM --> Guard
    QuoteEngine --> Mongo

    KycPipeline --> BlurDetect
    KycPipeline --> OCR
    KycPipeline --> EncStorage
    KycPipeline --> Mongo

    OrderSvc --> Mongo
    PropensityEngine --> Mongo
```

---

## 2. Core Architectural Pillars

### 2.1. Strict Separation: Rules Engine owns Facts; LLM owns Language
Under **Non-negotiable Rule 1 & Rule 2**, the Large Language Model is strictly forbidden from computing prices, totals, taxes, contract terms, or product eligibility:
1. **Determinism:** All pricing, bundle dependencies (`requires_one_of`), GSTIN mandates (`requires_gstin`), and contract commitments are evaluated exclusively by the deterministic server rules engine (`server/src/rules/engine.js`).
2. **Placeholder Substitution:** The LLM receives structured profile facts and emits response templates containing bracketed placeholders:
   ```text
   {{tierLabel}} plan aapke business ke liye best hai: {{quote.monthlyTotal}} / mahina.
   ```
3. **Response Guard (`server/src/advisor/guard.js`):** Every LLM output passes through an adversarial regex response guard prior to client transmission:
   - Blocks raw currency amounts (`₹`, `Rs`, `INR`, `1,299`).
   - Blocks raw product codes (`P01` to `P25`).
   - Blocks raw percentage numbers (`18%`, `20%`).
   - Hydrates validated numbers from the server quote result. If any unauthorized number is detected, the message is quarantined and safely regenerated from deterministic fallback copy.

### 2.2. Zero Hardcoding: Immutable Catalogue Seed
All commercial values are loaded from `data/product_catalogue.csv` directly into MongoDB on initialization:
- 25 verified enterprise products.
- Minimum/maximum prices, one-time installation setup fees, minimum contract tenures.
- Rule 11 Price Immutability: Once a customer accepts a quote (`POST /quotes/:id/accept`), the price hash is permanently locked. Order creation re-evaluates the rules engine and strictly rejects with `409 PRICE_DRIFT` if catalogue pricing changes.

---

## 3. Smart KYC Pipeline Architecture (Checks C01 to C19)

The KYC pipeline processes document specimens through 19 regulated verification checks:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as SMB Applicant
    participant Gateway as Express KYC Router
    participant Consent as Consent Model
    participant Storage as AES-256-GCM Volume
    participant Sharp as Image Quality (Sharp)
    participant OCR as OCR Engine
    participant Engine as 19 Regulated Checks Engine
    participant Registry as Mock Registries (GST & Udyam)

    Customer->>Gateway: POST /kyc/consent (Explicit DPDP Notice)
    Gateway->>Consent: Create Consent Record (Notice v1.0)
    Consent-->>Gateway: 201 Created (consentId)

    Customer->>Gateway: POST /kyc/upload (Files + consentId)
    Gateway->>Consent: Validate Active, Un-withdrawn Consent
    alt No Consent
        Gateway-->>Customer: 403 Forbidden (CONSENT_REQUIRED)
    end

    Gateway->>Storage: Encrypt Buffers (AES-256-GCM)
    Gateway->>Sharp: Assess Laplacian Variance (< 50 = Blurred)
    Gateway->>OCR: Extract Text (eng+hin)
    Gateway->>Engine: Run Checks C01 - C19
    Engine->>Registry: Verify GSTIN Status & MOD-36 Checksum
    
    alt All Checks Pass
        Engine-->>Gateway: AUTO_APPROVED (Status: verified)
    else Soft Failure (Blur, Noise, Name Variance)
        Engine-->>Gateway: REQUIRES_REVIEW (Status: in_review)
    else Hard Blocker (Cancelled GSTIN, Expired Bill > 90d)
        Engine-->>Gateway: REJECTED (Status: rejected)
    end

    Gateway-->>Customer: Return Verdict, Checks Audit & TTL Schedule
```

### Regulated Check Matrix:
- **C01 (Consent Gate):** Active non-withdrawn consent record verified.
- **C02 (Completeness):** GST certificate, Signatory ID, and Address proof present (Udyam optional).
- **C03 & C04 (Format & Size):** Magic bytes verified (JPEG/PNG/PDF), payload <= 5 MB.
- **C05 (Blur Detection):** Sharp Laplacian discrete convolution variance >= 50.
- **C06 (Classification):** Template classification matches document specimen layout.
- **C07 (Entity & Signatory Match):** Jaro-Winkler match (>= 0.85) with LLP entity authorization logic.
- **C08 (Address Freshness):** Bill date within 90 days of reference date (`2026-07-15`).
- **C09 & C10 (GSTIN Validation):** MOD-36 checksum validated; registry status verified as `Active`. Non-active (`Cancelled`, `Suspended`) triggers immediate hard failure.
- **C11 & C12 (Udyam Validation):** Format regex verified; cross-referenced with enterprise registry.
- **C13 & C14 (Consistency):** Constitution and 2-digit state prefix match address proof.
- **C15 & C16 (Integrity):** Synthetic ID structure validated; noise/corrupted tokens flagged.
- **C17 (Decision Engine):** Deterministic routing (Hard fail -> Rejected, Soft fail -> Review queue, Clean -> Verified).
- **C18 (Encrypted Storage):** Files saved with random 12-byte IV and 16-byte GCM auth tag.
- **C19 (Retention Schedule):** Rejected files purged at 30 days; verified customer records retained for 180 days.

---

## 4. Order Lifecycle & Provisioning Simulator

Orders follow a deterministic, auditable state machine governed by `ORDER_TRANSITIONS`:

```mermaid
stateDiagram-v2
    [*] --> QUOTE_ACCEPTED: Quote Accepted (Idempotency Key)
    QUOTE_ACCEPTED --> KYC_PENDING: Documents Awaited
    KYC_PENDING --> KYC_IN_REVIEW: Soft Failure (Referral)
    KYC_PENDING --> KYC_ACTION_NEEDED: Hard Failure / Blocker
    KYC_PENDING --> KYC_VERIFIED: All 19 Checks Passed
    KYC_IN_REVIEW --> KYC_VERIFIED: Advisor Manual Approval
    KYC_IN_REVIEW --> KYC_ACTION_NEEDED: Advisor Rejection
    KYC_VERIFIED --> FEASIBILITY_CHECK: OLT Port Allocation
    FEASIBILITY_CHECK --> INSTALL_SCHEDULED: Slot Booked
    INSTALL_SCHEDULED --> INSTALLED: CPE Router Connected
    INSTALLED --> ACTIVATED: Broadband Live (Stage 5)
    ACTIVATED --> [*]
```

### Proactive Non-Voice Support:
Instead of requiring customers to dial call-center queues, any order can raise a `HelpRequest` directly from the tracker (`POST /orders/:id/help`). Context snapshots (order status, technician notes, slot preferences) are attached and routed to the assigned dispatch engineer.

---

## 5. Machine Learning Propensity Engine

To solve the historical leak where **65% of leads drop before needs assessment**, Udyam One incorporates an L2-regularized Logistic Regression model trained on `data/smb_leads.csv` (5,000 observations):
- **Model Metric:** ROC AUC `0.6879` (honest benchmark, zero fabricated claims).
- **Top Positive Drivers:** GSTIN present (+0.169), Professional offices (+0.181), Referral lead (+0.126), Higher monthly telecom spend (+0.150).
- **Negative Drivers:** Cold web form (-0.159), Unassigned field visits (-0.057).
- **Explainable Output:** Every scored lead outputs the top 3 contributing factors for transparent advisor triage.
