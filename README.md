# Supply Chain Tracking & Analytics

A full-stack platform for managing suppliers, products, warehouses, inventory, orders and shipments, with role-based dashboards, live analytics, alerts and public package tracking.

[![Release checks](https://github.com/kanisk-sk/Supply-chain/actions/workflows/release-checks.yml/badge.svg?branch=main)](https://github.com/kanisk-sk/Supply-chain/actions/workflows/release-checks.yml)
[![Live demo](https://img.shields.io/badge/Live_demo-Vercel-211f1b)](https://supply-chain-kanisk-sk.vercel.app)

**[Open the live app](https://supply-chain-kanisk-sk.vercel.app) · [Track a package](https://supply-chain-kanisk-sk.vercel.app/track) · [Deployment guide](DEPLOYMENT.md) · [API contract](backend/docs/API_CONTRACT.md)**

![Supply chain logistics](frontend/public/dashboard-truck-hero.jpg)

## What it does

A single workspace follows stock from warehouse inventory through order confirmation, shipment dispatch and delivery. Operational records feed the dashboards and analytics; recipients can check a shipment through its public tracking reference without signing in.

| Workspace | Capabilities |
| --- | --- |
| Inventory | Stock by product and warehouse, adjustments, transfers and movement history |
| Orders & shipments | Order confirmation and fulfillment, stock deduction at dispatch, shipment lifecycle and status history |
| Catalog | Suppliers, products, warehouses and reorder thresholds |
| Alerts & analytics | Low-stock and overdue alerts, delivery performance, supplier activity and lifecycle bottlenecks |
| Access management | JWT sign-in, four roles, warehouse-scoped access and administrator-created accounts |
| Public tracking | Shipment timeline, delivery estimates and a dismissible error popup for unknown tracking IDs |

The desktop workspace uses compact tables, searchable navigation and role-specific dashboards. Profile settings support name, photo and password updates. Public self-registration is disabled: the login page’s **Add new user** shortcut takes authorized administrators to user management.

## Live deployment

| Service | Hosting | Purpose |
| --- | --- | --- |
| [Web app](https://supply-chain-kanisk-sk.vercel.app) | Vercel Hobby | Next.js frontend |
| [API readiness](https://supply-chain-api-5f4r.onrender.com/ready) | Render Free | FastAPI API and database connectivity check |
| Database | Aiven free MySQL | Persistent application data with verified TLS |
| [Overdue alert job](https://github.com/kanisk-sk/Supply-chain/actions/workflows/overdue-alerts.yml) | GitHub Actions | Scheduled reconciliation with database-backed singleton ownership |

The live installation uses administrator-provisioned accounts. The development credentials below do **not** grant access to the hosted app.

**Free hosting behavior:** Render may sleep when idle, so the first API request can time out while it wakes; retry shortly afterward. GitHub scheduled runs can be delayed or skipped, so the five-minute schedule is not an exact alert-delivery guarantee. See [DEPLOYMENT.md](DEPLOYMENT.md) for release and recovery procedures.

## Sample order and shipment tracking

Two fictional sample orders are available in the live app. Open their public tracking links without signing in, or sign in with an authorized account to view the linked records in **Orders** and **Shipments**.

| Order | Order status at setup | Shipment | Shipment status at setup | Public tracking |
| --- | --- | --- | --- | --- |
| `ORD-00000002` | Confirmed | `SHP-00000002` | In transit | [Track shipment](https://supply-chain-kanisk-sk.vercel.app/tracking/TRK-04792734606075F81B895D6B) |
| `ORD-00000003` | Fulfilled | `SHP-00000003` | Delivered | [Track shipment](https://supply-chain-kanisk-sk.vercel.app/tracking/TRK-517814E9B9390A7FAA6FADB7) |

The supporting supplier, product and warehouse are labeled **Sample**. These are demonstration records, not real customer shipments. Statuses reflect setup on 11 October 2026 and can change through the normal application workflow. The records live in the hosted database; cloning this repository does not import them.

## Stack

| Frontend | Backend |
| --- | --- |
| Next.js 16.4, React 19, TypeScript | Python 3.14, FastAPI, Pydantic |
| Tailwind CSS, Lucide, animejs | SQLAlchemy, MySQL, Alembic |
| Vitest | pytest, JWT, bcrypt |

## Repository layout

```text
backend/
  app/                 API modules, services, data access, jobs and seed script
  alembic/             Database migrations
  tests/               Unit and integration tests
  docs/                Architecture, database and API documentation
frontend/
  src/app/             Pages and routes
  src/components/      Shared layout, landing page and dashboard components
  src/config/          Role-based navigation and permissions
  src/lib/             API client and helpers
  public/              Local image assets
```

## Local setup

Prerequisites: Python 3.14, Node.js 24 with npm 11, and MySQL with InnoDB, window functions and named locks. CI uses MySQL 8.4. Runtime versions are recorded in `.nvmrc`, `frontend/.nvmrc` and `backend/.python-version`.

### Backend

Create a development database in MySQL:

```sql
CREATE DATABASE supply_chain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then, from the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` with your MySQL credentials in `DATABASE_URL`, your own `JWT_SECRET`, and the allowed frontend origins in `CORS_ORIGINS`. Configure a separate `TEST_DATABASE_URL` if you intend to run database-backed tests.

```bash
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The seed command is optional and creates development accounts and sample operational data. Run `alembic upgrade head` on existing installations too, so profile photos, warehouse assignments, public tracking and shared rate-limit tables are available.

### Frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to your backend base URL; the local default is `http://localhost:8000/api/v1`.

- App: [localhost:3000](http://localhost:3000)
- API docs: [localhost:8000/docs](http://localhost:8000/docs)
- API health: [localhost:8000/health](http://localhost:8000/health)
- API readiness: [localhost:8000/ready](http://localhost:8000/ready), which checks the database and returns 503 when it is unavailable.

### Development accounts

These credentials are created by `python -m app.seed` and are intended for local development.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@example.com` | `Admin123!` |
| Warehouse manager | `warehouse@example.com` | `Warehouse123!` |
| Supply-chain manager | `supply@example.com` | `Supply123!` |
| Analyst | `analyst@example.com` | `Analyst123!` |

The login page includes buttons that fill these credentials in development only. Warehouse managers need an assigned warehouse; the seed script does not assign one, so use an administrator account to assign an active warehouse in User management.

### Add a new user

1. Open `/login` and click **Add new user** below the sign-in button.
2. Enter an existing administrator account's email and password, then click **Continue as administrator**. Other roles cannot use this shortcut to create users.
3. The **Create user** dialog opens in User management. Enter the new user's name, email and initial password, choose their role and account status, and select an active warehouse if the role is **WAREHOUSE_MANAGER**.
4. Click **Save access**. The new account can then sign in normally.

**Back to sign in** returns to the regular login form. This is an administrator workflow; public self-registration is not available. Administrators can also open `/admin/users` and click **Create user** while already signed in.

For a fresh installation without seeded accounts, provision the first administrator from `backend/` with the environment configured and migrations applied:

```bash
python -m app.bootstrap_admin --email YOUR-EMAIL --name "YOUR-NAME"
```

The command prompts for a password without displaying it and refuses to create another first administrator if an active administrator already exists.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` or `/landing` | Landing page |
| `/login` | Sign in or start the administrator-only Add new user workflow |
| `/dashboard` | Role-specific dashboard |
| `/profile` | Personal information, account overview and password settings |
| `/track` | Public tracking-number entry |
| `/tracking/[trackingNumber]` | Public shipment timeline |
| `/inventory`, `/orders`, `/shipments` | Operational workspaces |
| `/products`, `/suppliers`, `/warehouses` | Catalog workspaces |
| `/alerts`, `/analytics` | Role-restricted alerts and reports |
| `/admin/users` | Administrator-only user creation and editing |

The landing navbar's “Sign up” label links to `/login`; accounts are created by administrators rather than public registration. Profile email and role fields are read-only. Phone/location editing, device history and account-activity lists are not implemented.

## Checks and builds

From `frontend/`:

```bash
npm run type-check
npm run lint
npm run test
# Set NEXT_PUBLIC_API_URL to your HTTPS API URL ending in /api/v1 before a production build.
npm run build
npm run start
```

Stop the frontend dev server before building in the same checkout: both `next dev` and `next build` use `.next`, and simultaneous use can leave the dev server serving missing assets. Restart `npm run dev` after switching back from a production build.

From `backend/`, with the virtual environment active:

```bash
pytest tests/unit -q
pytest tests --require-db -q
```

Database-backed tests require a fresh, empty disposable schema named with `test`, configured through `TEST_DATABASE_URL`, and distinct from `DATABASE_URL`. Tests apply real Alembic migrations and refuse to reset a nonempty schema. `--require-db` fails when database prerequisites are unavailable; omitting it permits database tests to skip. Never point `TEST_DATABASE_URL` at your development or production database.

## Documentation

- [Deployment and operations](DEPLOYMENT.md)
- [Backend setup and API overview](backend/README.md)
- [Architecture](backend/docs/ARCHITECTURE.md)
- [Database](backend/docs/DATABASE.md)
- [API contract](backend/docs/API_CONTRACT.md)
- [Entity relationships](backend/docs/ERD.md)

Local environment files, dependencies, build output and development logs are excluded from Git.

## Production release

See [DEPLOYMENT.md](DEPLOYMENT.md) for environment requirements, migrations, first administrator provisioning, scheduler operation, readiness probes and release verification. CI runs against a fresh disposable MySQL schema and refuses to silently skip database checks.
