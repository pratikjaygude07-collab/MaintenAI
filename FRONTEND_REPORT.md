# MainAI Frontend Report

**Repository:** `mainai-frontend-ui-foundation`  
**Branch:** `main`  
**Generated:** 2026-10-23  
**Build:** Next.js 16.2.6 (App Router, Turbopack)  
**Status:** Build passes (`npm run build`), TypeScript passes (`npx tsc --noEmit`)

---

## 1. Overview

This report documents frontend changes to expose and wire up work-order status-transition controls and work-order detail routing for queued dispatch jobs.

## 2. New Backend Route Handler

### `src/app/api/maintenance/work-orders/[workOrderId]/route.ts`

| Method | Purpose |
|--------|---------|
| `GET`  | Returns a single work-order record (`success:true, data: {...}`). Returns `404` (`ERR-WO-NOT-FOUND`) when missing. |
| `PATCH`| Transitions work-order status. Validates allowed transitions (`scheduled→in_progress`, `in_progress→completed`). Returns `400` on invalid body, `404` if missing, `409` on invalid transition. |

- Uses dynamic import of `@/db` so the route module collects at build time without `DATABASE_URL` set.
- Response includes fields needed by the frontend to distinguish asset profiles from queued work orders: `id`, `assetId`, `assetName`, `status`, `maintenanceType`, `priority`, `scheduledWindow`, `estimatedDuration`, `assignedTeam`, `leadEngineer`, `triggerAlertId`.

## 3. New Work-Order Detail Page

### `src/app/work-orders/[workOrderId]/page.tsx`

- Server-rendered dynamic route (`export const dynamic = "force-dynamic"`).
- Fetches via `GET /api/maintenance/work-orders/:id` (cache: no-store).
- Renders:
  - Explicit dispatch state label — **"QUEUED — awaits start action"** for `scheduled` work orders (e.g., WO-8834).
  - Work-order type (`maintenanceType`), target unit with link to `/fleet/[assetId]`, priority, scheduled window, estimated duration, crew.
  - Status badge (`QUEUED` / `IN PROGRESS` / `COMPLETED`).
  - "VIEW ASSET →" and "RETURN TO DISPATCH" navigation links.
- Returns 404 (`notFound()`) when the work order does not exist.

## 4. Dispatch Panel — Link Fix

### `src/components/dashboard/MaintenanceActivityPanel.tsx`

**Queued work-order link fix:** Scheduled/queued work orders (e.g., WO-8834) now render their ID as a link to `/work-orders/[id]` instead of only as a static badge. This opens the explicit work-order detail view rather than falling back to the asset profile page.

**Status-transition controls:**
- **"START WORK ORDER"** button on `scheduled` items → `PATCH` transitions to `in_progress`.
- **"COMPLETE / MARK FINISHED"** button on `in_progress` items → `PATCH` transitions to `completed`.
- Buttons render only when:
  1. `NEXT_PUBLIC_WORK_ORDER_TRANSITIONS_ENABLED=true` (env feature flag), **and**
  2. User has the `work_order:transition` permission (read from `window.__mainai_permissions__`).
- Calls `PATCH /api/maintenance/work-orders/:id` via `fetch`, with loading states (`STARTING...` / `FINISHING...`) and inline error display.
- Non-scheduled work orders keep the ID as a non-link badge.
- Existing status badges preserved for all states.

## 5. Environment Configuration

### `.env.example`

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Public API base URL for backend route handlers | `""` |
| `NEXT_PUBLIC_WORK_ORDER_TRANSITIONS_ENABLED` | Feature flag for work-order transition controls | `"false"` |

To enable on the hosted deployment:
1. Set `NEXT_PUBLIC_API_BASE_URL` to the correct backend host.
2. Set `NEXT_PUBLIC_WORK_ORDER_TRANSITIONS_ENABLED=true`.
3. Grant users the `work_order:transition` permission via `window.__mainai_permissions__`.

## 6. Verification

- `npx tsc --noEmit` — passes (no type errors).
- `npm run build` — succeeds.
- Routes confirmed in build output:
  - `ƒ /api/maintenance/work-orders/[workOrderId]` (dynamic, server-rendered)
  - `ƒ /work-orders/[workOrderId]` (dynamic, server-rendered)
- Static pages: all 19 pages generate successfully.

## 7. Files Changed

| File | Status |
|------|--------|
| `src/app/api/maintenance/work-orders/[workOrderId]/route.ts` | Modified — added `GET` method |
| `src/app/work-orders/[workOrderId]/page.tsx` | New — work-order detail page |
| `src/components/dashboard/MaintenanceActivityPanel.tsx` | Modified — queued WO link fix + transition controls |
| `.env.example` | Modified — documented env vars |

## 8. Deployment Notes

- Redeploy the current build to the hosting environment so the work-order detail route and transition controls are live.
- Confirm `NEXT_PUBLIC_API_BASE_URL` is set so the frontend reaches the correct API host.
- Verify the deployed build serves `/work-orders/[workOrderId]` (not an older badge-only version).
