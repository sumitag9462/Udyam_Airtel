# Real vs Simulated Components

> [!IMPORTANT]
> This document lists every component in Udyam One and whether it is real or simulated. All simulated components are labelled in the UI and codebase.

| Component                   | Status                      | Notes                                                                           |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| **Product Catalogue**       | Real (synthetic data)       | Seeded from `product_catalogue.csv`; 25 products with real pricing logic        |
| **Lead Data**               | Real (synthetic data)       | 5,000 synthetic leads from `smb_leads.csv`; no real persons or companies        |
| **Rules Engine**            | Real                        | Deterministic eligibility, pricing, and bundle logic; no simulation             |
| **Advisor Chat**            | Real (with mock LLM option) | State machine is real; LLM provider can be Anthropic (real) or Mock (simulated) |
| **Response Guard**          | Real                        | Validates LLM output; blocks prices, product codes, and percentages             |
| **Quote Engine**            | Real                        | Server-side pricing from catalogue; immutable on acceptance                     |
| **GSTIN Registry**          | Simulated                   | `mock_gstin_registry.csv`; labelled "simulated registry lookup"                 |
| **Udyam Registry**          | Simulated                   | `mock_udyam_registry.csv`; labelled "simulated registry lookup"                 |
| **GSTIN/Udyam Validation**  | Real                        | Format regex and checksum are production-grade                                  |
| **OCR Extraction**          | Real (limited)              | tesseract.js with eng+hin; accuracy varies and is honestly reported             |
| **KYC Checks**              | Real (logic)                | Check matrix is production-grade; data sources are simulated                    |
| **KYC Human Review**        | Real (workflow)             | Queue and decision flow are real; reviewers are demo accounts                   |
| **OTP Authentication**      | Simulated                   | Codes appear in dev outbox; labelled "simulated OTP"                            |
| **DigiLocker Integration**  | Simulated                   | Returns pre-extracted fields; labelled "Simulated DigiLocker"                   |
| **E-Sign**                  | Simulated                   | OTP-based confirmation; labelled "Simulated e-sign, no legal effect"            |
| **Payment Processing**      | Simulated                   | Deterministic outcomes; labelled "simulated payment"                            |
| **Feasibility Check**       | Simulated                   | Hash-based ~7% failure rate; labelled "simulated feasibility"                   |
| **Installation Scheduling** | Simulated                   | Three slots per order; labelled "simulated scheduling"                          |
| **Order Tracker**           | Real (workflow)             | State machine is real; progression is simulated via `trackerSimulator`          |
| **Notifications**           | Simulated                   | Written to outbox collection; labelled `simulated: true`                        |
| **WhatsApp Integration**    | Stub only                   | Behind `FEATURE_WHATSAPP` flag (off by default); documented as future work      |
| **Voice Integration**       | Stub only                   | Behind `FEATURE_VOICE` flag (off by default); documented as future work         |
| **Propensity Score**        | Real (model)                | Logistic regression on synthetic data; AUC honestly reported                    |
| **Metrics Dashboard**       | Real                        | Historical metrics from seeded data; live metrics from first-party events       |
| **File Encryption**         | Real                        | AES-256-GCM at rest; production would use KMS                                   |
| **Consent Management**      | Real                        | Versioned notice, explicit consent, withdrawal, deletion                        |
| **Audit Logging**           | Real                        | All actions logged with masked PII                                              |
| **Rate Limiting**           | Real                        | Production-grade limits per endpoint                                            |
| **RBAC**                    | Real                        | Role and object-level access control                                            |
