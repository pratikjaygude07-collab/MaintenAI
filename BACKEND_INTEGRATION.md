# MainAI — Frontend-to-Backend Integration Guide

> **Scope Notice**: This document prepares the **MainAI Frontend UI** for integration with Manmath's backend service.  
> It separates **Existing Frontend Code** (already implemented in this repository) from **Proposed Backend Data Requirements** (to be mapped once Manmath provides the actual API specification).  
> No backend endpoints, URLs, credentials, or authentication schemes are assumed or hardcoded in the frontend.

---

## 1. Existing Frontend Architecture (Implemented)

| Layer | File Path | Purpose |
| :--- | :--- | :--- |
| **TypeScript Contracts** | `src/types/telemetry.ts` | Canonical TypeScript interfaces used by all UI components across Dashboard, Fleet, Digital Twin, and Diagnostics. |
| **Service Adapter Layer** | `src/services/telemetryAdapter.ts` | Single boundary between Next.js routes and data sources. Returns `TelemetryServiceResponse<T>` with explicit `status` (`"ready" \| "empty" \| "unavailable" \| "error"`) and `isFixturePreview` flag. |
| **Isolated Preview Fixtures** | `src/data/fixtures.ts` | Local illustrative fixture records used exclusively when `TelemetryDataSourceMode === "fixture_preview"`. |
| **Reusable State Primitives** | `src/components/ui/IndustrialPrimitives.tsx` | `DataLoadingState`, `DataEmptyState`, `DataErrorState`, `StatusBadge`, and `PanelContainer`. |

### Strict Non-Fallback Policy
When `TelemetryDataSourceMode` is switched from `"fixture_preview"` to `"live_backend"`:
- Failed, timed-out, or unconfigured backend requests **must return `status: "error"` or `"unavailable"`** and render `DataErrorState` / `DataEmptyState`.
- The adapter **must never silently substitute fixture data** when a real backend request fails.

---

## 2. Machine & Fleet Data Required by the UI

### A. System Header & Plant Summary (`SystemStatusSummary`)
Used in the persistent top header and sidebar footer (`src/components/layout/AppShell.tsx`):
- `statusLabel`: `string` (e.g., `"SYSTEM NOMINAL"`)
- `uptimePercent`: `number`
- `lastSyncUtc`: `string`
- `plantCode`: `string` / `sectorCode`: `string`
- `gatewayNode`: `string` / `gatewaySyncPercent`: `number`

### B. Fleet Summary Counts (`FleetInventorySummary`)
Used in `/fleet` summary cards (`src/components/fleet/FleetSummaryRow.tsx`):
- `totalAssets`: `number`
- `operationalAssets`: `number`
- `attentionAssets`: `number`
- `criticalAssets`: `number`

### C. Machine Inventory & Detail Record (`FleetMachineRecord`)
Used in `/fleet` table/cards and `/fleet/[machineId]` detail view:
- **Identity & Location**: `machineId`, `machineName`, `machineType`, `plant`, `locationZone`
- **Condition**: `operatingStatus` (`"operational" | "warning" | "critical" | "maintenance"`), `healthScore` (`0–100`), `needsAttention` (`boolean`)
- **Latest Sensor Snapshot**:
  - `temperatureC`, `tempThresholdWarning`, `tempThresholdCritical`
  - `vibrationRms`, `vibThresholdWarning`, `vibThresholdCritical`
  - `rpm`, `rpmNominal`
- **Maintenance & Sync Metadata**: `lastUpdateRelative`, `lastUpdateUtc`, `maintenanceStatus` (`"up_to_date" | "scheduled" | "in_progress" | "overdue"`), `maintenanceLabel`, `nextMaintenanceWindow`, `workOrderId`, `sensorChannels`, `gatewayNode`

---

## 3. Sensor Readings & Historical Trends Required

### A. Supported Time Windows (`TimeRangeKey`)
All trend charts support four selectable time windows: `"1H"`, `"6H"`, `"24H"`, and `"7D"`.

### B. Dashboard Multi-Sensor Stream (`MonitoredAssetStream` & `TelemetryDataPoint`)
Used in `src/components/dashboard/SensorTrendCharts.tsx`:
- Per-sample fields: `timestamp`, `vibrationRms` (`mm/s`), `bearingTempC` (`°C`), `acousticDb` (`dB`), optional `isForecast` (`boolean`).
- Threshold config (`TelemetryThresholdConfig`): `vibrationWarning`, `vibrationCritical`, `tempWarning`, `tempCritical`, `acousticWarning`, `acousticCritical`.

### C. Digital Twin & Diagnostics Sensor Channels (`DigitalTwinSensorPoint` & `SensorCondition`)
Used in `/digital-twin` (`DigitalTwinSensorPanels.tsx`) and `/diagnostics` (`DiagnosticsSensorAnalysis.tsx`):
- Time-series point (`DigitalTwinSensorPoint`): `timestamp`, `temperatureC`, `vibrationRms`, `rpm`, `acousticDb`.
- Per-channel condition summary (`SensorCondition`):
  - `id`, `metricKey` (`"vibration" | "temperature" | "rpm" | "acoustic"`), `label`, `channelCode`
  - `currentReading`, `unit`, `status` (`"nominal" | "warning" | "critical"`)
  - `normalRangeText`, `warningThreshold`, `criticalThreshold`, `nominalReference`
  - `thresholdExceeded` (`boolean`), `exceededSummary` (`string`, optional)
- Sub-assembly telemetry (`DigitalTwinSubAssembly`): `id` (`"de-bearing" | "stator-core" | "rotor-shaft" | "nde-bearing"`), `code`, `name`, `status`, `temperatureC`, `vibrationRms`, `materialSpec`, `notes`.

---

## 4. Diagnostic Findings & Recommendation Data Required

### A. Diagnostic Findings (`DiagnosticFinding`)
Used in `/diagnostics` (`DiagnosticFindingsPanel.tsx`):
- `id`, `machineId`, `machineName`
- `affectedComponent`, `componentCode`
- `title`
- `severity`: `"informational" | "low" | "medium" | "high" | "critical"`
- `status`: `"open" | "under_review" | "action_planned" | "resolved"`
- `supportingEvidence`: `string[]` (bulleted sensor observations)
- `sensorReadingsSummary`: `string`
- `thresholdReference`: `string`
- `recommendedNextAction`: `string` (optional)
- `lastUpdatedUtc`: `string`, `lastUpdatedRelative`: `string`

### B. Maintenance Recommendations (`MaintenanceRecommendation`)
Used in `/diagnostics` (`MaintenanceRecommendationsPanel.tsx`):
- `id`, `machineId`, `machineName`, `associatedComponent`
- `actionTitle`
- `priority`: `"P1 - Immediate" | "P2 - High" | "P3 - Routine"`
- `supportingReason`: `string`
- `suggestedStatus`: `"pending_review" | "approved_local" | "scheduled" | "completed"`
- `completionStatus`: `string`, `estimatedWindow`: `string`
- `linkedFindingId`: `string` (optional), `workOrderRef`: `string` (optional)

---

## 5. Alerts & Maintenance Event Data Required

### A. Active Alerts (`PredictiveAlert` & `DigitalTwinAlertFixture`)
Used in Dashboard (`RecentAlertsPanel.tsx`), Digital Twin (`DigitalTwinConditionPanels.tsx`), and Diagnostics (`DiagnosticsTimelinePanel.tsx`):
- `id`, `assetId` / `machineId`, `assetName`, `sector` / `channel`
- `severity`: `"nominal" | "warning" | "critical"`
- `faultSignature` / `title`, `telemetryReading` / `readingSummary`, `thresholdLimit` / `thresholdSummary`
- `detectedRelative`, `detectedUtc` / `loggedAt`, `recommendedAction`

### B. Maintenance Work Orders (`MaintenanceWorkOrder`)
Used in Dashboard (`MaintenanceActivityPanel.tsx`):
- `id`, `assetId`, `assetName`, `taskTitle`
- `maintenanceType`: `"Predictive" | "Corrective" | "Calibration" | "Inspection"`
- `assignedTeam`, `leadEngineer`, `scheduledWindow`, `estimatedDuration`
- `status`: `"in_progress" | "scheduled" | "completed"`
- `priority`: `"P1 - Urgent" | "P2 - High" | "P3 - Standard"`
- `triggerAlertId` (optional)

### C. Machine & Diagnostic Event Logs (`DigitalTwinMachineEvent` & `DiagnosticEvent`)
Used in Digital Twin and Diagnostics timelines:
- `id`, `machineId`, `machineName`, `timestampUtc`, `relativeTime`
- `category`:
  - Digital Twin: `"TELEMETRY" | "MAINTENANCE" | "THRESHOLD" | "CALIBRATION"`
  - Diagnostics: `"THRESHOLD_EXCEEDED" | "CONDITION_CHANGED" | "DIAGNOSTIC_REVIEW" | "MAINTENANCE_ACTION"`
- `severity`: `"nominal" | "warning" | "critical" | "info"`
- `title`, `detail` / `description`

---

## 6. Proposed Request & Response Envelope Structure

*(To be aligned with Manmath's actual API specification — no URLs or endpoints are assumed yet)*

### Proposed Query Parameters (Frontend-Ready)
- **Machine Selection**: `machineId` (e.g., `"TURB-GEN-04"`)
- **Sensor Time Window**: `timeRange` (`"1H" | "6H" | "24H" | "7D"`)
- **Fleet Filtering/Sorting**: `search`, `operatingStatus`, `needsAttention`, `sortBy` (`"healthScore" | "machineName"`), `sortOrder` (`"asc" | "desc"`)
- **Diagnostics Filtering**: `severity`, `status`

### Proposed Service Adapter Envelope (`TelemetryServiceResponse<T>`)
```ts
export interface TelemetryServiceResponse<T> {
  status: "ready" | "empty" | "unavailable" | "error";
  data: T | null;
  isFixturePreview: boolean;
  sourceTag: string;
  errorCode?: string;
  errorMessage?: string;
}
```

---

## 7. Loading, Empty, Unavailable & Error Behavior

All four primary workspaces (`DashboardWorkspace`, `FleetInventoryView`, `DigitalTwinWorkspace`, `DiagnosticsWorkspace`) implement standardized state handling via `IndustrialPrimitives.tsx`:

1. **Loading (`status === "loading"`)**: Renders `DataLoadingState` with accessible `role="status"`, `aria-busy="true"`, and skeleton rows.
2. **Empty Filter / Empty Dataset (`status === "empty"`)**: Renders `DataEmptyState` with a clear explanation and a `Reset Active Filters` button when filters return 0 records.
3. **Service Unavailable (`status === "unavailable"`)**: Renders `DataEmptyState` indicating the telemetry service is not connected or unavailable, without substituting fake operational values.
4. **Error (`status === "error"`)**: Renders `DataErrorState` (`role="alert"`) displaying the error code, description, and a `RETRY TELEMETRY STREAM` action button.

---

## 8. Questions for Manmath Before Connecting the Backend

1. **Base URL & Environment Variables**:
   - Should requests be proxied through Next.js server-side Route Handlers (`process.env.BACKEND_API_URL`) or called directly from the browser (`process.env.NEXT_PUBLIC_API_BASE_URL`)?
2. **Authentication & Authorization**:
   - What authentication mechanism is required (e.g., `Authorization: Bearer <JWT>`, `X-API-Key` header, or HTTP-only session cookies)?
3. **CORS & Network Policy**:
   - If browser-to-backend requests are used, which origins, headers, and HTTP methods (`GET`, `PATCH`, `POST`) are permitted by the backend CORS policy?
4. **Pagination vs. Full Payload**:
   - Will `/fleet` return all machines in a single payload or cursor/offset paginated pages?
5. **Mutation Endpoints**:
   - Should acknowledging an alert (`RecentAlertsPanel`) or updating a maintenance recommendation status (`MaintenanceRecommendationsPanel`) persist via `PATCH`/`POST` endpoints, or remain read-only in the initial backend release?
6. **Timestamp & Unit Conventions**:
   - Are timestamps returned as ISO-8601 UTC strings (e.g., `"2026-03-31T14:21:56Z"`), and are vibration/temperature units already normalized to `mm/s RMS` and `°C`?
