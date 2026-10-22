# MainAI — Full-Stack Backend Architecture Plan (Phase 6)

> **Status**: Architecture Planning Only (Phase 6)  
> **Scope**: Full-stack transition plan for **MainAI — AI-Powered Predictive Maintenance System**, migrating incrementally from isolated frontend fixtures (`src/data/fixtures.ts`) to a real PostgreSQL + Next.js backend while preserving all existing UI functionality.

---

## 1. Architecture Comparison & Recommendation

### Option 1: Next.js App Router Route Handlers + PostgreSQL (via Drizzle ORM)
- **How it fits the existing repository**:
  - The repository already includes a configured PostgreSQL connection pool (`src/db/index.ts`), Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `src/db/schema.ts`), and a working healthcheck route (`src/app/api/health/route.ts`).
  - Frontend Server Components (`/dashboard`, `/fleet`, `/fleet/[machineId]`, `/digital-twin`, `/diagnostics`) and Client Components already share canonical TypeScript contracts in `src/types/telemetry.ts` and a centralized service adapter in `src/services/telemetryAdapter.ts`.
- **Pros**:
  - **Zero cross-language type drift**: Database queries, API responses, and UI components share exact TypeScript interfaces (`src/types/telemetry.ts`).
  - **Zero CORS or dual-deployment overhead**: Frontend and API routes run in a single unified Next.js deployment with direct server-side access to PostgreSQL.
  - **Deterministic rule-based & statistical evaluation**: Threshold excursion checks, health score rollups, and work-order state transitions can execute directly in TypeScript/SQL.
- **Cons**:
  - Heavy Python-native ML training or high-frequency array inference (`scikit-learn`, `PyTorch`, `scipy.fft`) cannot run natively inside the Node.js runtime without a worker/sidecar.

### Option 2: Separate Python FastAPI Backend
- **How it fits predictive maintenance**:
  - Ideal when running custom Python ML inference pipelines (e.g., RUL regression models, FFT spectrogram extraction, or SHAP feature attribution).
- **Pros**:
  - Native access to Python data-science libraries (`numpy`, `scipy`, `scikit-learn`, `pytorch`, `onnxruntime`).
- **Cons**:
  - Requires maintaining two separate runtimes, two deployment pipelines, duplicated TypeScript/Pydantic schemas, CORS configuration, and inter-service network authentication before basic CRUD and telemetry persistence even exist.

### Recommendation: **Option 1 Primary (Next.js Route Handlers + PostgreSQL/Drizzle) with a Modular ML Inference Adapter Hook**
1. **Primary Application Backend**: Build the core operational backend using **Next.js Route Handlers (`src/app/api/...`) + PostgreSQL + Drizzle ORM (`src/db/schema.ts`)**. This immediately leverages the repository's pre-wired PostgreSQL instance (`src/db/index.ts`), eliminates schema duplication, and allows gradual route-by-route migration through `src/services/telemetryAdapter.ts`.
2. **Future ML Integration Path (Hybrid Sidecar Ready)**: Isolate prediction and anomaly scoring behind a server-side `PredictionEngineAdapter` interface. Initially, this adapter computes deterministic threshold & health evaluations from stored sensor readings; when a Python FastAPI ML model is ready later, Next.js Route Handlers can call the Python inference microservice (`ML_SERVICE_URL`) or read its output from the shared PostgreSQL prediction tables without changing a single frontend component.

---

## 2. Confirmed (Existing Code) vs. Proposed Backend Capabilities

| Capability Area | Confirmed in Existing Codebase | Proposed Backend Implementation (Next Phases) |
| :--- | :--- | :--- |
| **Database Connection** | `src/db/index.ts` (`pg.Pool` + `drizzle(pool)`), `src/app/api/health/route.ts` (`SELECT 1`), `drizzle.config.json`. | Define relational & time-series tables in `src/db/schema.ts` and push via `drizzle-kit push`. |
| **Frontend Service Boundary** | `src/services/telemetryAdapter.ts` (`TelemetryServiceResponse<T>`, `TelemetryDataSourceMode`: `"fixture_preview" \| "live_backend"`). | Implement live database/API fetchers inside `telemetryAdapter.ts` when `mode === "live_backend"`. |
| **Machine & Fleet Management** | `FleetMachineRecord`, `FleetInventorySummary` in `src/types/telemetry.ts`; UI in `/fleet` & `/fleet/[machineId]`. | PostgreSQL `machines` table + fleet summary aggregation query + search/filter/sort query support. |
| **Sensor Readings & Trends** | `TelemetryDataPoint`, `DigitalTwinSensorPoint`, `SensorCondition`, `DigitalTwinSubAssembly`, `TimeRangeKey` (`1H`, `6H`, `24H`, `7D`). | PostgreSQL `sensor_readings`, `machine_thresholds`, and `machine_sub_assemblies` tables indexed by `(machine_id, recorded_at)`. |
| **Alerts & Events** | `PredictiveAlert`, `DigitalTwinAlertFixture`, `MaintenanceWorkOrder`, `DigitalTwinMachineEvent`, `DiagnosticEvent`. | PostgreSQL `alerts`, `maintenance_work_orders`, and `machine_events` tables + alert acknowledgment mutation. |
| **Diagnostics & Recommendations** | `DiagnosticFinding`, `MaintenanceRecommendation`, `MachineDiagnosticProfile`. | PostgreSQL `diagnostic_findings` and `maintenance_recommendations` tables + status update mutation. |
| **Prediction Results** | Fields present in UI types (`healthScore`, `rulHours`, `anomalyProbability`, `aiConfidencePercent`, `isForecast`). | PostgreSQL `prediction_snapshots` table storing model/rule build version, RUL estimate, confidence, and forecast points. |

---

## 3. Component Responsibilities

### 3.1 Machine & Fleet Management
- Store canonical asset metadata (`machineId`, `machineName`, `machineType`, `plant`, `locationZone`, `rotorConfiguration`, `operatingStatus`, `operatingHours`, `sensorChannels`, `gatewayNode`).
- Compute `FleetInventorySummary` (`totalAssets`, `operationalAssets`, `attentionAssets`, `criticalAssets`) and `FleetHealthBucket[]` dynamically from database records.

### 3.2 Sensor Readings & Historical Telemetry
- Store time-stamped multi-channel readings (`temperatureC`, `vibrationRms`, `rpm`, `acousticDb`) linked to `machineId`.
- Store per-machine warning/critical thresholds (`TelemetryThresholdConfig`).
- Query and downsample/window historical series for `"1H"`, `"6H"`, `"24H"`, and `"7D"` ranges.
- Evaluate `SensorCondition` (`thresholdExceeded`, `exceededSummary`, `status`) by comparing the latest reading against configured thresholds.

### 3.3 Alerts & Maintenance Events
- Persist threshold excursion alerts (`alerts`), scheduled/active work orders (`maintenance_work_orders`), and chronological audit events (`machine_events`).
- Support state updates (e.g., acknowledging an alert on `/dashboard` or updating work-order status).

### 3.4 Diagnostic Findings & Maintenance Recommendations
- Store structured engineering findings (`DiagnosticFinding`) with severity (`informational | low | medium | high | critical`), status (`open | under_review | action_planned | resolved`), and supporting evidence arrays.
- Store actionable maintenance recommendations (`MaintenanceRecommendation`) and persist status transitions (`pending_review | approved_local | scheduled | completed`).

### 3.5 Prediction Results & Future ML Integration
- Store prediction outputs (`healthScore`, `rulHours`, `anomalyProbability`, `aiConfidencePercent`, `modelBuildVersion`, and forecast trajectory points) in a dedicated `prediction_snapshots` table.
- Clearly tag each record's provenance (`sourceType: "fixture" | "rule_threshold" | "ml_model"`) so the UI never misrepresents rule-based or fixture values as verified ML model predictions.

---

## 4. Proposed API Design & Service Mapping

*(Note: The endpoints below are **proposed** routes to be created under `src/app/api/...` in future implementation phases. Only `/api/health` currently exists.)*

Every API endpoint will return the standardized `TelemetryServiceResponse<T>` envelope already defined in `src/services/telemetryAdapter.ts`:

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

### 4.1 Proposed Route Map

| Existing Adapter Function (`telemetryAdapter.ts`) | Proposed Next.js Route Handler | HTTP Method | Request Parameters / Body | Response Payload Type (`data`) | Validation & Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Healthcheck** *(Existing)* | `GET /api/health` | `GET` | None | `{ ok: boolean }` | Returns `500` if `SELECT 1` fails. |
| `loadDashboardPreviewBundle()` | `GET /api/dashboard` | `GET` | Optional `?timeRange=1H\|6H\|24H\|7D` | `DashboardBundlePayload` (`SystemStatusSummary`, `AssetSummaryMetric[]`, `MonitoredAssetStream[]`, `FleetHealthBucket[]`, `SubsystemHealthSummary[]`, `PredictiveAlert[]`, `MaintenanceWorkOrder[]`) | Validate `timeRange` enum; return `503` with `ERR-DASH-DB-FAILURE` if DB query fails. |
| `loadFleetPreviewBundle()` | `GET /api/fleet` | `GET` | Optional `?search=&status=&attention=&sortBy=&sortDir=` | `FleetBundlePayload` (`summary: FleetInventorySummary`, `machines: FleetMachineRecord[]`) | Validate `status` (`FleetOperatingStatus`), `sortBy` (`healthScore \| machineName`), `sortDir` (`asc \| desc`). |
| `loadFleetMachineDetailPreview(machineId)` | `GET /api/fleet/[machineId]` | `GET` | Path param: `machineId` | `FleetMachineRecord` | Validate non-empty `machineId`; return `404` (`status: "empty"`, `ERR-ASSET-NOT-FOUND`) if unknown. |
| `loadDigitalTwinPreviewProfiles()` | `GET /api/digital-twin` | `GET` | Optional `?machineId=TURB-GEN-04` | `DigitalTwinMachineProfile[]` | Validate `machineId` if provided; include `subAssemblies`, `sensorTrendsByRange`, `activeAlerts`, `recentEvents`. |
| `loadDiagnosticsPreviewProfiles()` | `GET /api/diagnostics` | `GET` | Optional `?machineId=&severity=&status=` | `MachineDiagnosticProfile[]` | Validate `DiagnosticSeverity` and `DiagnosticFindingStatus` filters. |
| *(Proposed Mutation)* Alert Ack | `PATCH /api/alerts/[alertId]` | `PATCH` | `{ acknowledged: boolean }` | `PredictiveAlert` | Validate boolean payload; return `404` if `alertId` not found, `400` on invalid body. |
| *(Proposed Mutation)* Recommendation Status | `PATCH /api/diagnostics/recommendations/[id]` | `PATCH` | `{ status: RecommendationActionStatus }` | `MaintenanceRecommendation` | Validate `status` against `RecommendationActionStatus` enum; log audit entry in `machine_events`. |
| *(Proposed Ingestion)* Sensor Telemetry | `POST /api/telemetry/ingest` | `POST` | `{ machineId, timestamp, temperatureC, vibrationRms, rpm, acousticDb }` | `{ recorded: true, machineId: string }` | Validate numeric ranges (e.g., `rpm >= 0`, `vibrationRms >= 0`); evaluate threshold rules. |

---

## 5. Database Storage Considerations (`src/db/schema.ts`)

Using the existing local PostgreSQL instance and Drizzle ORM (`drizzle-orm/pg-core`), the schema should be organized into 7 normalized tables:

1. **`system_metadata`**: Plant/sector identifiers, gateway node status, sampling rate, active model/rule build string (`SystemStatusSummary`).
2. **`machines`**: Primary key `machine_id` (`varchar`), name, equipment type, rotor configuration, plant, location zone, operating status, health score, latest sensor snapshot values, threshold limits, operating hours, maintenance status, and work-order reference.
3. **`machine_sub_assemblies`**: Foreign key `machine_id`, zone code (`de-bearing`, `stator-core`, `rotor-shaft`, `nde-bearing`), material spec, status, latest temperature/vibration, and engineering notes.
4. **`sensor_readings`**: Foreign key `machine_id`, `time_range_bucket` (`1H`, `6H`, `24H`, `7D`), `recorded_at` / `timestamp_label`, `temperature_c`, `vibration_rms`, `rpm`, `acoustic_db`, `anomaly_probability`, `is_forecast`. Indexed on `(machine_id, time_range_bucket, id)`.
5. **`alerts`**: Alert ID (`ALT-XXXX`), foreign key `machine_id`, severity, channel/sector, fault signature, reading summary, threshold limit, confidence/RUL fields, recommended action, `acknowledged` boolean, timestamps.
6. **`maintenance_work_orders`**: Work order ID (`WO-XXXX`), foreign key `machine_id`, task title, maintenance type, assigned team, lead engineer, scheduled window, duration, status, priority, linked alert ID.
7. **`diagnostic_findings` & `maintenance_recommendations` & `machine_events`**:
   - `diagnostic_findings`: Finding ID (`FND-XXXX`), `machine_id`, component, severity, status, `supporting_evidence` (`jsonb` string array), readings summary, threshold reference, recommended action, disclaimer.
   - `maintenance_recommendations`: Recommendation ID (`REC-XXX`), `machine_id`, component, action title, priority, supporting reason, status, completion note, estimated window, linked finding/work order.
   - `machine_events`: Event ID, `machine_id`, category, severity, title, detail/description, timestamps.

---

## 6. Data Validation & API Error Handling

- **Input Validation**:
  - Validate all query parameters (`machineId`, `status`, `severity`, `sortBy`, `timeRange`) and `PATCH`/`POST` request bodies using strict TypeScript type-guard validators (or `zod` if needed later) before executing Drizzle queries.
  - Reject malformed requests with HTTP `400 Bad Request` and a structured `TelemetryServiceResponse` (`status: "error"`, `errorCode: "ERR-VALIDATION-FAILED"`).
- **Strict Non-Fallback Error Policy**:
  - When `NEXT_PUBLIC_DATA_SOURCE_MODE="live_backend"` (or when calling live API routes), database or network failures must return HTTP `500`/`503` with `isFixturePreview: false` and render `DataErrorState` with a working retry callback.
  - The backend and service adapter must **never** silently return fixture records when a live database query fails.

---

## 7. Environment Variables & Deployment Considerations

| Variable Name | Scope | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server-only (`.env`) | PostgreSQL connection string consumed by `src/db/index.ts`. | **Confirmed & Present** |
| `NEXT_PUBLIC_DATA_SOURCE_MODE` | Client & Server | Controls default adapter mode (`"fixture_preview"` vs `"live_backend"`). Defaults to `"fixture_preview"` until backend seeding is complete. | **Proposed** |
| `ML_SERVICE_URL` | Server-only (Optional) | Optional URL for future external Python FastAPI inference sidecar. | **Proposed (Future)** |
| `ML_SERVICE_API_KEY` | Server-only (Optional) | Optional secret token for authenticating server-to-sidecar ML requests. | **Proposed (Future)** |

---

## 8. Recommended Phased Implementation Order

1. **Phase 7A — Database Schema & Seed Migration**:
   - Define the PostgreSQL tables in `src/db/schema.ts`.
   - Push schema via `npx drizzle-kit push`.
   - Create an idempotent database seed script that populates initial records from `src/data/fixtures.ts` so the database starts with consistent, testable baseline data while preserving `src/data/fixtures.ts` intact.
2. **Phase 7B — Read API Route Handlers (`/api/dashboard`, `/api/fleet`, `/api/digital-twin`, `/api/diagnostics`)**:
   - Implement Next.js Route Handlers querying PostgreSQL via Drizzle ORM and returning `TelemetryServiceResponse<T>`.
3. **Phase 7C — Write/Mutation Route Handlers & Frontend Adapter Switch**:
   - Implement `PATCH` endpoints for alert acknowledgment and maintenance recommendation status updates.
   - Update `src/services/telemetryAdapter.ts` to support live database/API queries alongside the existing `"fixture_preview"` mode.
4. **Phase 7D — Telemetry Ingestion & Rule/ML Evaluation Hook**:
   - Implement `POST /api/telemetry/ingest` for new sensor readings with automatic threshold comparison and alert/event generation.
