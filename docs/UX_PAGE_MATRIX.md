# UX Page Matrix & Route Specification

> [!NOTE]
> Project Udyam Digital · Udyam One (Airtel SYNC 2026 Track A)
> Comprehensive inventory of client application routes, authorized roles, primary call-to-actions, and error/empty states.

---

## Complete Route Matrix

| Route Path | Page Component | Allowed Roles | Primary CTA | Empty State / Edge State | Error State Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `Landing.jsx` | Public (`*`) | "Get Started with AI Advisor" | Default hero presentation with 3-step value overview | Fallback to offline static guide if server down |
| `/home` | `HomePage.jsx` | `owner`, `advisor`, `admin` | Dynamic: Next Incomplete Action (e.g. "Review Quote", "Complete KYC") | "No active quote yet" card prompting user to explore solutions | Dismissible alert banner with retry CTA |
| `/login` | `Login.jsx` | Public (`*`) | "Send OTP" / "Staff Sign In" | Clean dual-tab interface (Owner OTP vs Staff Login) | Rate limit cooldown timer, invalid OTP feedback |
| `/advisor`, `/chat` | `AdvisorPage.jsx` | Public (`*`), `owner` | "Get Quote" / Send Message | Welcome prompt in selected language (Hindi/English) | Deterministic fallback form if LLM unavailable |
| `/quotes` | `QuotePage.jsx` | Public (`*`), `owner` | "Accept Quote →" | Evaluates default profile bundles if no active quote | Non-eligible combination alert with explanation |
| `/quotes/:id` | `QuotePage.jsx` | Public (`*`), `owner` | "Accept Quote →" | Loads quote by ID; locks if already accepted | 404 Not Found if quote ID invalid or expired |
| `/kyc` | `KycPage.jsx` | `owner` | "Submit Verification Documents" | "Consent Required" gate blocking document upload | 403 Forbidden alert if consent not granted; blur re-upload prompt |
| `/tracker` | `TrackerPage.jsx` | `owner`, `advisor`, `admin` | "Schedule Installation Slot" | "No Active Orders Found" card with "Browse Quotes" link | "Failed to load order" with reload button |
| `/orders/:id` | `TrackerPage.jsx` | `owner`, `advisor`, `admin` | "Advance Stage (Demo)" / "Need Help?" | Loads order by ID directly | 404 Not Found or Access Denied banner |
| `/backoffice` | `BackOfficeDashboard.jsx` | `advisor`, `compliance_officer`, `admin` | "Contact Lead" / "View Funnel" | "No unclosed leads matching filter criteria" | 403 Forbidden redirect if attempted by non-staff |
| `/backoffice/kyc-queue`| `KycReviewPage.jsx` | `compliance_officer`, `admin` | "Approve Case" / "Reject with Reason" | "All caught up! Zero cases awaiting human review." | 403 Forbidden redirect for unauthorized roles |
| `/account`, `/account/privacy` | `PrivacyCentrePage.jsx` | `owner` | "Download Data Package" / "Withdraw Consent" | Displays active consent counts and masked profile | Deletion request failure or network error banner |
| `/help`, `/faq` | `HelpFaqPage.jsx` | Public (`*`) | "File Grievance →" | "No matching questions found" search empty state | Offline fallback FAQ cache |
| `/how-it-works` | `HowItWorksPage.jsx`| Public (`*`) | "Start with AI Advisor" | Static explanatory diagrams and step breakdown | Standard error boundary fallback |
| `/privacy`, `/terms`| `PrivacyPolicyPage.jsx`| Public (`*`) | "Open Privacy Centre" | Comprehensive 1-page statutory notice | Standard error boundary fallback |
| `/grievance` | `GrievancePage.jsx` | Public (`*`), `owner` | "Submit Grievance to DPO" | Clean multi-field statutory submission form | Field validation errors (minimum 10 chars description) |
| `*` | `NotFound.jsx` | Public (`*`) | "Return to Homepage" | 404 Illustration with quick links to Home and Advisor | N/A |

---

## Role-Based Route Protection (RBAC)

- **Public Routes:** `/`, `/login`, `/advisor`, `/chat`, `/quotes`, `/help`, `/how-it-works`, `/privacy`, `/terms`, `/grievance`.
- **Owner Protected:** `/home`, `/kyc`, `/tracker`, `/account`, `/account/privacy` (redirects to `/login?redirect=...` if session absent).
- **Staff Protected:** `/backoffice`, `/backoffice/kyc-queue` (requires JWT with role in `['advisor', 'compliance_officer', 'admin']`; returns 403 if accessed by `owner`).

---

## Accessibility (WCAG 2.1 AA) Guarantees

1. **Keyboard Navigation:** Every interactive button, modal, form input, and dropdown is reachable via `Tab` and activatable via `Enter` / `Space`.
2. **Focus Management:** Modals (Quote Acceptance, Deletion Confirmation, Help Request) trap keyboard focus while open and return focus to the trigger button upon closing.
3. **Screen Readers:** All non-text content carries `aria-label` or `alt` text; dynamic loading states announce via `aria-live="polite"`.
4. **Contrast Tokens:** Minimum text contrast ratio of **4.5:1** maintained across all foreground text and backgrounds (Airtel Red `#E40000` on white meets AAA compliance on large titles).
