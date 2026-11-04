# Release API Matrix: Complete Backend REST API Audit

> [!NOTE]
> **Project Udyam Digital · Udyam One (Airtel SYNC 2026 Track A)**  
> Exhaustive audit of all backend HTTP routes, methods, Zod request validation schemas, object-scope authorization, side effects, idempotency controls, rate limits, CSRF protection, and automated test coverage.  
> Conforming to **Section 26**, **Section 41**, and **Section 55** of the Master Engineering Specification.

---

## 1. REST API Specification & Endpoint Audit

| Method | Endpoint | Allowed Roles | Request Validation Schema | Object Scope Auth | Idempotent | Rate Limit Tier | CSRF Protected | Side Effects & Database Writes | Automated Test Suite |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **POST** | `/api/v1/auth/request-otp` | Anonymous | `RequestOtpSchema` (10-digit phone) | None | Yes | `auth` (5/min) | No (Anonymous) | Creates `OtpRecord` with hash; sends mock SMS outbox | `server/tests/api/auth.test.js` |
| **POST** | `/api/v1/auth/verify-otp` | Anonymous | `VerifyOtpSchema` (phone, 6-digit code) | None | No | `auth` (10/min) | No (Anonymous) | Sets `isVerified`, creates `User` (role: owner), sets JWT cookie | `server/tests/api/auth.test.js` |
| **POST** | `/api/v1/auth/staff-login` | Anonymous | `StaffLoginSchema` (email, password) | None | No | `auth` (5/min) | No (Anonymous) | Validates bcrypt hash, issues JWT access token | `server/tests/api/auth.test.js` |
| **POST** | `/api/v1/auth/logout` | Authenticated | None | Self | Yes | `global` (100/15m) | Yes | Clears HTTP-only JWT auth cookie | `server/tests/api/auth.test.js` |
| **GET** | `/api/v1/auth/session` | Authenticated | None | Self | Yes | `global` | Yes | Reads authenticated session state | `server/tests/api/auth.test.js` |
| **GET** | `/api/v1/catalogue` | Any | None | Public | Yes | `global` | No | Reads 25 seeded products from MongoDB | `server/tests/seed/verify.test.js` |
| **GET** | `/api/v1/catalogue/:id` | Any | Product SKU param | Public | Yes | `global` | No | Returns single catalogue product by SKU | `server/tests/seed/verify.test.js` |
| **POST** | `/api/v1/rules/eligible-products`| Any | `BusinessProfileSchema` | Public | Yes | `global` | No | Pure rules engine evaluation; no DB writes | `server/tests/rules/golden.test.js` |
| **POST** | `/api/v1/rules/build-bundles` | Any | `BuildBundlesSchema` | Public | Yes | `global` | No | Deterministic 3-tier bundle generation | `server/tests/rules/golden.test.js` |
| **POST** | `/api/v1/rules/compute-quote` | Any | `ComputeQuoteSchema` | Public | Yes | `global` | No | Computes exact monthly total & setup fee | `server/tests/rules/golden.test.js` |
| **POST** | `/api/v1/rules/preview-scenario` | Any | `PreviewScenarioSchema` | Public | Yes | `global` | No | Evaluates concurrency bandwidth requirement | `server/tests/rules/golden.test.js` |
| **POST** | `/api/v1/rules/explain-removal` | Any | `ExplainRemovalSchema` | Public | Yes | `global` | No | Returns plain-language rationale for add-on removal | `server/tests/rules/coverage.test.js` |
| **POST** | `/api/v1/advisor/chat` | Any | `AdvisorChatSchema` | Session/Owner | No | `advisor` (30/min) | Yes | Runs dialogue state machine, applies response guard | `server/tests/advisor/advisor.test.js` |
| **GET** | `/api/v1/advisor/sessions/:id` | Any | Session UUID param | Session/Owner | Yes | `advisor` | Yes | Retrieves conversation history and extracted profile | `server/tests/advisor/advisor.test.js` |
| **POST** | `/api/v1/quotes` | `owner`, `admin` | `CreateQuoteSchema` | Owner / Lead | Yes (`Idempotency-Key`) | `global` | Yes | Creates immutable `Quote` in MongoDB | `server/tests/api/quotes.test.js` |
| **GET** | `/api/v1/quotes/:id` | `owner`, `advisor`, `admin` | Quote ID param | Own quote only | Yes | `global` | Yes | Retrieves quote pricing details and line items | `server/tests/api/quotes.test.js` |
| **POST** | `/api/v1/quotes/:id/accept` | `owner`, `admin` | Quote ID param | Own quote only | Yes | `global` | Yes | Transitions quote to `accepted`; locks price cryptographically | `server/tests/api/quotes.test.js` |
| **POST** | `/api/v1/kyc/consent` | `owner`, `admin` | `ConsentSchema` (noticeVersion, purposes) | Owner / Lead | Yes | `global` | Yes | Creates `Consent` record with IP/UA hashes | `server/tests/kyc/kyc.test.js` |
| **POST** | `/api/v1/kyc/consent/withdraw`| `owner`, `admin` | Consent ID param | Own consent | Yes | `global` | Yes | Sets `withdrawnAt`, updates KYC case to `withdrawn` | `server/tests/kyc/kyc.test.js` |
| **POST** | `/api/v1/kyc/upload` | `owner`, `admin` | Multipart/form-data (4 files max) | Enforces 403 Consent Gate | No | `kyc` (10/min) | Yes | Encrypts files (AES-256-GCM), runs OCR & C01–C19 checks | `server/tests/kyc/kyc.test.js` |
| **GET** | `/api/v1/kyc/cases/:id` | `owner`, `advisor`, `admin` | Case ID param | Own case only | Yes | `global` | Yes | Returns masked KYC case details and check outcomes | `server/tests/kyc/kyc.test.js` |
| **GET** | `/api/v1/kyc/review-queue` | `advisor`, `admin` | Query params (limit, status) | Staff role-gated | Yes | `global` | Yes | Lists `in_review` KYC cases with extracted vs registry values | `server/tests/kyc/kyc.test.js` |
| **POST** | `/api/v1/kyc/cases/:id/review` | `advisor`, `admin` | `ReviewDecisionSchema` (decision, note) | Staff role-gated | Yes | `global` | Yes | Records manual decision, updates `KycCase`, audit logs note | `server/tests/kyc/kyc.test.js` |
| **POST** | `/api/v1/orders` | `owner`, `admin` | `CreateOrderSchema` (quoteId) | Owner / Quote | Yes (`Idempotency-Key`) | `orders` (10/min) | Yes | Verifies quote price drift, creates `Order` with 5-stage tracker | `server/tests/orders/orders.test.js` |
| **GET** | `/api/v1/orders` | `owner`, `advisor`, `partner`, `admin` | Query params | Scoped by role | Yes | `global` | Yes | Lists orders (owners see own orders; staff see all) | `server/tests/orders/orders.test.js` |
| **GET** | `/api/v1/orders/:id` | `owner`, `advisor`, `partner`, `admin` | Order ID param | Own order only (or staff) | Yes | `global` | Yes | Returns order tracking state, optical telemetry, scheduled slot | `server/tests/orders/orders.test.js` |
| **POST** | `/api/v1/orders/:id/slot` | `owner`, `admin` | `ScheduleSlotSchema` (slot, date) | Own order only | Yes | `global` | Yes | Assigns 2-hour technician window, updates order | `server/tests/orders/orders.test.js` |
| **POST** | `/api/v1/orders/:id/simulate-advance` | `owner`, `advisor`, `admin` | Order ID param | Own order / staff | Yes | `global` | Yes | Advances stepper to next provisioning stage (demo control) | `server/tests/orders/orders.test.js` |
| **POST** | `/api/v1/orders/:id/help` | `owner`, `admin` | `HelpRequestSchema` (issueType, notes) | Own order only | No | `global` | Yes | Captures order telemetry, creates `HelpRequest` alert | `server/tests/orders/orders.test.js` |
| **GET** | `/api/v1/partner/tasks` | `partner`, `admin` | Query params (status, limit) | Scoped to partner | Yes | `global` | Yes | Lists field engineering tasks and optical telemetry | `server/src/routes/partner.js` |
| **GET** | `/api/v1/partner/tasks/:id` | `partner`, `admin` | Task / Order ID param | Scoped to partner | Yes | `global` | Yes | Returns task details, site address, and optical readings | `server/src/routes/partner.js` |
| **PATCH**| `/api/v1/partner/tasks/:id` | `partner`, `admin` | `status`, `opticalSignalDbm`, notes | Scoped to partner | Yes | `global` | Yes | Calibrates optical signal dBm, logs technician notes | `server/src/routes/partner.js` |
| **GET** | `/api/v1/backoffice/funnel` | `advisor`, `admin` | None | Staff role-gated | Yes | `global` | Yes | Aggregates 5,000-lead funnel metrics and stage drop rates | `server/tests/backoffice/backoffice.test.js` |
| **GET** | `/api/v1/backoffice/unclosed-leads` | `advisor`, `admin` | Query params (limit, sort) | Staff role-gated | Yes | `global` | Yes | Returns unclosed leads with ML propensity scores and badges | `server/tests/backoffice/backoffice.test.js` |
| **POST** | `/api/v1/scoring/predict` | `advisor`, `admin` | Lead attributes payload | Staff role-gated | Yes | `global` | Yes | Evaluates trained L2 logistic regression weights (ROC AUC 0.6879)| `server/tests/backoffice/backoffice.test.js` |
| **GET** | `/api/v1/me/overview` | `owner` | None | Self only | Yes | `global` | Yes | Returns owner profile, active quotes, orders, next action | `server/tests/api/me.test.js` |
| **GET** | `/api/v1/me/export` | `owner` | None | Self only | Yes | `global` | Yes | DPDP voluntary JSON data export of all owner records | `server/tests/api/me.test.js` |
| **POST** | `/api/v1/me/deletion-requests` | `owner` | `reason` payload | Self only | No | `global` | Yes | Statutory erasure request; withdraws consent, tags files | `server/tests/api/me.test.js` |
| **POST** | `/api/v1/me/password` | `owner`, `advisor`, `partner`, `admin` | `oldPassword`, `newPassword` | Self only | No | `auth` | Yes | Re-hashes password with bcrypt, revokes active sessions | `server/tests/api/me.test.js` |
| **GET** | `/api/v1/public/faq` | Any | Query param `lang` | Public | Yes | `global` | No | Returns bilingual FAQ items (English & Hindi) | `server/tests/api/me.test.js` |
| **POST** | `/api/v1/public/grievances` | Any | `GrievanceSchema` | Public | No | `global` | Yes | Creates statutory DPO grievance ticket with reference number | `server/tests/api/me.test.js` |
| **GET** | `/healthz` | Any | None | Public | Yes | None | No | Process liveness probe (outside `/api/v1`) | `server/tests/api/health.test.js` |
| **GET** | `/readyz` | Any | None | Public | Yes | None | No | Database readiness check & MongoDB ping | `server/tests/api/health.test.js` |

---

## 2. API Security Controls Summary

1. **Helmet & Strict Headers:** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.
2. **MongoDB Sanitization:** `mongoSanitize()` cleans `$where`, `$` operators, and nested dots to prevent NoSQL injection.
3. **Pino Structured Redaction:** PII and credentials (`authorization`, `cookie`, `set-cookie`, passwords) automatically replaced with `[REDACTED]`.
4. **CSRF Dual-Cookie Defense:** State-changing requests enforce double-submit anti-CSRF token verification (`verifyCsrf`).
5. **Rate Limiting:** Granular buckets configured via `express-rate-limit` (Global: 100/15m; Auth: 5/min; KYC: 10/min; Advisor: 30/min).
