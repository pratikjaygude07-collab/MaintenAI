import type {
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
