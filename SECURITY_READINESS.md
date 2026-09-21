# RISE security readiness

Updated: 2026-09-21

RISE beta includes an Expo client and a FastAPI/SQLAlchemy account service. Development uses SQLite; production is designed for PostgreSQL. Account, profile, and progress metadata can sync, while proof photos and videos remain on-device. There is no payment, advertising, or analytics flow.

## Launch checklist status

| Control | Current status |
| --- | --- |
| Hide API keys | Implemented. No API credentials are present. Environment files are ignored. Expo `EXPO_PUBLIC_` variables must never contain secrets because they are included in client bundles. |
| Purge Git secrets | Checked. No common private-key or API-secret pattern was found in the working tree or Git history. Rotate and purge immediately if a credential is ever committed. |
| Database access | Implemented through server-side SQLAlchemy only; the client receives no database credential. Production must use a private PostgreSQL URL. |
| Record ownership | Implemented through authenticated user scoping on profile, dashboard, progress, export, and deletion routes. Add a focused authorization review before public launch. |
| Encrypt sensitive data | Implemented for the sensitive faith/trusted-source preference on native devices using platform protected storage with device-only accessibility. The web keeps that preference only for the current session. General progress remains in app-private local storage and no cloud copy exists. |
| Enforce server-side authorization | Implemented with bearer-token validation and server-derived user identity on every private endpoint. |
| Lock record access | Implemented by filtering every private query and mutation to the authenticated user ID. |
| Block field tampering | Locally validated, but a local-only client cannot be a security authority. Future rewards or billing must be calculated and enforced server-side. |
| Secure session cookies | Not applicable. RISE creates no sessions or cookies. Future web sessions must use Secure, HttpOnly, SameSite cookies with rotation and expiry. |
| Hash passwords | Implemented with Argon2 through `pwdlib`; raw passwords are never stored. |
| Rate-limit login | Implemented in-memory for a single beta API instance. Replace with Redis or gateway limiting before scaling to multiple instances. |
| Add bot protection | Not applicable. There are no public write endpoints. Add abuse controls before introducing waitlists, public feedback, or account creation. |
| Parameterize queries | Implemented with SQLAlchemy expressions; no string-built user queries are used. |
| Validate all input | Implemented for current forms with bounded lengths, normalized stored values, proof review requirements, and defensive parsing. Future server input must be validated again on the server. |
| Escape user content | Implemented by React Native/React text rendering, which does not interpret user strings as HTML. No raw-HTML rendering API is used. |
| Restrict file selection | Implemented. Proof is limited to one supported image or video, videos are limited to 60 seconds, known unsupported types are rejected, and size caps are 25 MB for images and 150 MB for videos. Files are not uploaded to RISE. |
| Trim API responses | Implemented with Pydantic response models and a dedicated export endpoint that omits password and token hashes. |
| Add security headers | Implemented for common static hosts through `public/_headers` and for Vercel through `vercel.json`. Verify the deployed response headers before launch. |
| Force HTTPS | Hosting requirement documented and supported with HSTS and CSP upgrade rules. The production host must provide valid HTTPS before public release. |
| Scan dependencies | Implemented in the release workflow. TypeScript, Expo lint, Expo compatibility, production export, and `npm audit` are run. Do not use `npm audit fix --force` when it proposes an incompatible Expo downgrade. |

## Required before public backend launch

Deploy behind HTTPS with managed PostgreSQL; add migrations, backups, monitoring, a shared rate limiter, email verification/password reset, production secret management, separate development and production environments, retention documentation, and a focused security review. Re-test account deletion/export and authorization against the deployed service before inviting beta users.

This checklist documents engineering controls. It is not a penetration test, certification, or guarantee that the application is free of vulnerabilities.
