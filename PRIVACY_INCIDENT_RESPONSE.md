# RISE privacy incident response

This operational checklist must have a named owner and working contacts before App Store launch.

## 1. Receive and contain

1. Record the date/time, reporter, affected system, and symptoms without copying secrets into chat or tickets.
2. Revoke exposed sessions, credentials, API keys, or access paths. Rotate secrets through the provider dashboard—not source code.
3. Preserve relevant logs and evidence with access restricted to the response team.
4. Stop the affected processing if that can be done without increasing harm.

## 2. Assess

1. Identify the data types, people, regions, providers, time range, and whether data was accessed, lost, altered, or disclosed.
2. Determine whether proof files or reflections were involved; current architecture says they should remain on-device, so any server appearance is an unexpected event.
3. Assess sensitivity, likelihood of misuse, number of people, recoverability, and risk of significant harm.
4. Contact qualified privacy/security counsel for notification deadlines and privilege where appropriate.

## 3. Notify when required

1. Notify affected people in clear language with what happened, what data was involved, steps taken, risks, protective actions, and support contact.
2. Notify the relevant privacy regulator and other authorities within applicable deadlines. GDPR can require regulator notification within 72 hours; Quebec and Canadian rules use their own risk tests.
3. Notify processors/platforms or law enforcement where legally required and appropriate.
4. Do not minimize, speculate, or promise facts not yet established.

## 4. Recover and learn

1. Verify the fix, restore from tested backups if needed, monitor for recurrence, and document all decisions.
2. Update threat models, tests, controls, provider settings, privacy disclosures, and staff procedures.
3. Maintain the incident register for the legally required period and restrict access.

## Contacts to complete before launch

- Accountable operator/legal name: **OPEN**
- Privacy officer and backup: **OPEN**
- Security incident lead and backup: **OPEN**
- Legal counsel: **OPEN**
- Render/Resend/Vercel/Expo/Apple escalation contacts: **OPEN**
- Cyber-insurance contact, if obtained: **OPEN**
