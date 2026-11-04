# Ground Truth: Smart KYC Document Dataset (K01–K12)

**Dataset Reference Date**: `2026-07-15` (`KYC_REFERENCE_DATE`)  
**Address Proof Freshness Window**: Max 90 days (Earliest valid bill date: `2026-04-16`)  
**Total Applicants**: 12 (`K01` to `K12`)  
**Total Documents**: 47 PNG images (4 documents per applicant, except `K05` which has no Udyam certificate).

---

## 1. Summary of Planted Defects and Expected Verdicts

| Applicant | Business Name | Constitution | Signatory Name | Planted Defect / Anomaly | Failed Checks | Expected Verdict |
|:---:|:---|:---|:---|:---|:---:|:---:|
| **K01** | Vindhya Tours & Travels | Proprietorship | Neha Kaur | GSTIN Cancelled in mock registry (`37IHKXV5167L1ZS`) | C05 | `REJECTED` |
| **K02** | Harmony Dental Care | Proprietorship | Joseph Shah | Corrupted / noisy OCR text on GST certificate (`#41157`) | C18 | `REQUIRES_REVIEW` |
| **K03** | Ganesh Woodcraft | Proprietorship | Joseph Singh | Clean document set (OCR character variance) | None | `AUTO_APPROVED` |
| **K04** | Saffron Dental Care LLP | LLP | Fatima Pillai | Severe image blur on GST certificate (Laplacian variance 1.25 < 50) | C17 | `REQUIRES_REVIEW` |
| **K05** | Balaji Realty LLP | LLP | Anita Shah | Missing Udyam certificate (permissible; Udyam is optional) | None | `AUTO_APPROVED` |
| **K06** | Saffron Unisex Salon | Proprietorship | Pooja Shah | Clean document set; Active GSTIN & Udyam | None | `AUTO_APPROVED` |
| **K07** | Neelgiri Physio Clinic | Proprietorship | Neha Banerjee | Signatory Name Mismatch: GST shows Priya Nair, ID shows Neha Banerjee | C07 | `REQUIRES_REVIEW` |
| **K08** | Green Leaf Legal Associates | Proprietorship | Joseph Rao | Clean document set; Active GSTIN & Udyam | None | `AUTO_APPROVED` |
| **K09** | Kaveri Insurance Advisors | Proprietorship | Anita Kulkarni | Clean document set; Active GSTIN & Udyam; 5-day old bill | None | `AUTO_APPROVED` |
| **K10** | Kaveri Stays LLP | LLP | Nisha Arora | Clean document set; Active GSTIN & Udyam | None | `AUTO_APPROVED` |
| **K11** | Trinity Bake House Pvt Ltd | Private Limited | Vikram Pillai | Expired Address Proof: Bill date 2025-10-31 (257 days old > 90 days) | C15 | `REJECTED` |
| **K12** | Star Electronics | Proprietorship | Pooja Agarwal | Clean document set; Active GSTIN & Udyam; 9-day old bill | None | `AUTO_APPROVED` |

---

## 2. Canonical Check Catalog (C01–C19)

Per **Section 11.4** and **Section 42** of the Master Engineering Specification:

1. **C01 (Consent Verification)**: Unwithdrawn, versioned applicant consent must exist prior to upload (`HARD_FAIL`). Enforced via HTTP 403 gate.
2. **C02 (GSTIN Format Valid)**: Extracted or entered GSTIN matches standard 15-character format (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`) (`HARD_FAIL`).
3. **C03 (GSTIN Checksum Valid)**: Validated via statutory MOD-36 checksum calculation (`HARD_FAIL`).
4. **C04 (GSTIN Found in Registry)**: Record resolved in mock GSTIN registry (`HARD_FAIL`).
5. **C05 (GSTIN Status Active)**: Registry status must be `Active`. Cancelled or Suspended status triggers immediate hard block (`HARD_FAIL`).
6. **C06 (GSTIN Certificate Match)**: GSTIN on certificate matches entered GSTIN (`HARD_FAIL`).
7. **C07 (Legal Name Match)**: Jaro-Winkler similarity between certificate name and registry (`>= 0.90` pass, `0.75-0.90` review, `< 0.75` fail). Proprietorship vs LLP corporate entity authorization logic (`SOFT_FAIL`).
8. **C08 (State Code Match)**: 2-digit GST state prefix matches registry and address proof state (`SOFT_FAIL`).
9. **C09 (Udyam Format Valid)**: Format matches regex `^UDYAM-[A-Z]{2}-00-[0-9]{7}$` (`HARD_FAIL` if declared).
10. **C10 (Udyam Found in Registry)**: Udyam number verified in mock Udyam registry (`HARD_FAIL` if declared).
11. **C11 (Udyam Enterprise Name Match)**: Enterprise name matches registry and GST legal or trade name (`SOFT_FAIL`).
12. **C12 (Signatory Name Match)**: Signatory name matches proprietor (proprietorship) or designated partner / director (LLP/Co) (`SOFT_FAIL`).
13. **C13 (Address Proof Holder Match)**: Bill holder matches signatory or registered business name (`SOFT_FAIL`).
14. **C14 (Address Proof Address Match)**: Supply address matches registry pincode and city (`SOFT_FAIL`).
15. **C15 (Address Proof Recency)**: Bill issue date is $\le 90$ days before benchmark reference date (`2026-07-15`) and not future-dated (`HARD_FAIL`).
16. **C16 (Required Documents Present)**: Mandatory documents present (GST, Signatory ID, Address Proof; Udyam optional unless declared) (`HARD_FAIL`).
17. **C17 (Image Quality Adequate)**: Document image sharpness (Laplacian variance $\ge 50$) and resolution (`SOFT_FAIL` / warn).
18. **C18 (OCR Confidence Adequate)**: Critical field extraction confidence $\ge 0.60$ and absence of corrupted/noise artifacts (`SOFT_FAIL`).
19. **C19 (No Duplicate File Re-use)**: Unique SHA256 hashes across different uploaded document categories (`SOFT_FAIL`).

---

## 3. Ground Truth Verification Methodology

Per Section 42 guidelines:
- Evaluated against fixed `KYC_REFERENCE_DATE=2026-07-15`.
- Cancelled GSTINs (`K01`) pass format (C02), checksum (C03), and registry existence (C04), failing strictly at C05.
- Unreadable documents due to blur (`K04`) or corrupted character tokens (`K02`) route to the Human Review Queue via C17 / C18 rather than being misclassified as fraudulent hard blocks.
