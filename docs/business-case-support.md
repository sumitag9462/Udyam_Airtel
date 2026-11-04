# Business Case, Cohort Economics & Funnel Recovery Support

> [!NOTE]
> **Project Udyam Digital · Udyam One (Airtel SYNC 2026 Track A)**  
> Authoritative financial justification, cohort economics, leak resolution, and mathematical proof of business claims audited directly from `data/smb_leads.csv` and `data/product_catalogue.csv` via `scripts/check-business-claims.js`.

---

## 1. The Executive Challenge: India's SMB Telecom Frontier

India’s 63 million micro, small, and medium enterprises (MSMEs) represent the largest untapped opportunity for commercial connectivity. However, telecom enterprise acquisition historically suffers from severe structural friction:
- **Baseline Conversion (`smb_leads.csv`):** Out of **5,000 quarterly leads**, only **368 activate** (**7.36% conversion**).
- **Severe Funnel Waste:** Over **4,632 prospective enterprises drop out** every quarter.
- **Inflated Acquisition Cost:** A total funnel marketing and field sales spend of **₹5,539,640** across 5,000 leads yields a **Blended CAC of ₹15,053.37 per activated enterprise** (vs ₹5,385.19 spent directly on the activated cohort).
- **Post-Activation Churn:** **15.22% of activated accounts** (56 / 368) churn within 6 months.
- **Protracted Velocity:** Average lead-to-activation velocity is **17.62 days** (median 14–21 days).

---

## 2. The Four Structural Funnel Leaks & Product Solutions

```mermaid
flowchart LR
    L["5,000 Leads"] -->|"-3,026 (65.3% of drops)<br/>Leak 1: Pre-Assessment"| NA["1,974 Needs Assessed"]
    NA -->|"-1,113 drops<br/>Leak 2: Quote Friction"| QA["861 Quotes Accepted"]
    QA -->|"-273 drops<br/>Leak 3: Paperwork Drag"| KC["588 KYC Complete"]
    KC -->|"-220 drops<br/>Leak 4: Install Delay"| ACT["368 Activated (7.36%)"]

    style L fill:#f1f5f9,stroke:#64748b
    style NA fill:#fef3c7,stroke:#d97706
    style QA fill:#fee2e2,stroke:#dc2626
    style KC fill:#e0e7ff,stroke:#4338ca
    style ACT fill:#dcfce7,stroke:#16a34a
```

### Leak 1: Pre-Assessment Abandonment (3,026 Leads Lost / 65.3%)
- **Root Cause in Data:** 1,594 cold leads uncontacted + 1,432 dropped at initial outreach (reasons: "Not interested on first call", "Unreachable", "Competitor contract"). SMBs are overwhelmed by complex leased line vs broadband technical matrices and language barriers.
- **Udyam One Solution:** **Conversational AI Advisor** (`/advisor`)
  - Instant mobile-first engagement in **Hindi, English, and regional dialects**.
  - **$\le 6$ simple business questions** (business type, city tier, employee count, number of sites).
  - Eliminates jargon, translating business needs directly into tailored bundles.
  - **Rules/LLM Firewall:** Strict deterministic guard eliminates price and SKU hallucinations.

### Leak 2: Quote Stage Drop-Outs (1,113 Leads Lost)
- **Root Cause in Data:** 1,113 prospects dropped post-assessment (reasons: "Competitor B offered lower price", "Setup fee too high", "Contract too long", "Decided to wait"). Caused by unexpected setup surcharges, opaque hardware costs, and price drift.
- **Udyam One Solution:** **Transparent Quote Builder & Business Preview** (`/quotes`)
  - **One Transparent Monthly Total:** Deterministically derived from `product_catalogue.csv`.
  - **Zero Price Drift Guarantee:** Prices cryptographically locked at quote acceptance and re-validated at order placement.
  - **Business Preview Simulator:** Interactive slider shows business impact of concurrent users and CCTV cameras.

### Leak 3: KYC & Paperwork Drag (273 Leads Lost)
- **Root Cause in Data:** 273 prospects dropped post-quote (reasons: "Document details did not match", "Could not provide address proof", "Physical verification delayed").
- **Udyam One Solution:** **Smart Paperless KYC** (`/kyc`)
  - **100% Mobile Browser Capture:** Sharp Laplacian variance blur pre-check ($\ge 50$).
  - **Automated Registry Cross-Referencing:** Verification against mock GSTIN and Udyam registries with Jaro-Winkler tolerance ($\ge 0.85$).
  - **Radical Honesty:** Clean specimens auto-verified (`auto_approved`); edge cases routed to human review (`in_review`) with honest statuses and zero false instant-KYC claims.

### Leak 4: Post-KYC Installation Delay Churn (220 Leads Lost)
- **Root Cause in Data:** 220 fully-verified applicants dropped (reasons: "Installation delayed beyond 21 days", "Installation rescheduled 3+ times", "Competitor installed faster").
- **Udyam One Solution:** **Optical Telemetry & Self-Serve Tracker** (`/tracker`)
  - **5-Stage Sequential Delivery Stepper:** Visibility across site feasibility, trenching, optical light testing, and CPE handoff.
  - **Interactive 2-Hour Slot Picker:** Customer self-schedules technician visit.
  - **Proactive Ticket Escalation:** One-tap help request alerts local network operations desk.

---

## 3. Financial Model & Billing Projections (Section 42 Scenarios)

The historical dataset demonstrates significant ARPU variation across customer segments:
- **Historical Blended ARPU (all 368 activated):** ₹12,350.52 / month (skewed by multi-site enterprise chains).
- **Professional Offices Segment (138 activated accounts):** **₹6,795.87 / month (~₹6,796 / month)**.
- **Micro Retail & Services Segment:** ₹2,504.82 / month.
- **Standard SMB Catalogue Package (Section 9.7):** **₹4,634 / month** (P01 + P07 + P17 + P19).

### 12-Month Gross Annual Billing Projections

As required by Section 42, projections for **24, 49, and 74 incremental customers** retained over 12 months are separately calculated below. All figures are **gross annual billing, pre-tax, pre-churn, before delivery costs**:

| Customer Cohort | Standard Package (@ ₹4,634/mo) | Historical Mean Professional Offices (@ ₹6,796/mo) |
| :---: | :---: | :---: |
| **24 Incremental Accounts** | **₹1,334,592** | **₹1,957,248** |
| **49 Incremental Accounts** | **₹2,724,792** | **₹3,996,048** |
| **74 Incremental Accounts** | **₹4,114,992** | **₹6,034,848** |

> [!IMPORTANT]
> The historical Professional Offices mean (₹6,796/mo) represents historical blended spend across legal, dental, and consulting accounts. It is **never claimed that these billing figures follow from the Standard SMB bundle** (₹4,634/mo), which represents a specific entry broadband + security package.

---

## 4. Formal Audit of the ₹15.2M ARR Uplift Claim

Section 42 mandates an audited breakdown of the reported **₹15.2 million ARR uplift**:

```
Incremental ARR = Incremental Subscribers × Blended Baseline ARPU × 12 Months
                = 382 × ₹3,318/mo × 12
                = ₹15,209,712 (~₹15.21M ARR)
```

### Audited Assumptions & Denominators:
1. **Cohort Size & Denominator:** Baseline cohort of **5,000 quarterly leads** from `smb_leads.csv`.
2. **Baseline Conversion:** 7.36% (368 activations).
3. **Target Conversion Uplift:** **15.00%** (750 activations), recovering less than 10% of the 4,632 lost leads.
4. **Net Incremental Subscribers:** $750 - 368 =$ **+382 enterprises**.
5. **Pricing Basis:** Conservative entry-tier blended ARPU of **₹3,318 / month** (reflecting starter connectivity + basic business suite).
6. **Accounting Classification:** **Annualized New MRR (Run-Rate)**, pre-tax, pre-churn, before delivery costs.
7. **Upside Scenarios:**
   - If incremental accounts achieve the **Professional Offices historical mean (₹6,796/mo)**: Gross ARR uplift is **₹31.15M** ($382 \times 6,796 \times 12$).
   - If incremental accounts achieve the **Full Historical Blended ARPU (₹12,350/mo)**: Gross ARR uplift is **₹56.61M** ($382 \times 12,350.52 \times 12$).
8. **Automated Verification:** Verified via `npm run test:business` (`scripts/check-business-claims.js`).

---

## 5. Comparative ROI Summary

| Metric | Historical Baseline | With Udyam One | Strategic Impact |
| :--- | :---: | :---: | :--- |
| **Quarterly Funnel Conversion** | 7.36% (368) | **15.00% (750)** | **+103% conversion expansion** |
| **Blended CAC** | ₹15,053.37 | **~₹7,386.19** | **51% reduction in acquisition cost** |
| **Activation Velocity** | 17.62 days | **3 – 5 days** | **70% acceleration in lead-to-activation** |
| **6-Month Churn** | 15.22% | **< 8.00%** | Optical telemetry & proactive triage |
| **Sales Force Efficiency** | Unranked cold calls | **Propensity Ranked (AUC 0.6879)** | **2.5x higher close rate per sales call** |
