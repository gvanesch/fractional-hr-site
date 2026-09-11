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

The public write endpoints `/api/diagnostic-complete` and `/api/contact` are also
covered by the middleware environment guard. They remain public and unauthenticated,
but a mismatched application/Supabase environment is rejected with HTTP 503 before
the request reaches the existing Health Check or contact handlers.

## Public HR Health Check regression boundary

The free public HR Health Check is a live production feature and must not be treated
as legacy code. Environment-isolation work must preserve its existing behaviour.

Before promoting changes that touch routing, middleware or Supabase configuration,
verify the complete public flow:

1. The visitor can complete all 10 Health Check questions without advisor login.
2. The existing score/result calculation is unchanged.
3. The diagnostic submission is written to the correct Supabase environment.
4. The recorded answers and dimension/context data remain available for future
   analysis.
5. The existing prospect/CRM creation or update behaviour remains intact.
6. Supplying contact details continues to support the existing contact/enquiry
   workflow.
7. Existing notification/email behaviour remains intact where configured.
8. QA/preview completion writes only to QA Supabase.
9. Production completion writes only to production Supabase.
10. A deliberately mismatched environment returns 503 before any Health Check,
    prospect or contact write occurs.

Do not add advisor authentication to the public Health Check or its contact flow.
Do not rewrite the Health Check persistence logic solely for environment isolation
when an outer validation guard provides the required separation.

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
8. Complete a synthetic 10-question HR Health Check in QA and confirm its
   submission/contact data appears in QA only.
9. Intentionally test a mismatched environment in a disposable preview/local
   configuration and confirm client creation and public Supabase writes fail rather
   than connecting.

## Remaining hardening

Several older/background API routes still instantiate Supabase clients directly
instead of using the shared helpers. They should be migrated selectively, with
regression checks appropriate to each route. The public Health Check handlers are
intentionally protected at middleware level so their established scoring, persistence,
CRM and contact behaviour can remain unchanged.

Do not change live Cloudflare secrets or production environment bindings without
first verifying the active deployment configuration.
