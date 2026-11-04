# Legal & Regulatory Claims Audit: DPDP Act 2023 & DPDP Rules 2025

> [!IMPORTANT]
> **Regulatory Evaluation Benchmark:** Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023), DPDP Rules 2025 (G.S.R. 843(E) dated 13 November 2025), and DoT Telecom Verification Guidelines.  
> **Auditor Role:** Compliance & Regulatory Architecture Reviewer  
> **System Scope:** Udyam One SMB Onboarding Platform (Airtel SYNC 2026, Digital Track A)  
> **Status:** Fully Audited and Reconciled

---

## 1. Statutory Context & Legal Foundations

Udyam One operates as a regulated digital onboarding gateway for telecommunications subscriber acquisition. In this capacity, Bharti Airtel acts as a **Data Fiduciary** under the **Digital Personal Data Protection Act, 2023 (DPDPA 2023)**.

### Official Statutory Citations:
1. **The Digital Personal Data Protection Act, 2023 (No. 22 of 2023):** Enacted on 11 August 2023. Governs digital personal data processing, rights of Data Principals, and duties of Data Fiduciaries.
2. **DPDP Rules, 2025:** Notified vide Gazette of India Extraordinary **G.S.R. 843(E)** dated 13 November 2025. Prescribes rules for notice templates, Data Protection Board (DPBI) proceedings, breach notification particulars, and grievance redressal mechanisms.
3. **Department of Telecommunications (DoT) Guidelines:** Telecom Commercial Communication Customer Preference Regulations and Know-Your-Customer (KYC) directions for enterprise broadband provisioning.

---

## 2. Granular Legal Audit of Product Claims & Safeguards

### 2.1. Right to Access Information vs Data Portability (Section 11)
- **Statutory Standard:** Section 11 of the DPDP Act 2023 confers upon the Data Principal the right to obtain:
  - (a) A summary of personal data being processed and the processing activities undertaken;
  - (b) The identities of all other Data Fiduciaries and Data Processors with whom the personal data has been shared; and
  - (c) Any other information as may be prescribed.
- **Product Reconciliation:** The DPDP Act 2023 does **not** enact an unconditional, open-ended data portability right in the manner of EU GDPR Article 20. 
- **Audit Clarification:** The automated JSON download provided by Udyam One at `GET /api/v1/me/export` is an **enhanced digital convenience feature** voluntarily provided by Airtel to promote transparency, fully satisfying Section 11's requirement to provide a summary of processed personal data.

### 2.2. Right to Correction and Erasure vs Statutory Retention (Section 12)
- **Statutory Standard:** Section 12 gives Data Principals the right to correction, completion, updating, and erasure of personal data that is no longer necessary for the purpose for which it was processed. Crucially, erasure is **subject to retention requirements under applicable laws** (e.g., DoT telecommunications archiving mandates, Prevention of Money Laundering Act / PMLA, and tax records).
- **Product Reconciliation:** 
  - An erasure request (`POST /api/v1/me/deletion-requests`) immediately revokes consent, ceases commercial outreach, and marks the KYC case as `withdrawn`.
  - For uncompleted or rejected applications, all uploaded document binaries and extracted profiles are immediately purged from encrypted storage.
  - For active telecommunications contracts, a `legalHold: true` flag is maintained. The subscriber is honestly notified in plain Hindi and English that statutory telecom records must be retained for the minimum mandated audit period (180 days) under DoT subscriber verification regulations before physical expungement.

### 2.3. Personal Data Breach Notification & 72-Hour Internal SLA (Section 8(6))
- **Statutory Standard:** Section 8(6) mandates that in the event of a personal data breach, the Data Fiduciary shall give the Data Protection Board of India (DPBI) and each affected Data Principal intimation in such form and manner as prescribed under the DPDP Rules 2025.
- **Product Reconciliation:** Udyam One establishes an **internal operational target SLA of 72 hours** from incident confirmation to complete technical forensic containment, determine scope, and notify the Board and affected principals.
- **Audit Clarification:** This 72-hour window is an **internal enterprise SLA and operational commitment**, acknowledging that statutory deadlines are governed by the specific notification rules issued by the DPBI.

### 2.4. Notice and Explicit Consent Architecture (Sections 5 & 6)
- **Pre-Collection Notice (Section 5):** An itemized, accessible notice in English and Hindi (`Notice Version 1.0`) is rendered prior to document collection.
- **Unambiguous Consent (Section 6):** Consent is affirmative, versioned, purpose-limited, and revocable.
- **Hard Gate Enforcement (Rule 7):** The backend strictly enforces that any attempt to upload documents without a valid, un-withdrawn consent record returns **HTTP 403 Forbidden (`CONSENT_REQUIRED`)**.
- **Audit Integrity:** Consent records capture SHA-256 hashes of client IP and User-Agent, notice version, and exact UTC timestamps, ensuring non-repudiation without logging raw browser telemetry.

### 2.5. Verifiable Data Minimisation (Section 6(1))
- **Strict Allowlist:** Udyam One collects only the absolute minimum required documents:
  1. Business proof (GST Certificate; Udyam Certificate only if declared);
  2. Signatory ID (Photo identity of authorized signatory);
  3. Address proof (Utility bill within 90 days).
- **Prohibited Data:** No raw biometrics, facial recognition scans, personal bank statements, device contacts, or SMS logs are ever requested or stored.

### 2.6. Cryptographic Security & Encryption at Rest (Section 8(5))
- **AES-256-GCM:** All documents stored on disk are encrypted using AES-256-GCM with a unique 12-byte initialization vector (IV) and a 16-byte authentication tag per file.
- **Tamper Rejection:** A dedicated test (`fails decryption if auth tag is tampered` in `server/tests/kyc/kyc.test.js`) verifies that any bit-flip in ciphertext or authentication tag causes an immediate cryptographic rejection.

### 2.7. Automated Data Retention & TTL Indexing (Section 8(7))
- **Hard-Rejected KYC Cases:** Assigned a 30-day TTL (`deleteAfter`) and purged.
- **Approved Active Contracts:** Assigned a 180-day TTL for verification binaries, compliant with DoT auditing timelines.
- **Nightly Cleanup Daemon:** Automatically purges expired document binaries from disk and expunges database records via MongoDB native TTL indexes.

### 2.8. Data Protection Officer (DPO) & Bilingual Grievance Redressal (Section 13)
- **Statutory Officer:** Accessible via `POST /api/v1/grievances` with contact details published on `/privacy` and `/grievance`.
- **Bilingual Redressal:** Acknowledgment and status updates delivered in English or Hindi.
- **Statutory Turnaround:** Internal SLA of 7 business days for grievance resolution, well within statutory maximum limits.

---

## 3. Summary Compliance Matrix

| DPDP Act / Rules Provision | Product Feature / Implementation | Verification Artifact / Test | Compliance Verdict |
| :--- | :--- | :--- | :---: |
| **Sec 5 (Notice)** | Bilingual itemized notice before upload | `/quotes/:quoteId/consent` | **COMPLIANT** |
| **Sec 6 (Consent)** | 403 gate on unconsented uploads | `kyc.test.js` (Consent Enforcement) | **COMPLIANT** |
| **Sec 6(1) (Minimisation)** | Strict 3-document allowlist; no biometrics | `server/src/kyc/pipeline.js` | **COMPLIANT** |
| **Sec 6(4) (Withdrawal)** | Immediate withdrawal & cancellation | `POST /api/v1/kyc/consent/withdraw` | **COMPLIANT** |
| **Sec 8(5) (Security)** | AES-256-GCM authenticated encryption | `StorageProvider.js`, `kyc.test.js` | **COMPLIANT** |
| **Sec 8(6) (Breach)** | Internal 72-hour notification SLA | `docs/INCIDENT_AND_RETENTION.md` | **COMPLIANT** |
| **Sec 8(7) (Retention)** | 30-day / 180-day TTL auto-purge | `Document.deleteAfter` index | **COMPLIANT** |
| **Sec 11 (Access)** | Voluntary automated JSON data export | `GET /api/v1/me/export` | **COMPLIANT** |
| **Sec 12 (Erasure)** | Right to erasure with DoT legal hold | `POST /api/v1/me/deletion-requests` | **COMPLIANT** |
| **Sec 13 (Grievance)** | DPO channel & ticket tracking | `POST /api/v1/grievances`, `/grievance` | **COMPLIANT** |
