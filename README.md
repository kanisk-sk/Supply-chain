# Supply Chain Tracking & Analytics

A full-stack platform for managing suppliers, products, warehouses, inventory, orders and shipments, with role-based dashboards, live analytics, alerts and public package tracking.

## Features

- **Landing page:** persistent logistics background, progressive scroll blur, independent full-size hero, floating navigation and reduced-motion support.
- **Authentication:** JWT sign-in and role-based access for administrators, warehouse managers, supply-chain managers and analysts.
- **Operations:** supplier/product/warehouse catalogs, inventory adjustments and transfers, order workflows, shipment status history and alerts.
- **Dashboards:** role-specific operational views; the analytics dashboard includes a truck-and-mountain header, live IST clock and refresh control.
- **Sidebar:** navigation search, collapsible groups, active-page highlighting, complete hide/show controls and mobile navigation.
- **Profile settings:** responsive personal-information and account-overview panels; persistent name and photo updates, discard controls, password visibility and password changes verified against the current password.
- **Public tracking:** no login required; enter a tracking number such as `TRK-1A2B3C4D` to open its tracking page. The tracker shares the login page's logistics theme, with steady form controls.

## Stack

| Frontend | Backend |
| --- | --- |
| Next.js 14, React 18, TypeScript | Python, FastAPI, Pydantic |
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

Prerequisites: Python compatible with the pinned backend dependencies (currently developed with Python 3.14), Node.js 20+ with npm, and MySQL 8+.

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

The seed command is optional and creates development accounts and sample operational data. Apply migrations on existing installations too: the profile-photo feature requires migration `a60206f1c001`.

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

### Development accounts

These credentials are created by `python -m app.seed` and are intended for local development.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@example.com` | `Admin123!` |
| Warehouse manager | `warehouse@example.com` | `Warehouse123!` |
| Supply-chain manager | `supply@example.com` | `Supply123!` |
| Analyst | `analyst@example.com` | `Analyst123!` |

The login page includes buttons that fill these credentials. Warehouse managers need an assigned warehouse; the seed script does not assign one, so a new warehouse account initially displays “No warehouse assigned.”

## Main routes

| Route | Purpose |
| --- | --- |
| `/` or `/landing` | Landing page |
| `/login` | Sign in |
| `/dashboard` | Role-specific dashboard |
| `/profile` | Personal information, account overview and password settings |
| `/track` | Public tracking-number entry |
| `/tracking/[trackingNumber]` | Public shipment timeline |
| `/inventory`, `/orders`, `/shipments` | Operational workspaces |
| `/products`, `/suppliers`, `/warehouses` | Catalog workspaces |
| `/alerts`, `/analytics`, `/admin/users` | Role-restricted tools |

The landing navbar's “Sign up” label currently links to `/login`; registration is not implemented. Profile email and role fields are read-only. Phone/location editing, device history and account-activity lists are not implemented.

## Checks and builds

From `frontend/`:

```bash
npm run type-check
npm run lint
npm run test
npm run build
npm run start
```

Stop the frontend dev server before building in the same checkout: both `next dev` and `next build` use `.next`, and simultaneous use can leave the dev server serving missing assets. Restart `npm run dev` after switching back from a production build.

From `backend/`, with the virtual environment active:

```bash
pytest tests/unit -q
pytest -v
```

Database-backed tests use the separate `TEST_DATABASE_URL` and skip when their database prerequisites are unavailable. Never point that setting at the development database.

## Documentation

- [Backend setup and API overview](backend/README.md)
- [Architecture](backend/docs/ARCHITECTURE.md)
- [Database](backend/docs/DATABASE.md)
- [API contract](backend/docs/API_CONTRACT.md)
- [Entity relationships](backend/docs/ERD.md)

Local environment files, dependencies, build output and development logs are excluded from Git.
