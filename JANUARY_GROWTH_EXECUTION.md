# RISE January growth execution

Updated: 2026-11-16

This is an execution target, not a revenue guarantee. RISE cannot reach paid revenue until it has a working public release, a defined paid offer, and evidence that members return for the core daily mission.

## Current truth

- TestFlight build 22 is the latest finished binary.
- App Store Connect shows iOS 1.0 as **Prepare for Submission**.
- Production API health is good and reports version `1.2.0`.
- Production verification email is not ready, so public account verification and password recovery are not release-ready.
- The App Store operator name, public mailing address, launch jurisdiction, final metadata, screenshots, privacy answers, reviewer access, and physical-iPhone QA remain required.
- App Store Connect also requires the Account Holder or Admin to provide the EU Digital Services Act trader-status information before EU distribution.
- RISE has no billing or paid product today, so current in-app revenue is $0 by design.

## One product promise

RISE should win on one outcome:

> Give each member one clear, personalized mission that creates a visible win today.

Tour, Plan, Projects, quizzes, rewards, rankings, and settings must support that action instead of competing with it. The first session should move from plan creation to a mission start in under two minutes, then to a useful completion in the same session.

## Release sequence

1. Authenticate a RISE-owned domain in Resend with SPF, DKIM, and DMARC. Configure the Render sender variables and confirm `/config/public` reports `email_delivery_ready: true`.
2. Set the three verified public operator values listed in `.env.example` in the EAS production environment.
3. Run `npm run testflight:preflight` and `npm run appstore:preflight` until both pass.
4. Build build 23 or higher, distribute it to TestFlight, and complete the physical-device QA list in `APP_STORE_RELEASE_READINESS.md`.
5. Test verification and password reset with at least two unrelated non-owner email providers.
6. Complete App Store Connect metadata, screenshots, privacy, age-rating, accessibility, reviewer access, agreements, and DSA trader status.
7. Submit only the exact tested binary. Do not turn on founding-code redemption until the public App Store version is live.

## Beta success gates

These are working product targets, not external industry benchmarks:

| Funnel | Initial target |
|---|---:|
| Plan created → mission started | 60%+ |
| Mission started → mission completed | 50%+ |
| Eligible Day-1 retention | 35%+ |
| Eligible Day-7 retention | 20%+ |
| Members who share an invite after a useful win | 10%+ |
| Average first mission start | Under 2 minutes |

Do not add more major features when these numbers are weak. Interview people who stop, fix the largest repeated obstacle, release one controlled improvement, and measure again.

## Revenue math

The paid offer and price require founder approval and retained-user interviews. Gross monthly revenue of $10,000 would require approximately:

| Monthly price | Active paying members |
|---|---:|
| $9.99 | 1,002 |
| $14.99 | 668 |
| $19.99 | 501 |

These figures exclude Apple fees, taxes, refunds, discounts, failed renewals, support, and infrastructure. The real required subscriber count will be higher. The founding 60 entitlement also promises one free year and must remain honored.

## Weekly operating loop

1. Run the private analytics report and record activation, completion, Day-1/7/30 retention, time-to-value, referrals, and pending feedback email.
2. Read every written feedback item and crash report; group repeated issues without exposing personal data.
3. Interview at least five active or churned testers each week until the core value is clear.
4. Pick one bottleneck, ship one change, and compare the next cohort.
5. Ask retained users what result they would pay to keep receiving. Choose pricing only after the same paid outcome repeats across interviews.
6. Start paid acquisition only after onboarding, retention, support, and unit economics are measurable.

## Command for the private dashboard

Set `RISE_API_URL` and `RISE_ADMIN_API_KEY` only in the operator terminal, then run:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\analytics_report.py
```

Never place the admin key in the mobile app, an `EXPO_PUBLIC_` variable, a URL, Git, screenshots, or support messages.
