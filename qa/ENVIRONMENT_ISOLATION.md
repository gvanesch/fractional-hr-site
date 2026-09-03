# Diagnostic QA environment isolation

## Required deployment contract

The application now treats the declared application environment and the resolved
Supabase project as a matched pair. The shared Supabase clients fail closed when
they do not match.

### Production

Required public environment marker:

```text
NEXT_PUBLIC_APP_ENV=production
```

`NEXT_PUBLIC_SUPABASE_URL` must resolve to the production Supabase project ref:

```text
qxddddhhpfrrxbaunwfw
```

### QA / preview

Required public environment marker:

```text
NEXT_PUBLIC_APP_ENV=qa
```

`NEXT_PUBLIC_SUPABASE_URL` must resolve to the QA Supabase project ref:

```text
lrlapaiyejvbckqpbrwa
```

QA pages display a persistent marker:

```text
QA ENVIRONMENT · SYNTHETIC DATA ONLY
```

### Local diagnostic QA

Use:

```text
NEXT_PUBLIC_APP_ENV=local
```

Local diagnostic QA is intentionally restricted to the QA Supabase project, not
production.

## Fail-closed behaviour

The shared browser, server and admin Supabase clients now validate the environment
before creating a client. The application must reject these combinations:

- `production` + QA Supabase
- `production` + any unknown Supabase project
- `qa` + production Supabase
- `qa` + any unknown Supabase project
- `local` + production Supabase
- `local` + any unknown Supabase project
- missing or unsupported `NEXT_PUBLIC_APP_ENV`

## Deployment smoke test

Before a QA or production deployment is promoted:

1. Confirm `NEXT_PUBLIC_APP_ENV` is explicitly set for that deployment.
2. Confirm the Supabase URL points to the expected project ref.
3. Load a page that creates a shared Supabase client.
4. QA/preview must show the synthetic-data banner.
5. Production must not show the QA banner.
6. In QA, confirm Northstar project ID
   `11111111-1111-4111-8111-111111111111` is reachable.
7. In production, confirm that same synthetic Northstar project ID is absent.
8. Intentionally test a mismatched environment in a disposable preview/local
   configuration and confirm client creation fails rather than connecting.

## Remaining hardening

Several older API routes still instantiate Supabase clients directly instead of
using the shared helpers. Those routes should be migrated to the central guarded
client before environment isolation is considered complete across the whole
application.

Do not change live Cloudflare secrets or production environment bindings without
first verifying the active deployment configuration.
