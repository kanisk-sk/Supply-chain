# Supply Chain Tracking & Analytics

A full-stack platform for managing suppliers, products, warehouses, inventory, orders and shipments, with role-based dashboards, live analytics, alerts and public package tracking.

## Features

- **Landing page:** persistent logistics background, progressive scroll blur, independent full-size hero, floating navigation and reduced-motion support.
- **Authentication:** JWT sign-in and role-based access for administrators, warehouse managers, supply-chain managers and analysts.
- **User management:** an “Add new user” option in the login box takes administrators directly to the user-creation dialog after sign-in. Administrators can create and edit accounts, assign roles and select a warehouse for warehouse managers.
- **Operations:** supplier/product/warehouse catalogs, inventory adjustments and transfers, order workflows, shipment status history and alerts.
- **Dashboards:** role-specific operational views; the analytics dashboard includes a truck-and-mountain header, live IST clock and refresh control.
- **Sidebar:** navigation search, collapsible groups, active-page highlighting, complete hide/show controls and mobile navigation.
- **Profile settings:** responsive personal-information and account-overview panels; persistent name and photo updates, discard controls, password visibility and password changes verified against the current password.
- **Public tracking:** no login required; enter a tracking number such as `TRK-1A2B3C4D5E6F7890ABCDEF12` to open its tracking page. Existing eight-character references remain supported. The tracker shares the login page's logistics theme, with steady form controls.

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

- [Backend setup and API overview](backend/README.md)
- [Architecture](backend/docs/ARCHITECTURE.md)
- [Database](backend/docs/DATABASE.md)
- [API contract](backend/docs/API_CONTRACT.md)
- [Entity relationships](backend/docs/ERD.md)

Local environment files, dependencies, build output and development logs are excluded from Git.

## Production release

See [DEPLOYMENT.md](DEPLOYMENT.md) for environment requirements, migrations, first administrator provisioning, scheduler operation, readiness probes and release verification. CI runs against a fresh disposable MySQL schema and refuses to silently skip database checks.
