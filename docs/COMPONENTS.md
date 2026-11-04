# Accessible Component Inventory & Design Tokens

> [!NOTE]
> Project Udyam Digital · Udyam One (Airtel SYNC 2026 Track A)
> Technical inventory of accessible UI components, design tokens, and WCAG 2.1 AA compliance mechanisms.

---

## 1. Design Tokens & Color Palette

The interface adheres to Airtel Business brand standards while ensuring strict **WCAG 2.1 AA** contrast compliance (contrast ratio $\ge 4.5:1$ for normal body text, $\ge 3:1$ for large headings and UI borders):

### Color Palette
- **Airtel Brand Red:** `#E40000` (Used for primary buttons, active badges, and brand identity).
- **Dark Red Hover:** `#B80000` (Hover and focused active state).
- **Backgrounds:**
  - Page Canvas: `#F8FAFC` (Slate 50)
  - Card & Container Surface: `#FFFFFF` (Pure White)
  - Dark Header / Accents: `#0F172A` (Slate 900)
- **Typography Neutrals:**
  - Primary Text: `#0F172A` (Slate 900, contrast 16.5:1 against white)
  - Secondary Text: `#475569` (Slate 600, contrast 5.8:1 against white)
  - Subdued / Borders: `#CBD5E1` (Slate 300)
- **Status & Feedback Indicators:**
  - Verification Success: `#059669` (Emerald 600) / Background `#ECFDF5`
  - Review / Warning: `#D97706` (Amber 600) / Background `#FFFBEB`
  - Critical / Halt: `#DC2626` (Red 600) / Background `#FEF2F2`
  - Informational / Telemetry: `#2563EB` (Blue 600) / Background `#EFF6FF`

### Typography
- **Latin Character Set:** Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto.
- **Devanagari (Hindi Character Set):** `Noto Sans Devanagari`, sans-serif (ensuring crisp legibility of conjunct consonants and vowel signs across all screen sizes).

---

## 2. Component Inventory

### Global Navigation & Shell
- `Navbar.jsx`: Responsive sticky navigation bar with brand badge, desktop links, mobile drawer, language toggle (`EN` | `HI`), and DPDP Privacy shortcut. Keyboard operable via `Tab` with visible focus rings.
- `Footer.jsx`: Institutional footer displaying Project Udyam Digital attribution, links to statutory notices (`/privacy`, `/terms`, `/grievance`), and clear labeling of simulated elements.
- `ErrorBoundary.jsx`: Top-level React error boundary providing a user-friendly recovery view with a "Try Again" button if an unhandled rendering error occurs.

### Conversational Onboarding (Advisor)
- `AdvisorChat.jsx`: Mobile-first conversational agent. Features:
  - Message bubble stream with role distinction (Assistant vs User).
  - Quick action suggestion chips (`Law office in Delhi`, `Kirana store`, `Clinic in Jaipur`).
  - Strict placeholder rendering (all monetary amounts substituted from server rules engine).
  - Deterministic fallback toggle when user prefers structured questionnaire form.

### Pricing & Quote Configuration
- `TierCards.jsx`: 3-card bundle selector (`Starter`, `Standard`, `Resilient`). Implements radio-group semantics with keyboard arrow navigation. Displays monthly total, setup fees, and included bandwidth.
- `QuoteConfigurator.jsx`: Interactive item table allowing owners to toggle add-on products (Static IP, Cloud Backup, Secure Wi-Fi) with numeric steppers bounded by catalogue min/max constraints.
- `BusinessPreview.jsx`: Real-time stress-testing widget allowing SMBs to simulate business peak hours (e.g. 5 cashiers, 12 concurrent video consultations) and observe bandwidth headroom.
- `QuoteAcceptModal.jsx`: Mandatory confirmation dialog with price-lock guarantee and legal contract terms acknowledgment before generating an immutable quote hash.

### Smart KYC & Compliance
- `ConsentNotice.jsx`: DPDP Act 2023 versioned consent screen (Notice v1.0.0). Explains purpose limitation and data minimisation with explicit opt-in checkboxes before document upload is enabled.
- `KycUploader.jsx`: Secure document upload component with:
  - Client-side Sharp image quality / blur pre-checks.
  - 12-specimen testbench for instant judge demonstration (K01–K12).
  - Upload progress bars and AES-256-GCM encryption badges.
- `CheckListModal.jsx`: Detailed diagnostic drawer inspecting the status of all 19 regulated verification checks (C01–C19), severity levels, and matched registry fields.
- `KycStatusCard.jsx`: Real-time verification badge honestly stating case disposition (`Auto-Verified`, `Under Officer Review`, or `Action Required`).

### Delivery & Order Tracking
- `OrderTimeline.jsx`: Vertical delivery stepper tracking 5 sequential stages (`Feasibility Check`, `Optical Telemetry`, `Premises Cabling`, `CPE Installation`, `Service Activated`).
- `SlotPicker.jsx`: Accessible appointment scheduler offering morning, afternoon, and evening technician visit slots across the next 5 business days.
- `SimulateAdvanceControl.jsx`: Dedicated demo fast-forward control allowing judges to progress orders through the delivery lifecycle in real time.
- `HelpModal.jsx`: Proactive callback and support request modal automatically bundling current order context and network telemetry.

### Back-Office & Analytics
- `FunnelChart.jsx`: Recharts-powered cumulative funnel bar chart reproducing the 5,000-lead cohort metrics (5,000 $\to$ 3,406 $\to$ 1,974 $\to$ 861 $\to$ 588 $\to$ 368 = 7.36%).
- `UnclosedLeadsTable.jsx`: Sortable, filterable queue of unclosed leads with ML propensity percentage badges, top positive/negative driver tags, and advisor action buttons.
- `CommercialCards.jsx`: Executive summary cards displaying segment unit economics, channel conversion rates, and revenue recovery opportunities.
