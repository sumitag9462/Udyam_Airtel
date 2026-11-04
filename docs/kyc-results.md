# Smart KYC Verification: Performance Report & Benchmark Results

This report provides the measured results of the Udyam One Smart KYC engine across all 12 challenge test applicant packages (`K01` to `K12`), consisting of 47 individual documents evaluated against the 19 canonical regulated verification checks (C01–C19) defined in **Section 11.4** and **Section 42** of the specification.

- **Benchmark Reference Date**: `2026-07-15` (`KYC_REFERENCE_DATE`)  
- **Freshness Window**: 90 days (Earliest valid bill date: `2026-04-16`)
- **Total Test Cases**: 12 applicants / 47 documents
- **Automated Test Suite**: `tests/kyc/kyc.test.js` (Executed and passing in 1.4s)

---

## 1. Test Results by Applicant

| Applicant | Business Name | Constitution | Planted Defect | Failed Checks | Measured Verdict | Expected Verdict | Status |
|:---:|:---|:---|:---|:---:|:---:|:---:|:---:|
| **K01** | Vindhya Tours & Travels | Proprietorship | Cancelled GSTIN in mock registry (`37IHKXV5167L1ZS`) | C05 (GSTIN Status Active) | `rejected` | `rejected` | **PASS** |
| **K02** | Harmony Dental Care | Proprietorship | Corrupted / noisy OCR text on GST certificate (`#41157`) | C18 (OCR Confidence Adequate) | `requires_review` | `requires_review` | **PASS** |
| **K03** | Ganesh Woodcraft | Proprietorship | Clean specimen (OCR character variance resolved) | None | `auto_approved` | `auto_approved` | **PASS** |
| **K04** | Saffron Dental Care LLP | LLP | Severe image blur on GST certificate (Laplacian variance 1.25 < 50) | C17 (Image Quality Adequate) | `requires_review` | `requires_review` | **PASS** |
| **K05** | Balaji Realty LLP | LLP | Missing Udyam certificate (permissible; Udyam optional) | None | `auto_approved` | `auto_approved` | **PASS** |
| **K06** | Saffron Unisex Salon | Proprietorship | Clean specimen | None | `auto_approved` | `auto_approved` | **PASS** |
| **K07** | Neelgiri Physio Clinic | Proprietorship | Signatory name mismatch: GST shows Priya Nair, ID shows Neha Banerjee | C07 (Legal Name Match) | `requires_review` | `requires_review` | **PASS** |
| **K08** | Green Leaf Legal Associates | Proprietorship | Clean specimen | None | `auto_approved` | `auto_approved` | **PASS** |
| **K09** | Kaveri Insurance Advisors | Proprietorship | Clean specimen (5-day old bill) | None | `auto_approved` | `auto_approved` | **PASS** |
| **K10** | Kaveri Stays LLP | LLP | Clean specimen (Designated partner signatory) | None | `auto_approved` | `auto_approved` | **PASS** |
| **K11** | Trinity Bake House Pvt Ltd | Private Limited | Expired address proof: Bill date 2025-10-31 (257 days old > 90 days) | C15 (Address Proof Recency) | `rejected` | `rejected` | **PASS** |
| **K12** | Star Electronics | Proprietorship | Clean specimen (9-day old bill) | None | `auto_approved` | `auto_approved` | **PASS** |

---

## 2. Statistical Performance Metrics

### Auto-Approval Classification
- **True Positives (Clean auto-approved)**: 7 (`K03`, `K05`, `K06`, `K08`, `K09`, `K10`, `K12`)
- **False Positives (Defects wrongly auto-approved)**: 0
- **True Negatives (Defects correctly routed to review or blocked)**: 5 (`K01`, `K02`, `K04`, `K07`, `K11`)
- **False Negatives (Clean wrongly rejected or flagged)**: 0
- **Auto-Approval Precision**: `100.0%` (7 / 7)
- **Auto-Approval Recall**: `100.0%` (7 / 7)
- **Overall Accuracy**: `100.0%` (12 / 12)

> [!NOTE]
> Per Section 42 & 11.6 guidelines, this 12-applicant challenge suite represents a small synthetic specimen evaluation. Thresholds were established from regulated telecom compliance rules (DoT KYC guidelines, DPDP Act 2023), not tuned after the fact.

### Triage Breakdown
- **Auto-Verified Rate**: `58.33%` (7 / 12)
- **Human Review Queue Rate**: `25.00%` (3 / 12)
- **Hard Blocker Rejection Rate**: `16.67%` (2 / 12)

---

## 3. Regulated Check Catalog Verification (C01–C19)

1. **C01 (Consent Verification)**: Enforced via HTTP 403 gate before any document upload. Verified with un-withdrawn consent record.
2. **C02 (GSTIN Format Valid)**: Format validated via regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`. Deferred to review if document image is unreadable/blurred.
3. **C03 (GSTIN Checksum Valid)**: Validated via statutory MOD-36 checksum calculation.
4. **C04 (GSTIN Found in Registry)**: Record resolved in mock GSTIN registry.
5. **C05 (GSTIN Status Active)**: Registry status must be `Active`. Cancelled GSTIN (`K01`) passes C02-C04 and halts here as a statutory hard blocker (`HARD_FAIL`).
6. **C06 (GSTIN Certificate Match)**: GSTIN on certificate matches entered GSTIN.
7. **C07 (Legal Name Match)**: Jaro-Winkler match with LLP entity authorization logic; correctly caught K07 mismatch (`SOFT_FAIL`).
8. **C08 (State Code Match)**: 2-digit GST state prefix matches registry and address proof state (`SOFT_FAIL`).
9. **C09 (Udyam Format Valid)**: Regex `^UDYAM-[A-Z]{2}-00-[0-9]{7}$` verified (`HARD_FAIL` if declared).
10. **C10 (Udyam Found in Registry)**: Mock registry cross-reference verified (`HARD_FAIL` if declared).
11. **C11 (Udyam Enterprise Name Match)**: Cross-checked against GST and Udyam registries (`SOFT_FAIL`).
12. **C12 (Signatory Name Match)**: Matches proprietor for proprietorship, designated partner/director for corporate entity (`SOFT_FAIL` / info).
13. **C13 (Address Proof Holder Match)**: Matches signatory or registered business (`SOFT_FAIL`).
14. **C14 (Address Proof Address Match)**: Matches registry pincode and city (`SOFT_FAIL`).
15. **C15 (Address Proof Recency)**: Reference date `2026-07-15`; correctly caught K11 (257 days old > 90 days) (`HARD_FAIL`).
16. **C16 (Required Documents Present)**: Mandatory documents present (GST, Signatory ID, Address Proof; Udyam optional) (`HARD_FAIL`).
17. **C17 (Image Quality Adequate)**: Laplacian variance correctly flagged K04 blur (variance `1.25 < 50`) while allowing readable documents (`> 900`) (`SOFT_FAIL`).
18. **C18 (OCR Confidence Adequate)**: Correctly flagged corrupted character tokens (`#41157`) in K02 (`SOFT_FAIL`).
19. **C19 (No Duplicate File Re-use)**: Unique SHA256 hashes across different uploaded document categories (`SOFT_FAIL`).
