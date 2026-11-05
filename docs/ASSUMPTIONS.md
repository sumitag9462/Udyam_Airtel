# Assumptions

> [!NOTE]
> Every assumption is recorded here as required by the project specification. Each entry includes the rationale and the section of the prompt it relates to.

## Pricing

1. **Catalogue-minimum pricing** (Section 9.4): `PRICING_MODE=min` is the default. All prices shown use the `price_min_inr_per_month` column. The quote footer states: "Prices use the catalogue minimum, before applicable taxes, subject to Airtel approval."

2. **First-year cost formula** (Section 9.4): `firstYearTotal = 12 × monthlyTotal + setupTotal`. This assumes 12 months of service regardless of contract length. Documented in the quote UI.

3. **All prices are integer rupees** (Section 9.4): No paise. Fractional results are not expected given the catalogue, but would be rounded using `Math.round`.

## KYC

4. **90-day address proof rule** (Section 11.4, C15): Address proof must be dated no more than 90 days before `KYC_REFERENCE_DATE` (2026-07-15) and must not be future-dated. This means the earliest acceptable date is 2026-04-16.

5. **Name-match thresholds** (Section 11.4, C07): Jaro-Winkler similarity ≥ 0.90 = pass, 0.75–0.90 = review, < 0.75 = fail. These thresholds are documented reasoning, not tuned to pass specific test cases.

6. **Udyam certificate required only when declared** (Section 11.4, C16): If a lead has `has_udyam=Y` or declares having a Udyam number, the certificate is required. Otherwise it is not requested.

## Data Retention

7. **Rejected application retention: 30 days** (Section 14.3): This is a proposed policy, clearly labelled. Legal review is required before production use.

8. **Approved application retention: 180 days** (Section 14.3): This is a configurable assumption. The actual retention period requires legal determination.

## Simulation

9. **Simulated feasibility rate** (Section 12.4): ~7% of sites are "not feasible", matching the 41/588 ratio from historical data. Deterministic hash of pincode drives the result.

10. **Simulated time scale** (Section 12.4): Default `SIM_TIME_SCALE=1` means 1 minute of real time = 1 simulated day. This allows a demo to show order progress in real time.

## Segments

11. **Self-serve segments** (Section 6): `prof` and `micro` segments can complete the full self-serve flow. `multi` and `mfg` segments receive an indicative quote and then partner handoff.

12. **Segment mapping** (Section 9.1): `segmentOf(businessType)` is derived from the `smb_leads.csv` data, mapping each of the 35 business types to one of the 4 segments.

## City Tiers

13. **City-tier mapping** (Section 7): Derived from `smb_leads.csv`. If a city is not found in the mapping, the tier is treated as unknown (`TIER_UNVERIFIED`), and tier-restricted products are not offered until a human confirms.

## LLM and Advisor

14. **Maximum 6 questions** (Section 10.1): The advisor asks at most 6 questions total, extracting multiple fields from free-text answers when possible.

15. **Mock provider as default** (Section 10.7): When `ANTHROPIC_API_KEY` is not set, `LLM_PROVIDER` defaults to `mock`. The entire demo works offline with the mock.

16. **Hindi as default language** (Section 17.2): If the browser language starts with `hi`, Hindi is the default. Otherwise English.

## Data Pack

17. **Data files are read-only** (Section 3): Files in `/data` are never modified by the application; seeds and verification scripts treat the directory as immutable read-only source files.

18. **CRLF line endings** (Section 3): The CSV parser is configured for `bom: true` and CRLF support.

19. **PAN 4th character** (Section 3): The PAN's 4th character is always `X` in this synthetic dataset. The GSTIN validator accepts this.

## Propensity Model

20. **No causal claims** (Section 13.3): The propensity score orders the call list; it never decides who gets service. Clearly communicated in the UI.

21. **Excluded features** (Section 13.3): `preferred_language` and `state` are excluded from propensity features to prevent the score from becoming a proxy for denying service to a language group or region.
