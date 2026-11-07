# Udyam One: Architectural Limitations & Operational Boundaries
**Airtel Sync 2026 Hackathon · Problem Statement Track A: Digital Onboarding & Enterprise Connectivity**

---

## 1. Overview

In accordance with good engineering ethics and hackathon judging criteria, this document articulates the current technical boundaries, environmental assumptions, and scope limitations of Udyam One in its prototype stage.

---

## 2. Technical & Environmental Limitations

### 2.1. External SMS Gateway & OTP Dispatch
- **Current Reality:** Production telecom deployments integrate with high-throughput SMS aggregators (e.g. Airtel IQ, Gupshup, or Twilio) using DLT-registered SMS templates.
- **Limitation in Prototype:** To ensure 100% offline testability without cellular signal or external carrier dependency, Udyam One runs in `OTP_MODE=simulated`. Generated 6-digit OTPs are dispatched to a local MongoDB `Notification` collection and surfaced in the client Dev Outbox drawer or at `/api/v1/dev/outbox`.
- **Production Path:** Replace the simulated dispatch call in `backend/src/services/authService.js` with Airtel IQ CPaaS REST API.

### 2.2. Government Registries (GSTN & Udyam)
- **Current Reality:** Real-time production validation requires authenticated B2B access to the Goods and Services Tax Network (GSTN) GSP (GST Suvidha Provider) and Ministry of MSME Udyam verification APIs.
- **Limitation in Prototype:** Udyam One validates structural syntax, regex patterns, and 15-character MOD-36 checksums locally, but queries status against an offline dataset (`data/mock_gstin_registry.csv`). It does not make live calls to GSTN or MCA servers.
- **Production Path:** Bind `backend/src/kyc/checks/` to Airtel's enterprise API gateway with signed mutual TLS (mTLS).

### 2.3. Optical Telemetry & Fiber Provisioning
- **Current Reality:** Fiber activation in the real world involves physical trenching, last-mile overhead wiring, optical power meter testing at the Customer Premises Equipment (CPE), and ONT MAC registration against Airtel's Optical Line Terminal (OLT) and Element Management System (EMS).
- **Limitation in Prototype:** Physical line power levels ($-18$ to $-24\text{ dBm}$) and ONT serial registrations are simulated via a deterministic telemetry generator (`orderService.js`). While the order state machine and partner dispatch console are real, no physical fiber is being spliced.
- **Production Path:** Integrate with Airtel's Automated Network Provisioning System (ANPS) and GIS field workforce management tools.

### 2.4. Encryption Key Management (KMS)
- **Current Reality:** Regulated financial and enterprise platforms store root document encryption keys inside hardware security modules (HSM) or cloud KMS (such as AWS KMS, Google Cloud KMS, or HashiCorp Vault) with automated key rotation.
- **Limitation in Prototype:** Udyam One uses a single 256-bit base64-encoded key (`FILE_ENC_KEY`) stored in `.env` to perform AES-256-GCM encryption with unique 12-byte IVs per file.
- **Production Path:** Wrap the file encryption key with AWS KMS / GCP Cloud KMS customer-managed encryption keys (CMEK).

### 2.5. Optical Character Recognition (OCR) Engine
- **Current Reality:** Production enterprise document processing typically utilizes multi-modal document foundation models (e.g. Google Cloud Document AI, AWS Textract, or fine-tuned vision models) achieving $>98\%$ text accuracy on degraded mobile photos.
- **Limitation in Prototype:** Udyam One uses `tesseract.js` (with English and Hindi trained data) and a deterministic fallback extractor. While Laplacian blur detection and entity classification are production-grade, OCR on heavily crumpled or skewed mobile photos will route to the human review queue.
- **Production Path:** Provision an enterprise Document AI OCR pipeline for heavy skew and watermark normalization.

### 2.6. Single-Node MongoDB Database
- **Current Reality:** Mission-critical telecom applications require a multi-region replica set with sharded collections and distributed transaction rollback.
- **Limitation in Prototype:** The current local development setup operates on a single-node standalone MongoDB daemon listening on `127.0.0.1:27017`. While Mongoose models utilize optimistic concurrency (`__v`), multi-document transactions require replica set initialization.
- **Production Path:** Deploy MongoDB Atlas multi-zone replica set (M30+ cluster).
