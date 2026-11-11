# Launch blockers and open decisions

## Payment status — November 1, 2026

The live API is configured for PayPal recurring payments and publishes only Mojo Plus at $3.99 USD/month. The website uses the existing backend's hosted checkout, account verification, deferred billing and cancellation routes. Free and separate Spark community boosting remain; Spark and gift sales depend on their own catalog availability. No Stripe setup is required for the current PayPal flow.

PayPal credentials and webhook configuration remain server-only. A real customer approval and charge must still be verified by the merchant in a controlled payment test; frontend unit and mock-browser checks do not establish that a real payment settled. The remaining business/legal details below are independent of the technical PayPal connection.

## Business and legal details (placeholders on the site)

Since API 0.60.0 these are filled in by a super admin in the admin console (Settings › Legal & business details), not
in code: the operator's address, where it's organised, registration number, governing law, support and privacy emails,
data-protection contact, minimum age, refund window and rules, grace period after a failed payment, legal bases per
purpose, transfer safeguards, billing-record retention, and the legal pages' "last updated" date. Until a field is
filled in, the site shows it as a "to be confirmed" placeholder (`src/lib/details.ts`). The legal pages are drafts and
must be reviewed by a qualified lawyer for the intended markets (consumer protection, auto-renewal, tax, privacy).

## Facts to keep true

- The site says the encryption hasn't had an independent security audit (meldiq_android `docs/SECURITY.md`). Update
  the FAQ, Features and Terms when one is done.
- iOS, macOS and Windows are listed as planned, not available.
