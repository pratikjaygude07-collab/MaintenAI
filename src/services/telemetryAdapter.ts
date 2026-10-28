import type {
  Ai4iDatasetSummary,
  Ai4iMachineType,
  Ai4iRecordsPage,
  Ai4iTelemetryRecord,
  AssetSummaryMetric,
  DigitalTwinMachineProfile,
  FleetHealthBucket,
  FleetInventorySummary,
  FleetMachineRecord,
  MachineDiagnosticProfile,
  MaintenanceWorkOrder,
  MonitoredAssetStream,
  PredictiveAlert,
  SubsystemHealthSummary,
  SystemStatusSummary,
} from "@/types/telemetry";
import {
  ASSET_SUMMARY_METRICS,
  DIGITAL_TWIN_MACHINE_PROFILES,
  FLEET_HEALTH_BUCKETS,
  FLEET_MACHINE_INVENTORY,
  MACHINE_DIAGNOSTIC_PROFILES,
  MAINTENANCE_WORK_ORDERS,
  MONITORED_ASSET_STREAMS,
  RECENT_PREDICTIVE_ALERTS,
  SUBSYSTEM_HEALTH_SUMMARIES,
  SYSTEM_STATUS_FIXTURE,
  getFleetInventorySummary,
  getFleetMachineById,
} from "@/data/fixtures";
import { ai4iTelemetryRecords } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Frontend Data Source Mode.
 * - "fixture_preview": Uses isolated local frontend fixtures for UI preview.
 * - "live_backend": Reserved for Manmath's backend integration. Never falls back
 *   silently to fixture data if a live request fails or is unconfigured.
 */
export type TelemetryDataSourceMode = "fixture_preview" | "live_backend";

export interface TelemetryServiceResponse<T> {
  status: "ready" | "empty" | "unavailable" | "error";
  data: T | null;
  isFixturePreview: boolean;
  sourceTag: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface DashboardBundlePayload {
  systemStatus: SystemStatusSummary;
  metrics: AssetSummaryMetric[];
  streams: MonitoredAssetStream[];
  buckets: FleetHealthBucket[];
  subsystems: SubsystemHealthSummary[];
  alerts: PredictiveAlert[];
  workOrders: MaintenanceWorkOrder[];
}

export interface FleetBundlePayload {
  summary: FleetInventorySummary;
  machines: FleetMachineRecord[];
}

function createLiveBackendUnconfiguredError<T>(
  moduleCode: string
): TelemetryServiceResponse<T> {
  return {
    status: "unavailable",
    data: null,
    isFixturePreview: false,
    sourceTag: `LIVE BACKEND UNCONFIGURED // ${moduleCode}`,
    errorCode: `ERR-${moduleCode}-BACKEND-NOT-CONNECTED`,
    errorMessage:
      "Live backend service adapter is not connected yet. Do not silently substitute fixture data for failed or unconfigured live requests.",
  };
}

export function loadDashboardPreviewBundle(
  mode: TelemetryDataSourceMode = "fixture_preview"
): TelemetryServiceResponse<DashboardBundlePayload> {
  if (mode !== "fixture_preview") {
    return createLiveBackendUnconfiguredError("DASH");
  }

  return {
    status: "ready",
    isFixturePreview: true,
    sourceTag: "LOCAL FIXTURE DATASET // SYS-DASH-V2.4",
    data: {
      systemStatus: SYSTEM_STATUS_FIXTURE,
      metrics: ASSET_SUMMARY_METRICS,
      streams: MONITORED_ASSET_STREAMS,
      buckets: FLEET_HEALTH_BUCKETS,
      subsystems: SUBSYSTEM_HEALTH_SUMMARIES,
      alerts: RECENT_PREDICTIVE_ALERTS,
      workOrders: MAINTENANCE_WORK_ORDERS,
    },
  };
}

export function loadFleetPreviewBundle(
  mode: TelemetryDataSourceMode = "fixture_preview"
): TelemetryServiceResponse<FleetBundlePayload> {
  if (mode !== "fixture_preview") {
    return createLiveBackendUnconfiguredError("FLEET");
  }

  return {
    status: "ready",
    isFixturePreview: true,
    sourceTag: "LOCAL FIXTURE DATASET // FLT-INV-V2.4",
    data: {
      summary: getFleetInventorySummary(FLEET_MACHINE_INVENTORY),
      machines: FLEET_MACHINE_INVENTORY,
    },
  };
}

export function loadFleetMachineDetailPreview(
  machineId: string,
  mode: TelemetryDataSourceMode = "fixture_preview"
): TelemetryServiceResponse<FleetMachineRecord> {
  if (mode !== "fixture_preview") {
    return createLiveBackendUnconfiguredError("FLEET-DETAIL");
  }

  const record = getFleetMachineById(machineId);
  if (!record) {
    return {
      status: "empty",
      data: null,
      isFixturePreview: true,
      sourceTag: "LOCAL FIXTURE DATASET // FLT-INV-V2.4",
      errorCode: "ERR-ASSET-NOT-FOUND",
      errorMessage: `Machine "${machineId}" was not found in the local fixture registry.`,
    };
  }

  return {
    status: "ready",
    data: record,
    isFixturePreview: true,
    sourceTag: "LOCAL FIXTURE DATASET // FLT-INV-V2.4",
  };
}

export function loadDigitalTwinPreviewProfiles(
  mode: TelemetryDataSourceMode = "fixture_preview"
): TelemetryServiceResponse<DigitalTwinMachineProfile[]> {
  if (mode !== "fixture_preview") {
    return createLiveBackendUnconfiguredError("TWIN");
  }

  return {
    status: "ready",
    data: DIGITAL_TWIN_MACHINE_PROFILES,
    isFixturePreview: true,
    sourceTag: "LOCAL FIXTURE DATASET // TWN-3D-V2.4",
  };
}

export function loadDiagnosticsPreviewProfiles(
  mode: TelemetryDataSourceMode = "fixture_preview"
): TelemetryServiceResponse<MachineDiagnosticProfile[]> {
  if (mode !== "fixture_preview") {
    return createLiveBackendUnconfiguredError("DIAG");
  }

  return {
    status: "ready",
    data: MACHINE_DIAGNOSTIC_PROFILES,
    isFixturePreview: true,
    sourceTag: "LOCAL FIXTURE DATASET // DGN-WB-V2.4",
  };
}

// ============================================================================
// AI4I 2020 DATASET ADAPTER
// ============================================================================

const AI4I_DATASET_SOURCE_URL =
  "https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset";
const AI4I_DATASET_LICENSE = "CC BY 4.0";
const AI4I_DATASET_NAME = "ai4i_2020";

function createAi4iLiveBackendUnconfiguredError<T>(
  moduleCode: string
): TelemetryServiceResponse<T> {
  return {
    status: "unavailable",
    data: null,
    isFixturePreview: false,
    sourceTag: `LIVE BACKEND UNCONFIGURED // ${moduleCode}`,
    errorCode: `ERR-${moduleCode}-BACKEND-NOT-CONNECTED`,
    errorMessage:
      "AI4I dataset records require live_backend mode and a connected PostgreSQL database. Do not silently substitute fixture data.",
  };
}

function mapDbRowToAi4iRecord(row: {
  id: number;
  udi: number;
  productId: string;
  type: string;
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  machineFailure: boolean;
  twf: boolean;
  hdf: boolean;
  pwf: boolean;
  osf: boolean;
  rnf: boolean;
  dataOrigin: string;
  isFixtureSeed: boolean;
  importedAt: Date;
  sourceFile: string;
  sourceDataset: string;
}): Ai4iTelemetryRecord {
  return {
    id: row.id,
    udi: row.udi,
    productId: row.productId,
    type: row.type as Ai4iMachineType,
    airTemperatureK: row.airTemperatureK,
    processTemperatureK: row.processTemperatureK,
    rotationalSpeedRpm: row.rotationalSpeedRpm,
    torqueNm: row.torqueNm,
    toolWearMin: row.toolWearMin,
    machineFailure: row.machineFailure,
    twf: row.twf,
    hdf: row.hdf,
    pwf: row.pwf,
    osf: row.osf,
    rnf: row.rnf,
    dataOrigin: row.dataOrigin,
    isFixtureSeed: row.isFixtureSeed,
    importedAt: row.importedAt.toISOString(),
    sourceFile: row.sourceFile,
    sourceDataset: row.sourceDataset,
  };
}

export async function loadAi4iRecords(
  mode: TelemetryDataSourceMode = "fixture_preview",
  opts: {
    page?: number;
    pageSize?: number;
    type?: Ai4iMachineType;
    machineFailure?: boolean;
  } = {}
): Promise<TelemetryServiceResponse<Ai4iRecordsPage>> {
  if (mode !== "live_backend") {
    return createAi4iLiveBackendUnconfiguredError("AI4I-RECORDS");
  }

  const { page = 1, pageSize = 50, type, machineFailure } = opts;
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.min(100, Math.max(1, pageSize));
  const offset = (validatedPage - 1) * validatedPageSize;

  const { db } = await import("@/db");

  try {
    const conditions: any[] = [];
    if (type) {
      conditions.push(eq(ai4iTelemetryRecords.type, type));
    }
    if (machineFailure !== undefined) {
      conditions.push(eq(ai4iTelemetryRecords.machineFailure, machineFailure));
    }

    const baseQuery = db
      .select()
      .from(ai4iTelemetryRecords)
      .orderBy(ai4iTelemetryRecords.udi);

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [allRows, countResult] = await Promise.all([
      whereClause
        ? baseQuery
            .where(whereClause)
            .limit(validatedPageSize)
            .offset(offset)
        : baseQuery.limit(validatedPageSize).offset(offset),
      db
        .select({ count: ai4iTelemetryRecords.id })
        .from(ai4iTelemetryRecords)
        .where(whereClause),
    ]);

    const total = Number((countResult[0]?.count as any) ?? 0);
    const totalPages = Math.ceil(total / validatedPageSize);

    return {
      status: "ready",
      data: {
        records: allRows.map(mapDbRowToAi4iRecord),
        total,
        page: validatedPage,
        pageSize: validatedPageSize,
        totalPages,
      },
      isFixturePreview: false,
      sourceTag: `AI4I DATASET // DB-BACKED // ${AI4I_DATASET_NAME}`,
    };
  } catch (err) {
    return {
      status: "error",
      data: null,
      isFixturePreview: false,
      sourceTag: `AI4I DATASET // DB-ERROR`,
      errorCode: "ERR-AI4I-RECORDS-DB-FAILURE",
      errorMessage:
        err instanceof Error
          ? "Failed to read AI4I records from the database."
          : "Unknown database error.",
    };
  }
}

export async function loadAi4iSummary(
  mode: TelemetryDataSourceMode = "fixture_preview"
): Promise<TelemetryServiceResponse<Ai4iDatasetSummary>> {
  if (mode !== "live_backend") {
    return createAi4iLiveBackendUnconfiguredError("AI4I-SUMMARY");
  }

  const { db } = await import("@/db");

  try {
    const rows = await db
      .select()
      .from(ai4iTelemetryRecords)
      .orderBy(ai4iTelemetryRecords.udi);

    const totalRecords = rows.length;
    const failureCount = rows.filter((r) => r.machineFailure).length;
    const failureRate =
      totalRecords > 0 ? (failureCount / totalRecords) * 100 : 0;

    const failureByMode: Record<string, number> = {};
    const recordsByType: Record<string, number> = {};

    for (const row of rows) {
      if (row.twf) failureByMode["twf"] = (failureByMode["twf"] ?? 0) + 1;
      if (row.hdf) failureByMode["hdf"] = (failureByMode["hdf"] ?? 0) + 1;
      if (row.pwf) failureByMode["pwf"] = (failureByMode["pwf"] ?? 0) + 1;
      if (row.osf) failureByMode["osf"] = (failureByMode["osf"] ?? 0) + 1;
      if (row.rnf) failureByMode["rnf"] = (failureByMode["rnf"] ?? 0) + 1;

      const t = row.type;
      recordsByType[t] = (recordsByType[t] ?? 0) + 1;
    }

    return {
      status: "ready",
      data: {
        totalRecords,
        failureCount,
        failureRate,
        failureByMode,
        recordsByType,
        sourceDataset: "ai4i_2020",
        sourceUrl: AI4I_DATASET_SOURCE_URL,
        license: AI4I_DATASET_LICENSE,
        isSynthetic: true,
      },
      isFixturePreview: false,
      sourceTag: `AI4I DATASET // DB-BACKED // ${AI4I_DATASET_NAME}`,
    };
  } catch (err) {
    return {
      status: "error",
      data: null,
      isFixturePreview: false,
      sourceTag: `AI4I DATASET // DB-ERROR`,
      errorCode: "ERR-AI4I-SUMMARY-DB-FAILURE",
      errorMessage:
        err instanceof Error
          ? "Failed to read AI4I summary from the database."
          : "Unknown database error.",
    };
  }
}
