# UI Root Cause Audit & Defect Resolution Matrix

**Project:** Airtel SYNC 2026 · Project Udyam Digital (Track A)  
**Date:** 5 November 2026  
**Auditor:** Principal Full-Stack & Systems Reliability Lead  
**Scope:** Observable defect reproduction, root cause determination, minimal patches, and real browser verification.

---

## 1. Six-Screenshot Defect Investigation Matrix

| # | Route | Direct Observation | Suspected Causes Tested | Confirmed Root Cause | Minimal Patch Applied | Verification Test | Status |
|---|---|---|---|---|---|---|---|
| **1** | `/` (Landing) | Narrow small text block (480px) on 1440px desktop, giant unused space, weak hierarchy, missing global navigation / footer. | 1. Missing responsive container.<br>2. Hardcoded mobile-only container on desktop.<br>3. CSS override bug. | **Hardcoded `container-mobile max-w-mobile`**: Landing was constrained to 480px width across all breakpoints with no Navbar or Footer. | Upgraded `Landing.jsx` with full responsive container (`max-w-6xl`), `Navbar`, 4-step clear value cards, trust highlights, and `Footer`. | Screenshots captured at 375px, 768px, and 1440px in `docs/screenshots/01_landing_*.png`. | **FIXED** |
| **2** | `/advisor` (Initial) | Huge empty chat space, tiny status, quick replies clipped horizontally, `Skip to Quote` available before profile completion. | 1. Flexbox overflow bug.<br>2. Premature quote navigation.<br>3. Horizontal scroll missing. | **Unbounded single-column viewport and missing desktop layout**: Quick reply chips overflowed without proper wrap; `Skip to Quote` navigated without warning. | Added two-column layout on desktop with Live Business Profile summary; added overflow scrolling on chips; changed CTA to `Set up my quote →`. | Captured `docs/screenshots/advisor_hello_1440px.png` and responsive breakpoints. | **FIXED** |
| **3** | `/quotes` | `No recommended tiers available for this profile.` with no explanation, action, or fallback. | 1. API proxy failure returning HTML.<br>2. Rules engine shortfall.<br>3. Lost profile on router transition. | **Two compounding issues**: (a) Static client container returned SPA `index.html` string which parsed as empty tiers; (b) Direct visitors saw an inert dead-end wall without recovery action. | Configured `client/src/api/client.js` dynamic API base resolution; updated `TierCards.jsx` to render actionable guided recovery card with `Start Guided Setup →`. | Playwright verified on both warm and incognito contexts (`verify_milestone1.js`). | **FIXED** |
| **4** | `/login` (Owner) | Phone number filled but `Get OTP` button visually grey and disabled-looking; dev outbox details visible. | 1. Form validation logic.<br>2. Contrast / styling ambiguity.<br>3. Event handler race condition. | **Subtle styling contrast**: `.btn-primary` used `bg-primary` (black) with `opacity-50`, making active state indistinct. Also hardcoded post-OTP destination to `/quotes` without preserving `returnTo`. | Explicit active state (`bg-airtel-red text-white hover:bg-dark-red shadow-sm`) vs disabled (`bg-gray-200 text-gray-400`); preserved `location.state.from`. | Playwright verified: disabled before 10 digits (`true`), disabled after 10 digits (`false`), red background verified. | **FIXED** |
| **5** | `/staff/login` | Grey disabled-looking staff sign-in button; demo credentials displayed. | 1. Disabled state logic.<br>2. Missing credentials gating. | **Styling ambiguity**: `btn-primary` disabled contrast was low; demo credentials box was static. | Added explicit high-contrast active button styling; gated demo credentials helper. | Verified role-based navigation and staff login flow. | **FIXED** |
| **6** | `/advisor` (After input) | `hlo`, `ho`, `hello` appear as user messages followed by **tiny blank assistant bubbles**. | 1. LLM provider returning empty string.<br>2. Response guard stripping text.<br>3. SPA fallback returning HTML.<br>4. 401 Unauthorized blocking guests.<br>5. Zod schema rejecting null conversationId. | **Triple compounding root cause**: (a) `client.js` requested `localhost:5173/api/v1` returning HTML string; (b) Express `advisor.js` required auth for `/chat` returning 401; (c) Zod rejected `{ conversationId: null }` with 400. In all cases, React rendered `res.reply` which was `undefined`, resulting in empty bubbles. | 1. Updated `client/src/api/client.js` to target port 3001 and reject HTML.<br>2. Switched `/advisor/chat` to `optionalAuth`.<br>3. Made `Conversation.userId` optional.<br>4. Updated Zod schema to `z.string().nullish()`.<br>5. Guarded `assistantMsg.text` against undefined. | Playwright verified in real browser: `hello` returns nonempty greeting, 14-person law office returns 3 golden tiers inline. | **FIXED** |

---

## 2. API & Network Traceability Log

### R1: `POST /api/v1/advisor/chat` (Guest Greeting)
- **Request:**
  ```json
  { "conversationId": null, "message": "hello", "language": "en" }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "conversationId": "6aec364c32b5cb575f54a389",
      "reply": "Welcome to Airtel Udyam One. What type of business do you operate, and in which city are you located?",
      "state": "BUSINESS_PROFILE",
      "questionCount": 1,
      "profile": { "mustHaves": [] },
      "tiers": null,
      "handoffRequested": false
    }
  }
  ```
- **DOM Result:** Assistant message rendered visibly: `"Welcome to Airtel Udyam One. What type of business do you operate, and in which city are you located?"`.

### R2: `POST /api/v1/advisor/chat` (14-Person Law Office Golden Input)
- **Request:**
  ```json
  {
    "conversationId": "6aec364c32b5cb575f54a389",
    "message": "We have a law office in Delhi with 14 employees and one location. We need business internet, email and cloud backup. Our maximum budget is ₹5,000 per month.",
    "language": "en"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "conversationId": "6aec364c32b5cb575f54a389",
      "reply": "Based on your business requirements, I have calculated 3 tailored plans: Starter at ₹3,248/month, Standard at ₹4,634/month, and Resilient at ₹5,133/month. You can select any tier or customize add-ons to proceed.",
      "state": "REGISTRATION_STATUS",
      "questionCount": 2,
      "profile": {
        "businessType": "CA / Law office",
        "segment": "prof",
        "employeeCount": 14,
        "numSites": 1,
        "city": "Delhi",
        "cityTier": 1,
        "budgetMonthly": 5000,
        "mustHaves": ["cloud_backup", "email"]
      },
      "tiers": [
        {
          "tierLabel": "starter",
          "name": "Starter",
          "monthlyTotal": 3248,
          "setupTotal": 0,
          "firstYearTotal": 38976
        },
        {
          "tierLabel": "standard",
          "name": "Standard",
          "monthlyTotal": 4634,
          "setupTotal": 0,
          "firstYearTotal": 55608
        },
        {
          "tierLabel": "resilient",
          "name": "Resilient",
          "monthlyTotal": 5133,
          "setupTotal": 1500,
          "firstYearTotal": 63096
        }
      ]
    }
  }
  ```
- **DOM Result:** Inline tier cards rendered; clicking `Select Plan →` navigates to `/quotes` with profile and Standard tier loaded.

---

## 3. Test Suite Reproducibility Summary

1. **Jest Unit & Integration Suite (`npm test --workspace=server`):**
   - **Test Suites:** 15 passed, 15 total
   - **Tests:** 177 passed, 177 total
   - **Duration:** 9.262 s
2. **Advisor Scenarios Suite (`npm run test:advisor`):**
   - **Test Suites:** 1 passed, 1 total
   - **Tests:** 31 passed, 31 total (including all 25 scripted scenarios and adversarial guards)
   - **Duration:** 1.235 s
3. **Playwright E2E Suite (`npm run test:e2e`):**
   - **Tests:** 6 passed, 6 total (Journeys 1 to 6)
   - **Duration:** 5.6 s
4. **Business & Financial Verification (`npm run test:business`):**
   - **Assertions:** 15 passed, 15 total (verifying 5,000 leads, 7.36% activation, 4 leaks, CAC ₹15,053, and ₹15.2M ARR)
5. **Data Seed Verification (`npm run seed:verify`):**
   - **Assertions:** 39 passed, 39 total (verifying 25 products, 5,000 leads, 3,534 GSTINs, 2,723 Udyam numbers)
6. **Milestone 1 Live Browser Verification (`node scripts/verify_milestone1.js`):**
   - **Checks:** 6 passed, 6 total
   - Real browser interaction against `http://localhost:5173` and Express port 3001.

---

## 4. Current Status & GO/NO-GO Recommendation

- **Milestone 1 (P0-01, P0-02, P0-03):** **PASSED**
- **Six User Screenshot Defects:** **ALL RESOLVED & AUDITED**
- **Pre-Release Engineering Gates:** **PASSED**
- **Recommendation:** **READY FOR FINAL USER REVIEW & COMMIT APPROVAL** (No commits or pushes executed per user policy).
