# RISE account and promotional-access plan

The private beta does not yet have cloud authentication, payments, or server-enforced entitlements.

## Recommended launch flow

1. User chooses **Continue with Google** (and **Sign in with Apple** on iOS when required by App Review).
2. The backend verifies the provider token and creates one internal user ID. Never trust an email or waitlist position sent only by the app.
3. The user reviews privacy terms and claims the standard **3-month free beta** entitlement.
4. The backend checks the verified account email against a locked waitlist table.
5. If the account is one of the original 50 unused entries, the backend assigns **waitlist_year_free** for 365 days and marks the entry claimed in the same database transaction.
6. Before the free period ends, show the exact monthly price, billing date, renewal behavior, cancellation path, and store terms. Do not start billing without explicit store confirmation.

## Minimum backend tables

- `users`: internal ID, auth provider ID, verified email, created date, deletion state.
- `waitlist_grants`: normalized-email hash, original rank, claimed user ID/date, offer version.
- `entitlements`: user ID, plan code, source, start/end dates, status, store transaction ID.
- `consents`: user ID, policy version, consent type, timestamp, region.
- `mission_records`: user ID, mission ID, state, reflection, proof metadata, review result. Store actual media only with explicit consent and secure object storage.
- `audit_events`: append-only security and entitlement decisions; never store secrets or unnecessary proof content.

## Offer rules

- One promotional grant per verified person/account; server-enforced and idempotent.
- Freeze and timestamp the original 50-person list before launch.
- Define whether the one-year offer replaces or follows the three-month offer; the clearest rule is that it replaces it.
- Publish eligibility, expiry, geography, non-transferability, and abuse rules before claims open.
- Review Apple/Google in-app purchase rules and regional consumer laws before charging.

## Required external setup

- Google OAuth client IDs for iOS, Android, and web.
- Apple Sign in capability and Services ID if another social login is offered on iOS.
- Secure hosted API/database, encryption, backups, rate limits, account deletion, and incident response.
- Store billing products and server-side purchase verification.
- Public privacy policy, terms, promotion terms, support contact, and verified operator information.
