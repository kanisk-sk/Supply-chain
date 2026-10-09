# Deployment runbook

Use Node 24 / npm 11 and Python 3.14. MySQL must support InnoDB, window functions and named locks (CI uses MySQL 8.4). The frontend and API are separate services. No deployment is performed by this repository's release checks.

## Production configuration

Set backend `ENVIRONMENT=production`, `DATABASE_URL` to a remote MySQL database using a dedicated non-root account and a URL-encoded password, and `JWT_SECRET` to at least 32 random bytes (generate with `python -c 'import secrets; print(secrets.token_urlsafe(48))'`). Set `CORS_ORIGINS` to the exact HTTPS frontend origin, without a trailing slash. Keep `DB_REQUIRE_TLS=true`; provide `DB_SSL_CA` if the provider uses a private CA. Startup refuses development credentials/origins and insecure database settings. Keep credentials in the hosting provider's secret store.

Set frontend `NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api/v1` **before** `npm run build`. It is embedded at build time. Production builds refuse missing, local or HTTP URLs. Build with `npm ci && npm run lint && npm run type-check && npm test && npm run build`, start with `npm start` on the provider's assigned port. Demo login information is hidden in production. Serve both services over HTTPS.

API install/start (from `backend`): `pip install -r requirements.txt`; `uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-proxy-headers`. The included Dockerfile is an alternative non-root runtime. Set the platform's target port to 8000. Probe `/live` for liveness and `/ready` for readiness; `/ready` returns 503 if MySQL is unavailable. `/health` remains a compatibility endpoint and is not the readiness probe.

Client-IP rate limits use the ASGI peer address. Behind a proxy, configure Uvicorn `--proxy-headers --forwarded-allow-ips=TRUSTED-PROXY-IP` **only** for trusted ingress addresses that strip incoming forwarded headers. Otherwise users share the proxy's quota. Never trust arbitrary forwarded headers. Limits are shared in MySQL across workers and fail closed on database failure.

## Release sequence

1. Take a recoverable database backup; rehearse restore in a separate database. Verify backup retention, private database networking, TLS certificates and database storage alarms.
2. Stop/drain old application workers and scheduler before migration. From the release image run `alembic upgrade head` **online**, followed by `alembic check`. Use a release-only migration account with DDL rights; runtime accounts need only application DML plus MySQL named-lock access. The existing tracking backfill requires a live connection; do not use offline SQL generation for a fresh installation.
3. For a new installation only, run `python -m app.bootstrap_admin --email YOUR-EMAIL --name YOUR-NAME`. Password entry is hidden and validated. It refuses if an active administrator exists. Do not run demo seeding scripts in production. Remove any previously seeded demo users through User management.
4. Start API workers with `SCHEDULER_ENABLED=false`, then run one separate worker using `python -m app.jobs.scheduler`. All workers must use the same database; connection-lifetime named locks provide singleton ownership and automatic takeover. Keep scheduler interval at 300 seconds unless a different alert latency is required.
5. Deploy the frontend built against the actual HTTPS API origin. All existing sessions must sign in again because tokens now carry a password-version fingerprint; password changes revoke old tokens.
6. Smoke-test administrator login, create/assign a warehouse manager, warehouse scope denials, product/inventory selection, order confirmation, one shipment per order, dispatch stock decrement, delivery, alerts, analytics and public tracking. Check `/ready`, browser console/network, scheduler ownership and structured request logs. Invalid tracking IDs must be rejected, login/tracking abuse must return 429, and secrets must never appear in logs.

## Verification and operation

`.github/workflows/release-checks.yml` installs from lockfiles, upgrades/checks real migrations, runs all database tests with `--require-db`, and checks frontend lint/types/tests/audit/build. To run locally, provision a **fresh empty** schema whose name includes `test`, set `TEST_DATABASE_URL` to it and `DATABASE_URL` to a different disposable schema, then `pytest tests --require-db -q` from backend. Tests refuse nonempty schemas; they never reset the development database. Delete only the disposable schemas you created after testing.

Track readiness failures, error rates, request latency, database pool/timeouts, scheduler ownership/tick age and overdue alerts. Keep database and JWT secrets out of logs. Tune pool size times worker count against the database connection limit. API request bodies are limited to 1 MiB. Login and tracking default to 10 and 30 requests per minute per client respectively; tune using the documented environment variables.

New tracking references have 96 bits of entropy; existing references remain valid and should be treated as bearer access links. Responses intentionally expose only public shipment/order information. Tokens remain in browser local storage; CSP blocks third-party scripts/frames and eval but allows Next's inline hydration. A future strict nonce CSP or cookie-session redesign is a separate architectural improvement, not enabled here.

Do not downgrade migrations during an incident until data-loss implications are reviewed. Prefer rolling back application images while retaining the additive rate-limit table, provided the previous application is compatible. A lifecycle repair/data review is required for legacy duplicate shipments, cancelled dispatched orders, unassigned managers or demo accounts already present; the new application rejects these invalid transitions but does not rewrite historical records automatically.

## Remaining development tooling advisories

The production dependency audit is clean. The full frontend audit still reports seven high-severity entries sharing the unpatched `braces` recursion issue ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) through Tailwind/Next lint tooling. These tools consume repository-controlled glob patterns during build/lint/watch; they are not installed as production application dependencies. Run builds only on trusted repository content and keep development servers private. Update when a compatible upstream fix ships. ESLint 9 remains pinned to the major supported by Next's current import/React/accessibility plugins; those plugins do not yet accept ESLint 10. A Tailwind major migration is not included in this release.

Backend dependencies were also scanned with `pip-audit`; PyJWT is pinned to the patched 2.15.0 release. Re-run this scan during releases alongside `npm audit --omit=dev --audit-level=high`; advisory results change over time.

## Local verification — 9 October 2026

- Backend: **380 passed**, no skipped database tests, against newly provisioned disposable MySQL 26.7.0 schemas. CI is configured for MySQL 8.4; its remote run has not yet occurred.
- Fresh schema migration to head and `alembic check` passed. Legacy duplicate alerts and shipment tracking backfills were exercised with real rows. Percent-encoded DSN handling passed.
- Frontend: clean `npm ci`, lint, TypeScript, **35 tests**, and the final Next 16.4.0 production build passed.
- Installed backend `pip-audit` and frontend `npm audit --omit=dev` reported zero known vulnerabilities after the JWT upgrade. The development-only advisory above remains.
- Browser: administrator sign-in, dashboard, all nine operational pages, manager warehouse-selection controls, dialog keyboard dismissal/focus restoration, production authentication routing and hidden demo credentials passed. Temporary servers were stopped.

The external scheduler's ownership/failure checks also passed (21 operational unit tests), and its standalone CLI completed on a disposable release database. Production domain/secrets/TLS, backup/restore rehearsal, migration execution and post-deployment smoke tests still require the target environment. Existing development databases were not migrated.
