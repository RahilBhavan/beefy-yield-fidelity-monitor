# Security model

- Supabase service-role credentials are server-only and are required only by the scraper.
- Dashboard and export access use the anonymous key and read-only RLS policies.
- Ingestion RPCs (`begin_scrape_run`, `ingest_vault_snapshots`) are `EXECUTE`-revoked from `PUBLIC`, `anon`, and `authenticated`; only the service role may call them.
- `/api/gas-estimate` uses Vercel's platform-supplied `x-vercel-forwarded-for` client IP for its per-instance rate limit. Other runtimes and requests without a valid platform IP share one limit bucket; arbitrary client-supplied forwarding headers are not trusted. This in-memory control is best-effort across multiple function instances. All responses carry CSP, frame-denial, nosniff, and referrer-policy headers.
- The scraper fails closed unless `CRON_SECRET` is configured and matches its bearer token.
- Prepared-transaction simulation accepts only active tracked Beefy vault addresses and never signs or submits transactions.
- Exported data is public protocol telemetry; no wallet addresses or personal data are stored.

Before adding strategist actions, implement authenticated roles, explicit authorization checks, confirmation steps, and immutable audit records. No write or delist action should be exposed through the current public dashboard.

Report vulnerabilities using the repository host's private security-advisory mechanism. Do not include credentials, service-role keys, or exploitable production details in a public issue.
