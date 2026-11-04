# Udyam One REST API Reference

**Base URL:** `/api/v1`  
**Authentication:** Bearer JWT in `Authorization` header (`Bearer <access_token>`) and HttpOnly refresh cookie.  
**CSRF Protection:** Required on mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) via `X-CSRF-Token` header.  
**Idempotency:** Required on financial/contract endpoints (`POST /quotes/:id/accept`, `POST /orders`) via `Idempotency-Key` header.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /auth/otp/request`
Request an SMS verification code for mobile authentication.
- **Request Body:**
  ```json
  { "phone": "9876543210" }
  ```
- **Response (200 OK):**
  ```json
  { "ok": true, "data": { "challengeId": "uuid", "expiresIn": 300, "maskedPhone": "•••• ••10" } }
  ```

### `POST /auth/otp/verify`
Verify SMS OTP code and issue JWT session.
- **Request Body:**
  ```json
  { "challengeId": "uuid", "code": "123456" }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "user": { "id": "...", "role": "owner", "phoneLast4": "3210" },
      "accessToken": "jwt...",
      "csrfToken": "token..."
    }
  }
  ```

### `POST /auth/staff/login`
Staff back-office login for advisors and administrators.
- **Request Body:**
  ```json
  { "email": "advisor@airtel.com", "password": "..." }
  ```

### `POST /auth/refresh`
Refresh access token using HttpOnly cookie.

### `POST /auth/logout`
Revoke session and clear cookies.

---

## 2. Product Catalogue & Rules Engine (`/api/v1`)

### `GET /catalogue`
List active enterprise products seeded from `product_catalogue.csv`.
- **Query Params:** `category`, `segment`, `city_tier`.
- **Response (200 OK):** Array of 25 products with prices, setup fees, minimum contracts.

### `POST /rules/eligible`
Compute eligible products for a specific SMB profile.
- **Request Body:**
  ```json
  {
    "segment": "prof",
    "cityTier": 1,
    "employeeCount": 12,
    "numSites": 1,
    "hasGstin": true
  }
  ```

### `POST /rules/bundles`
Compute the 3 tiered bundles (Starter, Standard, Resilient) for an SMB profile.

### `POST /rules/validate`
Validate bundle dependencies, GSTIN mandates, and calculate immutable pricing totals.

---

## 3. Quotes & Scenarios (`/api/v1/quotes`)

### `POST /quotes`
Create a drafted quote with locked price hash and 7-day TTL.

### `GET /quotes/:id`
Retrieve quote details and line items.

### `PATCH /quotes/:id/items`
Toggle add-ons or adjust item quantities. Re-calculates pricing via server rules engine.

### `POST /quotes/:id/preview`
Simulate business impact scenarios:
- `scenario`: `'peak_season'` | `'branch_expansion'` | `'failover_backup'`.

### `POST /quotes/:id/accept`
Accept quote and lock commercial pricing.
- **Required Header:** `Idempotency-Key: <unique_uuid>`
- **Response (200 OK):** Accepted quote record with locked price hash.

---

## 4. AI Advisor (`/api/v1/advisor`)

### `POST /advisor/chat`
Send conversation message in Hindi, English, or mixed Hinglish.
- **Request Body:**
  ```json
  {
    "conversationId": "...",
    "message": "Humare 12 employees hain aur broadband chahiye"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "message": "...",
      "state": "RECOM_OFFERED",
      "extractedProfile": { "employeeCount": 12, "city": "Delhi" },
      "quote": { "quoteId": "...", "monthlyTotal": 999 }
    }
  }
  ```

---

## 5. Smart KYC Pipeline (`/api/v1/kyc`)

### `POST /kyc/consent`
Record explicit DPDP applicant consent before any file upload.
- **Request Body:**
  ```json
  {
    "noticeVersion": "1.0",
    "purposes": ["identity_verification", "telecom_activation"],
    "documentTypes": ["gst_certificate", "signatory_id", "address_proof"]
  }
  ```

### `POST /kyc/consent/withdraw`
Withdraw consent; suspends active case and queues documents for secure deletion.

### `POST /kyc/upload`
Upload document multipart payload and execute C01–C19 check pipeline.
- **Multipart Fields:** `gst_certificate`, `signatory_id`, `address_proof`, `udyam_certificate` (optional).
- **Body Fields:** `consentId`, `quoteId`, `leadId`, `applicantId` (for benchmark testing).
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "status": "verified",
      "verdict": "auto_approved",
      "summary": "All 19 verification checks passed.",
      "checks": [ ... ],
      "retentionDays": 180
    }
  }
  ```

### `GET /kyc/review-queue`
(Staff only) List cases flagged with soft failures awaiting manual human review.

### `POST /kyc/cases/:id/review`
(Staff only) Submit manual review decision (`approve` or `reject`) with mandatory `decisionNote`.

---

## 6. Orders & Provisioning Simulator (`/api/v1/orders`)

### `POST /orders`
Create an order from an accepted quote.
- **Required Header:** `Idempotency-Key: <uuid>`
- **Request Body:**
  ```json
  { "quoteId": "QT-ORD-..." }
  ```

### `GET /orders/:id`
Get order status, estimated activation date, timeline, and telemetry.

### `POST /orders/:id/slot`
Schedule technician installation visit.
- **Request Body:**
  ```json
  { "slotDate": "2026-07-20", "timeWindow": "09:00 - 12:00" }
  ```

### `POST /orders/:id/simulate-advance`
Advance order provisioning stage in demo simulator.

### `POST /orders/:id/help`
Raise a proactive support request without calling customer care.

---

## 7. Executive Back-Office (`/api/v1/backoffice`)

### `GET /backoffice/funnel`
Cumulative funnel counts matching the 5,000 lead case dataset, stage exits, and drop-off diagnosis.

### `GET /backoffice/unclosed-leads`
List unclosed leads ranked by ML activation propensity score with top driver explanations.

### `GET /backoffice/segments`
Verified segment economics: Professional offices, Micro retail, Multi-site, Manufacturers.

### `GET /backoffice/sources`
Acquisition channel performance: Referral, Inbound, Channel, Field sales, Web, WhatsApp.

### `PATCH /backoffice/leads/:id`
Update advisor assignment status and notes on an unclosed lead.

---

## 8. Owner Portal & DPDP Compliance (`/api/v1/me`, `/api/v1`)

### `GET /me/overview`
Get consolidated owner dashboard state: profile, next incomplete onboarding action, active quote, active orders, and notifications.

### `GET /me/export`
Export complete personal data package under DPDP Act 2023 Section 11/12 (Data Portability). Returns structured JSON.

### `POST /me/deletion-requests`
Submit formal right-to-erasure request under DPDP Act 2023 Section 12. Marks active consents as withdrawn and triggers retention review.

### `GET /faq`
Retrieve bilingual FAQ entries (English and Hindi) grouped by categories (eligibility, pricing, Smart KYC, delivery).

### `POST /grievances`
Submit a formal grievance to the Airtel Data Protection Officer (DPO) and Nodal Grievance Officer. Returns tracking ticket ID.
