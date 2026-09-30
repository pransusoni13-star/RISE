# RISE TestFlight checklist for September 30, 2026

## First 15 minutes

1. Open App Store Connect → RISE: Daily Skill Missions → TestFlight → iOS.
2. Confirm version 1.0.0, build 2 has finished processing and has no blocking warning.
3. If build 2 says Missing Compliance, open Manage and truthfully indicate that RISE uses only exempt encryption supplied by the operating system for HTTPS and secure storage. Do not claim an exemption if the app later adds its own cryptography.
4. Enter the public URLs:
   - Support: `https://rise-daily-skill-missions.vercel.app/support`
   - Privacy: `https://rise-daily-skill-missions.vercel.app/privacy`
   - Marketing: `https://rise-daily-skill-missions.vercel.app`
5. Verify the App Privacy answers against `APP_STORE_RELEASE_READINESS.md`; do not publish answers that omit account or progress data.

## Internal TestFlight first

1. Add only the Account Holder and one trusted internal tester.
2. Install build 2 from the TestFlight app on a real iPhone.
3. Treat build 2 as a guest/on-device test build because the production API is not deployed.
4. Test every critical path: first launch, guest onboarding, two selected directions, mission steps, resource links, photo proof, video proof, reflection validation, quiz gate, progress, reminders, denied permissions, restart, export, local deletion, and feedback.
5. Record each blocker with the screen, exact taps, expected result, actual result, iPhone model, and iOS version.

## Before external testers

1. Deploy the HTTPS API with managed PostgreSQL, transactional email, backups, secrets, request limits, and monitoring.
2. Set the real API origin as `EXPO_PUBLIC_API_URL` in the EAS production environment.
3. Build and upload a new iOS build; do not send build 2 to external testers if account features are promised.
4. Create a durable reviewer account and test sign-in, email verification, reset, progress sync, export, logout, and account deletion.
5. Complete Test Information, reviewer contact details, beta description, feedback email, screenshots, age rating, territories, and accurate privacy responses.
6. Run the full real-iPhone checklist again on the exact build selected for external review.

## Release rule

Do not click Add for Review merely to meet a date. Submit only when the selected build, metadata, privacy disclosures, reviewer access, and production services all match what the reviewer will receive.
