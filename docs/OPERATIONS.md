# Operations runbook

## Release sequence

1. Create a Supabase project and apply every file in `supabase/migrations/` in filename order.
2. Run `supabase/tests/production_fidelity_test.sql` against the target database.
3. Configure the variables documented in `.env.example` in Vercel.
4. Deploy, request `/api/health`, and confirm that it reports `degraded` only because no snapshot exists yet.
5. Invoke `/api/cron/scrape` once with the configured bearer secret.
6. Confirm a completed row in `scrape_runs`, 50 or fewer valid observations, and matching block provenance.
7. Confirm `/api/health` reports `ok` and `/api/export?format=json` returns the observations.

Do not manufacture historical observations. Historical backfill requires an archival RPC plus a trustworthy historical APY source at matching timestamps. Until both exist, the seven-day collection window is intentional.

## Service objectives

- Daily scrape completion: at least 99.5% over 30 days.
- Data freshness: latest valid snapshot less than 36 hours old.
- Completeness: at least 95% of requested vaults return valid PPS.
- Calculator API: p95 below 2.5 seconds under the repository load smoke profile.
- Alert correctness: no alert before three valid observations spanning seven days.

## Alerts

`.github/workflows/production-health.yml` probes the production health endpoint
every 15 minutes. Enable GitHub Actions failure notifications for the repository
so failed probes reach the maintainers.

Alert when any of the following is true:

- `/api/health` is non-200 for 15 minutes.
- No `scrape_runs.status = 'completed'` row exists for the current UTC day.
- A run is `running` for more than one hour or has status `failed`.
- `recorded_snapshots / requested_vaults < 0.95`.
- The RPC block number stops advancing.

Vercel does not retry failed cron executions. A failed run can be retried with the same authenticated endpoint; `begin_scrape_run` reclaims failed or stale runs and the daily unique key prevents duplicates.

## Incident response

1. Check Vercel function logs using the response `X-Request-Id`.
2. Inspect the current `scrape_runs` row and its error message.
3. Check Beefy endpoints and each configured Base RPC independently.
4. Retry only after the dependency is healthy; ingestion is idempotent for a vault and UTC date.
5. If bad observations were written, mark them `validation_status = 'rejected'` with a reason. Do not delete provenance during an incident.

## Rollback

Application rollback is safe because migrations are additive. Do not reverse the provenance migration while new code may be writing observations. Disable the Vercel cron before any database rollback.
