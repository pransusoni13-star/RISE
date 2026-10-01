# RISE free beta account hosting

This setup keeps hosting at $0 while the private beta is small. It is not a
production uptime guarantee: the API can cold-start and the database provider
can pause an inactive free project.

## Accounts the adult operator creates

1. A free Supabase project for PostgreSQL.
2. A free Render account connected to the GitHub repository.
3. A free transactional-email account, or a Google app password for the
   dedicated RISE support mailbox. Never paste a normal mailbox password into
   Render.

## Database

In Supabase, copy the pooled PostgreSQL connection string. Replace its leading
`postgresql://` with `postgresql+psycopg://` before saving it in Render as
`RISE_DATABASE_URL`. Keep the database password private.

## API

From the Render dashboard, create a Blueprint from this repository. The root
`render.yaml` creates the free `rise-api` web service and asks for the secrets
that must not be committed. Keep founding redemption disabled during TestFlight.

After deployment, open `https://<render-host>/health`. Continue only when it
returns `{"status":"ok"}`.

## Connect Expo/EAS

Set the deployed API origin (no `/health` suffix) in the EAS production
environment:

```powershell
npx eas-cli env:create --environment production --name EXPO_PUBLIC_API_URL --value https://<render-host> --visibility plaintext
```

Then create and upload a new iOS build. An already-uploaded TestFlight binary
does not gain a build-time environment variable retroactively.

## Free-tier limitations

- Render free web services sleep after inactivity, so the first account request
  can be slow.
- Supabase free projects can pause after low activity. The operator must watch
  provider email and resume the project if needed.
- Export or back up beta data regularly. Upgrade before promising continuous
  availability or accepting paying customers.
