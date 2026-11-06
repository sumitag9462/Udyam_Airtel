# UDYAM ONE — MASTER BUG REGISTER & REMEDIATION LOG

**Airtel SYNC 2026 · Digital Track A (Project Udyam Digital)**  
*Authoritative Defect Tracking, Root Cause Analysis & Regression Verification*

---

## 1. Summary Defect Metrics

* **Total Bugs Tracked:** 7
* **Critical Blockers:** 1 (Resolved)
* **High Severity:** 3 (Resolved)
* **Medium Severity:** 3 (Resolved)
* **Current Open Defects:** 0
* **Regression Test Status:** 100% Passing (15 Jest Suites / 177 Tests, 6 Playwright Journeys)

---

## 2. Detailed Bug Log

### BUG-001: `/orders/ORD-NEW` Placeholder Route & 404 Order Not Found
* **Severity:** Critical (Customer Journey Blocker)
* **Roadmap Phase:** Phase 4 (Checkout & Provisioning Order Management)
* **Affected Modules:** `frontend/src/pages/CheckoutPage.jsx`, `frontend/src/pages/TrackerPage.jsx`
* **Root Cause:** In `frontend/src/api/client.js`, `apiRequest` automatically unwraps `body.data` (`return body?.data !== undefined ? body.data : body`). The endpoint `POST /orders` returns `{ ok: true, data: order }`. Consequently, `apiRequest` returns the `order` object directly. In `CheckoutPage.jsx`, the redirect code attempted to read `orderRes.data?.order?._id || 'ORD-NEW'`. Since `orderRes.data` was `undefined`, it evaluated to `'ORD-NEW'` on every submission, navigating to `/orders/ORD-NEW` where `getOrder('ORD-NEW')` returned a 404 error.
* **Reproduction Steps:**
  1. Accept any quote on `/quotes`.
  2. Complete Smart KYC verification on `/kyc`.
  3. Proceed to `/checkout/:quoteId`.
  4. Fill in authorized signatory name and click "Sign Contract & Authorize Payment".
  5. Browser navigated to `http://localhost:5173/orders/ORD-NEW` and displayed "No Active Orders Found / Order Not Found".
* **Remediation Applied:**
  * Refactored `CheckoutPage.jsx` to resolve the genuine order identifier:
    ```javascript
    const realOrderId = orderRes?.orderId || orderRes?._id || orderRes?.data?.orderId || orderRes?.data?._id;
    navigate(`/orders/${realOrderId}`);
    ```
  * Hardened `TrackerPage.jsx` to intercept legacy `'ORD-NEW'` bookmarks and query active user orders via `listOrders()`.
* **Regression Verification:** Automated via `scripts/verify-full-journeys.js` (Step 2) and Playwright Journey 1.
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>

---

### BUG-002: Pricing and GST Discrepancy on Checkout Screen (₹8,418 vs. ₹7,134)
* **Severity:** High (Commercial Calculation & Transparency Defect)
* **Roadmap Phase:** Phase 4 (Checkout & Provisioning Order Management)
* **Affected Modules:** `frontend/src/pages/CheckoutPage.jsx`
* **Root Cause:** The Order Summary calculated Due Today as:
  $$\text{Subtotal} = \text{Monthly Recurring (₹4,634)} + \text{Installation Setup (₹2,500)} = \text{₹7,134}$$
  $$\text{GST (18\%)} = \text{₹7,134} \times 0.18 = \text{₹1,284}$$
  $$\text{Due Today} = \text{₹8,418}$$
  However, the checkout authorization button evaluated only `((quote?.monthlyTotal || 0) + (quote?.oneTimeSetup || 0))`, omitting the 18% GST and displaying ₹7,134.
* **Reproduction Steps:**
  1. Navigate to `/checkout/:quoteId`.
  2. Compare the displayed Order Summary total (₹8,418) with the payment button text (₹7,134).
* **Remediation Applied:**
  * Standardized dynamic pricing computation across the entire component:
    ```javascript
    const recurringMonthly = quote?.monthlyTotal || 0;
    const oneTimeSetup = quote?.setupTotal ?? quote?.oneTimeSetup ?? 0;
    const subtotal = recurringMonthly + oneTimeSetup;
    const gst = Math.round(subtotal * 0.18);
    const dueToday = subtotal + gst;
    ```
  * Both the Order Summary and the Authorize Payment button now display `₹{dueToday.toLocaleString('en-IN')}` (**₹8,418**).
* **Regression Verification:** Verified via `tests/api/quotes.test.js` and visual checkout inspection.
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>

---

### BUG-003: Quote Data Unwrapping Failure in Checkout Causing Hardcoded Fallback
* **Severity:** High (Data Pipeline Continuity)
* **Roadmap Phase:** Phase 4 (Checkout & Provisioning Order Management)
* **Affected Modules:** `frontend/src/pages/CheckoutPage.jsx`
* **Root Cause:** In `loadQuote`, the code verified `if (res.ok && res.data?.quote)`. Because `apiRequest` unwraps `body.data`, `res` was `{ quote: {...} }`, meaning `res.ok` was `undefined`. This caused `loadQuote` to always drop into the dummy fallback object with hardcoded values (₹4,634 monthly / ₹2,500 setup).
* **Reproduction Steps:** Pass any custom quote ID from MongoDB to `/checkout/:quoteId` -> verify whether custom quote line items load or dummy fallback loads.
* **Remediation Applied:** Updated `loadQuote` to handle both unwrapped and wrapped structures:
  ```javascript
  const loadedQuote = res?.quote || res?.data?.quote || (res?._id || res?.quoteId ? res : null);
  ```
* **Regression Verification:** Verified via full customer journey integration test.
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>

---

### BUG-004: Silent Error Suppression on Payment Authorization Failure
* **Severity:** Medium (Statutory Honesty & Rule 7/9 Violation)
* **Roadmap Phase:** Phase 4 (Checkout & Provisioning Order Management)
* **Affected Modules:** `frontend/src/pages/CheckoutPage.jsx`
* **Root Cause:** The `catch` block in `handleProcessPayment` swallowed API rejections and pretended payment succeeded, redirecting to `/tracker`.
* **Reproduction Steps:** Trigger an order creation failure (e.g., missing network or backend error) -> observed fake success transition.
* **Remediation Applied:** Refactored `catch (err)` to set `setPaymentProcessing(false)`, `setPaymentFailed(true)`, and display `setError(err.message)`, enabling the one-click instant recovery retry flow.
* **Regression Verification:** Tested with Drop Reason #28 simulation.
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>

---

### BUG-005: Missing Benchmark Applicants in UI Dropdown (Only 8 of 12 Selectable)
* **Severity:** Medium (Compliance & Jury Edge-Case Coverage)
* **Roadmap Phase:** Phase 3 (Smart KYC & DPDP Compliance)
* **Affected Modules:** `frontend/src/features/kyc/KycUploader.jsx`
* **Root Cause:** `DEMO_SPECIMENS` in `KycUploader.jsx` only included 8 hardcoded applicants (`K01`, `K03`, `K04`, `K05`, `K06`, `K07`, `K11`, `K12`), omitting `K02`, `K08`, `K09`, and `K10` despite full backend ground-truth support in `data/kyc_documents`.
* **Reproduction Steps:** Open KYC document uploader -> inspect benchmark dropdown options.
* **Remediation Applied:** Expanded `DEMO_SPECIMENS` to encompass all 12 applicants (K01–K12) with their respective business names, planted conditions, and ground-truth verdicts.
* **Regression Verification:** Automated via `backend/tests/kyc/kyc.test.js` (22 tests pass across all 12 applicants).
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>

---

### BUG-006: Context Loss of `quoteId` on Direct Visits or Refreshes to `/kyc`
* **Severity:** Medium (UX Navigation Continuity)
* **Roadmap Phase:** Phase 3 (Smart KYC & DPDP Compliance)
* **Affected Modules:** `frontend/src/pages/KycPage.jsx`, `frontend/src/features/quotes/QuoteAcceptModal.jsx`
* **Root Cause:** If a user reloaded `/kyc` without the search parameter, `quoteId` was lost, altering the CTA button from "Proceed to E-Sign & Checkout" to "Track Order".
* **Remediation Applied:** Stored and retrieved `quoteId` in `sessionStorage` (`udyam_last_quote_id`) across modal acceptance and KYC page lifecycle.
* **Regression Verification:** Verified via browser page refresh test on `/kyc`.
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>

---

### BUG-007: Partner Tasks API Unwrapping Failure Defaulting to Static Dummy Queue
* **Severity:** High (Field Force Integration Defect)
* **Roadmap Phase:** Phase 5 (Back-Office Command Center & Partner Portal)
* **Affected Modules:** `frontend/src/pages/PartnerDashboard.jsx`, `backend/src/routes/partner.js`, `backend/src/models/Order.js`
* **Root Cause:** `apiRequest('/partner/tasks')` returns `{ tasks, total }`. `PartnerDashboard.jsx` checked `if (res.ok && res.data?.tasks?.length)`. Since `res.ok` was `undefined`, it always dropped to 3 static demo tasks instead of loading real field installation orders from MongoDB. Additionally, `partner.js` looked up `orderNumber` instead of `orderId`.
* **Reproduction Steps:** Navigate to `/partner` -> check if real newly created orders from checkout appear in the technician task list.
* **Remediation Applied:**
  * In `PartnerDashboard.jsx`, unwrap `const loadedTasks = res?.tasks || res?.data?.tasks || (Array.isArray(res) ? res : null);`.
  * In `partner.js`, resolve `findOrderByIdOrTaskId` by both `orderId` and `orderNumber`.
  * Added `telemetry` and `history` sub-schemas to `backend/src/models/Order.js`.
* **Regression Verification:** Automated via `scripts/verify-full-journeys.js` (Step 4: 36 field tasks loaded and updated to ACTIVATED).
* **Status:** <span style="color:green;font-weight:bold;">VERIFIED & RESOLVED</span>
