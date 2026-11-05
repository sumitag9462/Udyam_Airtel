# Udyam One — UI/UX Root Cause & Defect Fix Audit

**Project:** Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)<br/>
**Status:** All 6 Observed Regressions Repaired & Verified<br/>

---

## 1. Defect Inventory & Measured Resolutions

### Defect 1: Blank Assistant Chat Bubbles on Common Greetings
* **Observed Symptom:** Visitor entered `"hlo"`, `"ho"`, `"hello"`; user bubble appeared, but the assistant bubble was blank or rendered an empty container.
* **Root Cause:**
  1. Frontend API client was bypassing the Vite `/api` proxy in dev mode when port was `5173`, triggering cross-origin issues or HTML error responses.
  2. Backend conversation schema rejected `conversationId: null` on uninitialized guest chats.
  3. `MockProvider` had not mapped informal English greetings (`hlo`, `ho`) to the initial discovery state.
* **Resolution:**
  - Standardized `getApiBase()` to `/api/v1` through the local Vite proxy.
  - Allowed `nullish` `conversationId` and auto-generated high-entropy guest `sessionSecret`.
  - Added robust regex handling for English, Hindi, and colloquial greetings (`hlo`, `ho`, `hello`, `namaste`, `नमस्ते`).
  - Added deterministic fallback copy preventing any empty string from ever rendering.

---

### Defect 2: "No Recommended Tiers Available" Dead-End Screen
* **Observed Symptom:** Direct navigation to `/quotes` without an active session rendered an empty, inert container stating "No recommended tiers available for this profile".
* **Root Cause:**
  - When query cache was empty and no profile was stored in `sessionStorage`, `fetchBundles` received an uninitialized profile object.
* **Resolution:**
  - Implemented an approachable uninitialized profile state with "Start Guided Setup →" linking to `/advisor` and "Explore Standard Plans" linking to baseline catalogue recommendations.
  - Added fallback default profile resolution ensuring valid line items are always computed if requested.

---

### Defect 3: Over-Budget Tier Recommendation Discrepancy
* **Observed Symptom:** Quotes silently recommended plans above the visitor's specified ₹5,000 budget, or changed the base Starter price without itemizing requested add-ons.
* **Root Cause:**
  - The rules engine correctly computed Resilient at ₹5,133/month, but the UI card lacked visual badges indicating that it exceeded the user's ₹5,000 monthly limit.
* **Resolution:**
  - Added explicit visual badges (`+₹133/mo over budget` in amber vs `Within budget` in emerald).
  - Clarified itemization: Starter base is ₹2,749/month; when requested 1TB Cloud Backup (P17, ₹499) is included, the total is transparently displayed as ₹3,248/month with an itemized breakdown.

---

### Defect 4: Loss of Guest Quote State on Login / OTP
* **Observed Symptom:** A visitor configured custom add-ons as a guest, clicked "Accept Plan", was redirected to `/login`, and after OTP verification lost their custom selections.
* **Root Cause:**
  - Login flow cleared temporary state and redirected to `/quotes` with a fresh draft quote rather than restoring the pending customized line items.
* **Resolution:**
  - Added `POST /api/v1/rules/compute`, `POST /api/v1/rules/preview`, and `POST /api/v1/rules/explain` enabling live server-calculated configuration for guests.
  - Stored guest selections in `udyam_pending_quote_accept` in `sessionStorage`.
  - On OTP verification, automatically created the quote in the database and restored customized line items without data loss.

---

### Defect 5: Conversation Wipeout on Page Reload
* **Observed Symptom:** Reloading the `/advisor` page reset the entire message stream to the initial welcome greeting.
* **Root Cause:**
  - `AdvisorChat.jsx` had a `useEffect([i18n.language])` hook that unconditionally called `setMessages([welcome])` on mount.
  - `GET /advisor/conversations/:id` required full JWT auth, denying guest sessions.
* **Resolution:**
  - Restored messages from `sessionStorage.getItem('udyam_advisor_messages')`.
  - Updated `backend/src/routes/advisor.js` to support `optionalAuth` with cryptographic `X-Session-Secret` ownership verification so guests can restore their own conversation across reloads with complete tenant isolation.
  - Added a dedicated "Reset" button for users wanting to start fresh intentionally.

---

### Defect 6: Partner Task Overflow & Mobile Unresponsiveness
* **Observed Symptom:** Partner dashboard displayed fixed desktop 3-column layouts that overflowed horizontally on mobile screens (375px width).
* **Root Cause:**
  - Rigid grid structures without responsive breakpoints (`grid-cols-3` without `grid-cols-1 md:grid-cols-3`).
* **Resolution:**
  - Refactored partner dashboard and quote configurator to responsive fluid columns (`grid-cols-1 md:grid-cols-3` and flex wrapping).
  - Verified touch targets >= 44px on viewports at 375px, 768px, and 1440px.
