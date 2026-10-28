# MainAI — AI-Powered Predictive Maintenance System

Industrial predictive maintenance frontend built with Next.js 16, PostgreSQL, and Drizzle ORM.

## Architecture

- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **Database:** PostgreSQL with Drizzle ORM 0.45.2
- **Driver:** pg 8.20.0
- **TypeScript:** 5.9.3
- **Styling:** Tailwind CSS 4.1.17

## Data Sources

### Fixture Preview (Default)
Static frontend fixtures in `src/data/fixtures.ts` are used when `NEXT_PUBLIC_DATA_SOURCE_MODE="fixture_preview"`. These are illustrative synthetic records for UI development and preview.

### Live Backend
When `NEXT_PUBLIC_DATA_SOURCE_MODE="live_backend"`, data is served from PostgreSQL via Next.js Route Handlers. The service adapter never silently falls back to fixture data if a live request fails.

## AI4I 2020 Predictive Maintenance Dataset

### Source
- **Dataset:** AI4I 2020 Predictive Maintenance Dataset
- **Source URL:** https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
- **License:** CC BY 4.0 (attribution required)
- **Records:** ~10,000 synthetic records
- **Nature:** Synthetic dataset — not real-world measurements

### Fields
| Field | Type | Unit | Description |
|-------|------|------|-------------|
| UDI | integer | — | Unique unit identifier |
| Product ID | string | — | Product identifier (e.g., L001863) |
| Type | enum (L/M/H) | — | Quality level |
| Air temperature | double | K | Operating temperature |
| Process temperature | double | K | Process temperature |
| Rotational speed | integer | rpm | |
| Torque | double | Nm | Newton-meters |
| Tool wear | integer | min | |
| Machine failure | boolean | 0/1 | Overall failure label |
| TWF | boolean | 0/1 | Tool Wear Failure |
| HDF | boolean | 0/1 | Heat Dissipation Failure |
| PWF | boolean | 0/1 | Power Failure |
| OSF | boolean | 0/1 | Overstrain Failure |
| RNF | boolean | 0/1 | Random Failure |

### Limitations
- The dataset does NOT contain vibration, acoustic, or other sensor readings present in MainAI's telemetry model. These fields are not fabricated.
- Failure labels are NOT Remaining Useful Life (RUL) measurements.
- All records are synthetic.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and set `DATABASE_URL`:
```
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/app_db"
NEXT_PUBLIC_DATA_SOURCE_MODE="fixture_preview"
```

Never commit real credentials to version control (`.env` is already in `.gitignore`).

### 3. Database Schema
```bash
npx drizzle-kit push
```
This creates all tables including `ai4i_telemetry_records` for the AI4I dataset. Migration SQL is at `drizzle/0001_fantastic_night_thrasher.sql`.

### 4. Download the AI4I Dataset
Download the CSV from the UCI Machine Learning Repository and place it at:
```
data/ai4i/ai4i-2020-predictive-maintenance.csv
```
The `data/` directory is excluded from version control (in `.gitignore`).

### 5. Import the Dataset
```bash
npx tsx scripts/import-ai4i.ts data/ai4i/ai4i-2020-predictive-maintenance.csv
```
The import is idempotent — re-running it updates existing records by UDI without duplicating.

### 6. Enable Live Backend Mode
```
NEXT_PUBLIC_DATA_SOURCE_MODE="live_backend"
```
This switches the service adapter to query PostgreSQL instead of using local fixtures.

### 7. Run the Application
```bash
npm run dev
```

## Verification Commands

| Command | Purpose |
|---------|---------|
| `npx tsc --noEmit` | TypeScript type checking |
| `npm run build` | Production build |
| `npx tsx scripts/test-ai4i-csv-parser.ts` | CSV parser unit tests |
| `npx drizzle-kit push` | Apply database schema migrations |
| `npx tsx scripts/import-ai4i.ts <csv-path>` | Import AI4I dataset |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Database health check |
| `/api/ai4i/records` | GET | Paginated AI4I telemetry records (query: `page`, `pageSize`, `type`, `machineFailure`) |
| `/api/ai4i/summary` | GET | AI4I dataset summary (failure counts, mode distribution, type breakdown) |
| `/api/maintenance/work-orders/[workOrderId]` | GET/PATCH | Work order detail and status transitions |

## Dashboard Integration

The dashboard (`/dashboard`) displays an AI4I 2020 Synthetic Dataset Summary panel showing:
- Total imported records
- Machine failure count and failure rate
- Failure mode distribution (TWF, HDF, PWF, OSF, RNF)
- Records by machine type (L, M, H)
- Synthetic data disclosure and field descriptions

When live-backend mode is not configured or the database is unavailable, the panel shows an error state without substituting fixture data.

## Project Structure

```
src/
  app/
    api/
      ai4i/
        records/route.ts    # Paginated AI4I records
        summary/route.ts    # AI4I failure statistics
      health/route.ts       # Health check
      maintenance/
        work-orders/[workOrderId]/route.ts  # Work order CRUD
    dashboard/page.tsx      # Dashboard (fixture + AI4I summary)
    fleet/page.tsx          # Fleet inventory
    ...
  components/
    dashboard/
      Ai4iDatasetPanel.tsx  # AI4I metrics display
      DashboardWorkspace.tsx # Main dashboard layout
      ...
  db/
    index.ts                # Connection pool
    schema.ts               # Drizzle schema (includes ai4i_telemetry_records)
    seed.ts                 # Idempotent fixture seed
  services/
    telemetryAdapter.ts     # Service adapter (fixture_preview + live_backend)
  types/
    telemetry.ts            # TypeScript contracts (includes AI4I types)
  data/
    fixtures.ts             # Local frontend fixtures
scripts/
  import-ai4i.ts            # AI4I dataset import pipeline
  test-ai4i-csv-parser.ts   # CSV parser unit tests
data/ai4i/                  # AI4I CSV storage (gitignored)
```
