# Digital Personal Data Protection (DPDP) Compliance Note

> [!NOTE]
> **Product:** Udyam One (Airtel SYNC 2026, Digital Track A)  
> **Regulatory Framework:** Digital Personal Data Protection Act, 2023 (DPDPA 2023, Act No. 22 of 2023), DPDP Rules 2025 (G.S.R. 843(E) dated 13 Nov 2025), and DoT Guidelines.  
> **Applicability:** Small & Medium Business Onboarding, Enterprise Broadband Provisioning  
> **Version:** 1.0 (Audited November 2026)  
> **Full Legal Audit:** See [docs/LEGAL_CLAIMS_AUDIT.md](file:///Users/sumitagrawal/Desktop/AIRTEL%20HACKATHON/udyam-one/docs/LEGAL_CLAIMS_AUDIT.md)

---

## 1. Executive Summary & Regulatory Stance

Udyam One is engineered from first principles to be strictly compliant with India's **Digital Personal Data Protection Act, 2023** and **DPDP Rules 2025**. As a regulated telecommunications Data Fiduciary, Bharti Airtel collects only the minimum necessary business and signatory information required to satisfy statutory customer verification (Know Your Customer) and network provisioning.

All processing is governed by **explicit, versioned consent**, **purpose limitation**, **verifiable data minimisation**, **authenticated AES-256-GCM encryption at rest**, and **automated TTL erasure schedules**.

---

## 2. Core DPDP Principles Implemented in Udyam One

### 2.1. Notice and Consent Architecture (Sections 5 & 6)
- **Pre-Collection Notice:** An explicit, itemized privacy notice (`Notice Version 1.0`) is rendered in English and Hindi prior to requesting any business document upload.
- **Granular Lawful Purposes:**
  1. Business entity identity verification against official mock registries (GSTIN & Udyam).
  2. Principal place of business address verification via utility records.
  3. Authorised signatory identity check for telecom contract execution.
  4. Statutory compliance under TRAI/DoT telecommunications guidelines.
- **Strict Consent Gate (Rule 7):** The backend strictly enforces that any document upload without an active, un-withdrawn consent record returns an immediate **HTTP 403 Forbidden (`CONSENT_REQUIRED`)**.
- **Audit Logging without PII:** Consent records capture SHA-256 hashes of client IP and User-Agent, notice version, and exact UTC timestamps without storing raw browser telemetry.

### 2.2. Right to Access Information & Voluntary Data Export (Section 11)
- **Right to Information:** In accordance with Section 11, subscribers can review a complete summary of processed personal data and processing activities.
- **Enhanced Data Portability:** While general unconstrained data portability is not mandated as an unconditional entitlement under Section 11, Udyam One voluntarily provides an automated JSON data export at `GET /api/v1/me/export` as an enterprise privacy best practice.

### 2.3. Right to Withdraw Consent & Erasure with Legal Hold (Sections 6(4) & 12)
- **Consent Withdrawal:** Applicants can withdraw consent at any time via `POST /api/v1/kyc/consent/withdraw`. On withdrawal, automated pipeline tasks cease and status transitions to `withdrawn`.
- **Right to Erasure (`POST /api/v1/me/deletion-requests`):** For rejected or un-contracted leads, files are immediately purged from encrypted storage.
- **DoT Statutory Retention & Legal Hold:** For active telecom subscriptions, Section 12 erasure is subject to statutory retention obligations under DoT subscriber verification regulations (180 days). A `legalHold: true` status preserves billing and audit logs, transparently communicated to the user.

### 2.4. Data Minimisation & Proportionality (Section 6(1))
- **Strict Allowlist:** Collects only 3 mandatory documents (GST Certificate, Signatory ID, Address Proof) + optional Udyam Certificate.
- **Prohibited Data:** No raw biometrics, facial recognition, video surveillance, personal bank statements, device contacts, or SMS logs are ever requested or stored.

### 2.5. Cryptographic Storage & Encryption at Rest (Section 8(5))
- **AES-256-GCM Storage:** All uploaded documents are encrypted using AES-256 in Galois/Counter Mode (GCM) with a unique 12-byte random IV and 16-byte authentication tag per file.
- **Tamper Rejection:** Any bit-flipping on ciphertext or authentication tag triggers immediate cryptographic rejection upon decryption.

### 2.6. Automated Retention Schedules & TTL (Section 8(7))
- **Ineligible / Rejected Applications:** Assigned a **30-day TTL (`deleteAfter`)** and purged.
- **Verified / Activated Customers:** Approved verification binaries are retained for **180 days** per DoT auditing rules, after which MongoDB TTL indexes and a nightly daemon automatically purge files from disk.

### 2.7. Personal Data Breach Response (Section 8(6))
- **Operational SLA:** Udyam One targets an internal 72-hour notification SLA to notify the Data Protection Board of India (DPBI) and affected Data Principals upon forensic confirmation of a personal data breach.

### 2.8. PII Masking & Privacy-Preserving Logging (Rule 6)
- **Log Redaction:** Request logs, error logs, and audit entries use structured `pino` redaction.
- **Masking:** Phones show last 4 digits only (`•••• ••99`); GSTIN/Udyam retain state code and checksum only (`27••••••••••1ZP`); passwords and tokens are never logged.

### 2.9. Data Protection Officer (DPO) & Bilingual Grievances (Section 13)
- Dedicated DPO contact published on `/privacy` and `/grievance`.
- Bilingual ticketing system with automated status tracking (`POST /api/v1/grievances`).
