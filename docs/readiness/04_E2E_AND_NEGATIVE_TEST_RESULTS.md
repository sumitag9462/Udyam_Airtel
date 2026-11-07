# 04 — End-to-End Customer Journey and Negative Test Results
**Airtel SYNC 2026 · Enterprise Track A (Project Udyam Digital)**  
**Document ID:** `docs/readiness/04_E2E_AND_NEGATIVE_TEST_RESULTS.md`  
**Execution Environment:** Node v26, React 18, Vite 6.4.5, MongoDB 8.3 (Port 27017, rs0)  
**Date:** November 7, 2026  
**Repository Path:** `/Users/sumitagrawal/Desktop/AIRTEL HACKATHON/udyam-one`  

---

## 1. Fresh-User Real Customer Journey Execution Trace

Executed through live HTTP endpoints and persistent MongoDB queries via `scripts/validate-phase3-4-5.js`:
- **Synthetic Test Account:** Mobile `9937925604` (Dispatched simulated OTP: `562417`)
- **Generated User ID:** `6aeefc5c908bb970bfa4251c` (Role: `owner`)

| Step # | Journey Milestone & Action | Route / API Endpoint | HTTP Status & Response Body | MongoDB Collection & State Verified | Refresh / Session Behavior | Result |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **01** | Landing page load & network inspection | `GET /` | 200 OK | `Product` collection active (25 SKUs) | Zero uncaught console errors | **PASS** |
| **02** | Register fresh owner account via OTP | `POST /api/v1/auth/otp/request` | 200 OK (`OTP sent`) | `OtpChallenge` created; notification in outbox | Outbox stores masked phone `+91 99****5604` | **PASS** |
| **03** | Verify OTP & issue token pair | `POST /api/v1/auth/otp/verify` | 200 OK (`accessToken` issued) | `User` created (`phoneLast4: "5604"`, role: `owner`) | Token stored in `authStore` | **PASS** |
| **04** | Session persistence after refresh | `GET /api/v1/auth/me` | 200 OK (`user.role: owner`) | `RefreshToken` stored in DB (`rotatedFrom: null`) | Auto-hydration on reload | **PASS** |
| **05** | Enter fictional MSME profile | `AdvisorChat.jsx` form | Local state $\to$ Context | Stored in `conversationContext` | Survives component remounts | **PASS** |
| **06** | Open AI Advisor; single welcome check | `POST /api/v1/advisor/chat` | 200 OK (`conversationId` created)| `Conversation` record created in MongoDB | Single welcome message displayed | **PASS** |
| **07** | Conversational discovery turn (English) | `POST /api/v1/advisor/chat` | 200 OK (Questions on tools/staff)| `Conversation.messages` appended ($N=2$) | Contextual advice returned | **PASS** |
| **08** | Conversational discovery turn (Hindi) | `POST /api/v1/advisor/chat` | 200 OK (Hindi response returned) | `Conversation.messages` appended ($N=4$) | Hindi profile extracted (`mustHaves: [email]`) | **PASS** |
| **09** | Switch English $\leftrightarrow$ Hindi in chat | `Navbar.jsx` toggle | Instant re-render | UI labels re-rendered; chat history preserved | Preserved across navigation | **PASS** |
| **10** | Advisor $\to$ Quote Builder transition | `POST /api/v1/quotes` | 201 Created (`Q-2026-0FEC7A`) | `Quote` created (Monthly total: ₹3,290) | Profile attributes transferred | **PASS** |
| **11** | Compare Starter, Standard & Resilient | `GET /api/v1/catalogue` | 200 OK (3 tiers calculated) | Evaluated from 25 catalog SKUs | Starter ₹1999, Std ₹3290, Resilient ₹3789 | **PASS** |
| **12** | Configure modular add-ons | `POST /api/v1/quotes/:id/preview`| 200 OK (Recomputed total) | Line items updated in draft; total = ₹3,989/mo | Dynamic calculation without drift | **PASS** |
| **13** | Simulate Fibre Cut Resilience | `POST /api/v1/rules/scenarios/fibre-cut` | 200 OK (`protection: false`) | Single fiber line identified as single point of failure | Secondary cellular backup recommended | **PASS** |
| **14** | Simulate Dynamic 20% Budget Cut | `POST /api/v1/rules/scenarios/budget-cut` | 200 OK (Base ₹3989 $\to$ ₹2991) | Target budget ₹3,191 met with ₹998/mo savings | Non-critical add-ons dropped | **PASS** |
| **15** | Simulate Multi-Site Expansion | `POST /api/v1/rules/scenarios/multi-site` | 200 OK (Projected 2 sites) | Multi-site total calculated at ₹4,988/mo | Core accepted quote untouched | **PASS** |
| **16** | Issue, accept & lock quote | `POST /api/v1/quotes/:id/accept` | 200 OK (`status: accepted`) | `Quote.priceHash` (SHA-256) frozen in MongoDB | Tamper-proof lock active | **PASS** |
| **17** | Refresh & verify quote immutability | `GET /api/v1/quotes/:id` | 200 OK (`status: accepted`) | Re-read from MongoDB matches frozen priceHash | Attempted edits return HTTP 409 | **PASS** |
| **18** | Transition to Smart KYC; verify IDs | `KycPage.jsx` | Context resolution | `quoteId` and `leadId` resolved to real ObjectIds | Zero synthetic placeholder IDs | **PASS** |
| **19** | Grant DPDP Act 2023 Statutory Consent| `POST /api/v1/kyc/consent` | 201 Created (`Consent` ID recorded)| `Consent` created (`status: active`, v1.0 notice) | HTTP 403 upload gate unlocked | **PASS** |
| **20** | Upload synthetic specimen K03 | `POST /api/v1/kyc/upload` | 200 OK (`verdict: auto_approved`)| `KycCase` updated; 19 canonical checks evaluated | Status: `verified` | **PASS** |
| **21** | Manual document encrypted upload | `POST /api/v1/kyc/upload` | 200 OK (`documentId` issued) | Document written to disk as `.enc` via AES-256-GCM | Decryption SHA-256 verified | **PASS** |
| **22** | Complete simulated E-Sign attestation | `CheckoutPage.jsx` | User confirmation badge | Stored in checkout payload (`esignConfirmed: true`) | Attestation recorded in audit log | **PASS** |
| **23** | Execute simulated AutoPay checkout | `POST /api/v1/orders` | 201 Created (`ORD-20261107-4BB1BD`)| `Order` created in MongoDB linked to user & quote | Idempotent duplicate check passed | **PASS** |
| **24** | Open Order Tracker via UI | `GET /api/v1/orders/:id` | 200 OK (`status: KYC_ACTION_NEEDED`)| `Order.timeline` contains sequential milestones | Correct status retrieved from DB | **PASS** |
| **25** | Schedule technician installation slot | `POST /api/v1/orders/:id/slot` | 200 OK (`slotDate: 2026-11-15`)| `Order.installationSlot` persisted in MongoDB | 10:00 - 13:00 arrival window locked | **PASS** |
| **26** | Open "My Udyam" customer portal | `GET /api/v1/me/overview` | 200 OK (Active orders: 1, quotes: 1)| Aggregated read-back from all user collections | Matches real database state | **PASS** |
| **27** | Zero-order second account verification | `GET /api/v1/me/overview` | 200 OK (Orders: 0, quotes: 0) | Second fresh user sees truthful empty state | Zero cross-tenant data leakage | **PASS** |

---

## 2. Negative, Security & Concurrency Test Execution Matrix

| Test Case ID | Test Category | Target Subsystem | Execution Method / Payload | Expected Invariant | Measured Runtime Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **NEG-AUTH-01** | Auth Security | Staff Login | Password: `WrongPassword123!` | Reject with HTTP 401 `INVALID_CREDENTIALS` | 401 received; account not unlocked | **PASS** |
| **NEG-AUTH-02** | Token Security | JWT Refresh Rotation | Replay old refresh token | Reject with HTTP 401 `TOKEN_REUSE` & revoke family | 401 received; all tokens revoked | **PASS** |
| **NEG-AUTH-03** | Auth Guard | Access Token Validation| Tampered signature string | Reject with HTTP 401 `INVALID_TOKEN` | 401 received; request blocked | **PASS** |
| **NEG-OWNER-01**| IDOR Security | Cross-Owner Quote/Order | User B queries User A's order | Reject with HTTP 403 `FORBIDDEN` | 403 received; zero data leaked | **PASS** |
| **NEG-ADMIN-01**| RBAC Security | Backoffice Funnel API | Owner token on `/backoffice/funnel` | Reject with HTTP 403 `FORBIDDEN` | 403 received; staff gate intact | **PASS** |
| **NEG-QUOTE-01**| Input Validation| Quote ID Lookup | Non-existent ObjectId | Return HTTP 404 `NOT_FOUND` | 404 received; zero crash/leak | **PASS** |
| **NEG-QUOTE-02**| Error Handling | Order ID Lookup | Non-existent `ORD-999999` | Return HTTP 404 `NOT_FOUND` | 404 received safely | **PASS** |
| **NEG-QUOTE-03**| Idempotency | Quote Acceptance | Repeated acceptance calls | Return identical locked quote snapshot | 200 OK received idempotently | **PASS** |
| **NEG-QUOTE-04**| Immutability | Accepted Quote Tampering| Mutate line items post-accept | Reject with HTTP 409 `QUOTE_IMMUTABLE` | 409 received; price protected | **PASS** |
| **NEG-QUOTE-05**| Input Validation| Add-on Configuration | Negative quantity (`-5`) | Reject with HTTP 400 `BAD_REQUEST` | 400 received; invalid count blocked | **PASS** |
| **NEG-QUOTE-06**| Concurrency | Parallel Quote Locks | 10 simultaneous accept calls | All 10 resolve idempotently with zero price drift | 10/10 return 200 OK with same hash | **PASS** |
| **NEG-KYC-01** | Privacy Gate | Document Upload | Upload without active consent | Reject with HTTP 403 `CONSENT_REQUIRED` | 403 received; upload blocked | **PASS** |
| **NEG-KYC-02** | Privacy Gate | Upload After Withdrawal| Upload after consent revoke | Reject with HTTP 403 `CONSENT_REQUIRED` | 403 received; upload blocked | **PASS** |
| **NEG-KYC-03** | Relationship | Cross-User Quote/KYC | User B quote on User A KYC | Reject with HTTP 403 `FORBIDDEN` | 403 received; IDOR blocked | **PASS** |
| **NEG-KYC-04** | Security | Document Storage | Inspect raw file on disk | Raw document must be ciphertext (AES-256-GCM) | File has `.enc` extension, IV & tag | **PASS** |
| **NEG-KYC-05** | Integrity | Decryption Verification | Read `.enc` and decrypt with key | Decrypted plaintext matches original SHA-256 | SHA-256 checksum match verified | **PASS** |
| **NEG-ORDER-01**| Deduplication | Order Creation | 10 concurrent requests, same key | Exactly 1 order created in MongoDB; 0 duplicates | Exactly 1 order created (201 OK) | **PASS** |
| **NEG-ORDER-02**| Concurrency | Parallel Distinct Orders| 5 distinct checkout requests | Exactly 5 distinct orders created in MongoDB | 5 distinct order IDs created | **PASS** |
| **NEG-ORDER-03**| Input Validation| Missing Schema Fields | Request without `paymentMethod` | Reject with HTTP 400 `BAD_REQUEST` | 400 received; schema validated | **PASS** |
| **NEG-UI-01** | UX Robustness | Empty State Handling | New user dashboard inspection | Zero orders/quotes displayed accurately | Truthful empty state rendered | **PASS** |

---

## 3. Responsive Layout & Usability Verification Across 3 Viewports

Captured via `scripts/capture-all-screenshots.js` using headless Chromium across 11 core routes:
- **Mobile Viewport (375px $\times$ 812px):** 11 screens captured. Mobile drawer active; conversation chat cards stack vertically; touch targets $\ge 44\text{px}$; zero horizontal scrollbar overflow.
- **Tablet Viewport (768px $\times$ 1024px):** 11 screens captured. 3-tier quote cards adjust to readable 2-column grid; KYC uploader maintains accessible padding; responsive table wrappers on backoffice queues.
- **Desktop Viewport (1440px $\times$ 900px):** 11 screens captured. Full side-by-side business preview layout; executive command center displays 5-stage funnel with leak diagnostic badges.
- **Automated Overflow Assertion:** `document.documentElement.scrollWidth <= window.innerWidth + 2` evaluated across all 33 views: **0 overflow violations detected**.
