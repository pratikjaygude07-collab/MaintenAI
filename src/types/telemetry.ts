export type SeverityLevel = "nominal" | "warning" | "critical";

export type TimeRangeKey = "1H" | "6H" | "24H" | "7D";

export type MaintenanceStatus = "in_progress" | "scheduled" | "completed";

export interface SystemStatusSummary {
  statusLabel: string;
  uptimePercent: number;
  lastSyncUtc: string;
  plantCode: string;
  sectorCode: string;
  gatewayNode: string;
  gatewaySyncPercent: number;
  activeModelBuild: string;
  samplingRateHz: number;
}

export interface AssetSummaryMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  deltaText: string;
  deltaTone: SeverityLevel | "info";
  thresholdText: string;
  status: SeverityLevel;
}

export interface TelemetryDataPoint {
  timestamp: string;
  vibrationRms: number; // mm/s
  bearingTempC: number; // °C
  acousticDb: number; // dB
  anomalyProbability: number; // 0 - 100%
  isForecast?: boolean;
}

export interface TelemetryThresholdConfig {
  vibrationWarning: number;
  vibrationCritical: number;
  tempWarning: number;
  tempCritical: number;
  acousticWarning: number;
  acousticCritical: number;
}

export interface MonitoredAssetStream {
  assetId: string;
  assetName: string;
  subsystem: string;
  locationZone: string;
  healthScore: number;
  status: SeverityLevel;
  rulHours: number;
  rpmNominal: number;
  thresholds: TelemetryThresholdConfig;
  seriesByRange: Record<TimeRangeKey, TelemetryDataPoint[]>;
}

export interface FleetHealthBucket {
  id: SeverityLevel;
  label: string;
  rangeDescription: string;
  assetCount: number;
  percentage: number;
}

export interface SubsystemHealthSummary {
  id: string;
  name: string;
  assetCount: number;
  healthPercent: number;
  meanRulHours: number;
  status: SeverityLevel;
  primaryMetricLabel: string;
  primaryMetricValue: string;
}

export interface PredictiveAlert {
  id: string;
  assetId: string;
  assetName: string;
  sector: string;
  severity: SeverityLevel;
  faultSignature: string;
  telemetryReading: string;
  thresholdLimit: string;
  aiConfidencePercent: number;
  estimatedRulHours: number;
  detectedRelative: string;
  detectedUtc: string;
  recommendedAction: string;
  acknowledged?: boolean;
}

export interface MaintenanceWorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  taskTitle: string;
  maintenanceType: "Predictive" | "Corrective" | "Calibration" | "Inspection";
  assignedTeam: string;
  leadEngineer: string;
  scheduledWindow: string;
  estimatedDuration: string;
  status: MaintenanceStatus;
  priority: "P1 - Urgent" | "P2 - High" | "P3 - Standard";
  triggerAlertId?: string;
}

export type FleetOperatingStatus =
  | "operational"
  | "warning"
  | "critical"
  | "maintenance";

export type FleetMaintenanceStatus =
  | "up_to_date"
  | "scheduled"
  | "in_progress"
  | "overdue";

export type FleetSortField = "healthScore" | "machineName";
export type SortDirection = "asc" | "desc";

export interface FleetMachineRecord {
  machineId: string;
  machineName: string;
  machineType: string;
  plant: string;
  locationZone: string;
  operatingStatus: FleetOperatingStatus;
  healthScore: number; // 0 - 100
  temperatureC: number;
  tempThresholdWarning: number;
  tempThresholdCritical: number;
  vibrationRms: number; // mm/s
  vibThresholdWarning: number;
  vibThresholdCritical: number;
  rpm: number;
  rpmNominal: number;
  lastUpdateRelative: string;
  lastUpdateUtc: string;
  maintenanceStatus: FleetMaintenanceStatus;
  maintenanceLabel: string;
  nextMaintenanceWindow: string;
  rulHours: number;
  needsAttention: boolean;
  activeFaultSignature?: string;
  workOrderId?: string;
  sensorChannels: number;
  gatewayNode: string;
}

export interface FleetInventorySummary {
  totalAssets: number;
  operationalAssets: number;
  attentionAssets: number;
  criticalAssets: number;
  fixtureSourceTag: string;
}

export interface DigitalTwinSensorPoint {
  timestamp: string;
  temperatureC: number;
  vibrationRms: number;
  rpm: number;
  acousticDb: number;
}

export interface DigitalTwinSubAssembly {
  id: string;
  code: string;
  name: string;
  status: SeverityLevel;
  temperatureC: number;
  vibrationRms: number;
  materialSpec: string;
  notes: string;
}

export interface DigitalTwinMachineEvent {
  id: string;
  timestampUtc: string;
  relativeTime: string;
  category: "TELEMETRY" | "MAINTENANCE" | "THRESHOLD" | "CALIBRATION";
  severity: SeverityLevel | "info";
  title: string;
  detail: string;
}

export interface DigitalTwinAlertFixture {
  id: string;
  severity: SeverityLevel;
  channel: string;
  title: string;
  readingSummary: string;
  thresholdSummary: string;
  loggedAt: string;
  fixtureNote: string;
}

export interface DigitalTwinMachineProfile {
  machineId: string;
  machineName: string;
  equipmentType: string;
  rotorConfiguration: "turbine" | "spindle" | "compressor" | "pump" | "press";
  plant: string;
  locationZone: string;
  operatingStatus: FleetOperatingStatus;
  healthScore: number;
  temperatureC: number;
  tempWarningC: number;
  tempCriticalC: number;
  vibrationRms: number;
  vibWarningRms: number;
  vibCriticalRms: number;
  rpm: number;
  rpmNominal: number;
  rpmMinBand: number;
  rpmMaxBand: number;
  acousticDb: number;
  acousticWarningDb: number;
  operatingHours: number;
  maintenanceStatus: FleetMaintenanceStatus;
  maintenanceLabel: string;
  maintenanceWindow: string;
  assignedTeam: string;
  leadTechnician: string;
  workOrderRef: string;
  lastUpdateRelative: string;
  lastUpdateUtc: string;
  subAssemblies: DigitalTwinSubAssembly[];
  sensorTrendsByRange: Record<TimeRangeKey, DigitalTwinSensorPoint[]>;
  activeAlerts: DigitalTwinAlertFixture[];
  recentEvents: DigitalTwinMachineEvent[];
}

export type DiagnosticSeverity =
  | "informational"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type DiagnosticFindingStatus =
  | "open"
  | "under_review"
  | "action_planned"
  | "resolved";

export type DiagnosticReviewState =
  | "requires_review"
  | "in_review"
  | "verified_baseline";

export type RecommendationActionStatus =
  | "pending_review"
  | "approved_local"
  | "scheduled"
  | "completed";

export interface SensorCondition {
  id: string;
  metricKey: "vibration" | "temperature" | "rpm" | "acoustic";
  label: string;
  channelCode: string;
  currentReading: number;
  unit: string;
  status: SeverityLevel;
  normalRangeText: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  nominalReference?: number;
  thresholdExceeded: boolean;
  exceededSummary?: string;
}

export interface DiagnosticFinding {
  id: string;
  machineId: string;
  machineName: string;
  affectedComponent: string;
  componentCode: string;
  title: string;
  severity: DiagnosticSeverity;
  status: DiagnosticFindingStatus;
  supportingEvidence: string[];
  sensorReadingsSummary: string;
  thresholdReference: string;
  recommendedNextAction?: string;
  lastUpdatedUtc: string;
  lastUpdatedRelative: string;
  fixtureDisclaimer: string;
}

export interface MaintenanceRecommendation {
  id: string;
  machineId: string;
  machineName: string;
  associatedComponent: string;
  actionTitle: string;
  priority: "P1 - Immediate" | "P2 - High" | "P3 - Routine";
  supportingReason: string;
  suggestedStatus: RecommendationActionStatus;
  completionStatus: string;
  estimatedWindow: string;
  linkedFindingId?: string;
  workOrderRef?: string;
}

export type DiagnosticEventCategory =
  | "THRESHOLD_EXCEEDED"
  | "CONDITION_CHANGED"
  | "DIAGNOSTIC_REVIEW"
  | "MAINTENANCE_ACTION";

export interface DiagnosticEvent {
  id: string;
  machineId: string;
  machineName: string;
  timestampUtc: string;
  relativeTime: string;
  category: DiagnosticEventCategory;
  severity: SeverityLevel | "info";
  title: string;
  description: string;
}

export interface MachineDiagnosticProfile {
  machineId: string;
  machineName: string;
  equipmentType: string;
  plant: string;
  locationZone: string;
  operatingStatus: FleetOperatingStatus;
  healthScore: number;
  diagnosticReviewStatus: DiagnosticReviewState;
  diagnosticReviewLabel: string;
  lastDiagnosticSyncUtc: string;
  lastDiagnosticSyncRelative: string;
  maintenanceSummary: {
    statusLabel: string;
    workOrderRef: string;
    scheduledWindow: string;
    assignedCrew: string;
  };
  sensorConditions: SensorCondition[];
  sensorTrendsByRange: Record<TimeRangeKey, DigitalTwinSensorPoint[]>;
  activeAlerts: DigitalTwinAlertFixture[];
  findings: DiagnosticFinding[];
  recommendations: MaintenanceRecommendation[];
  timelineEvents: DiagnosticEvent[];
}

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  code: string;
  phase: "PHASE 1" | "PHASE 2" | "PHASE 3" | "PHASE 4";
  badgeText?: string;
  badgeTone?: SeverityLevel | "cyan";
}

export interface PhaseRouteBlueprint {
  route: string;
  code: string;
  title: string;
  subtitle: string;
  phaseLabel: string;
  summary: string;
  plannedModules: {
    code: string;
    title: string;
    description: string;
    telemetrySignals: string[];
  }[];
  dataContractPreview: {
    field: string;
    type: string;
    description: string;
  }[];
}
