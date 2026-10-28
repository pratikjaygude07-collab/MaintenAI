import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================================================
// 1. POSTGRESQL ENUMERATED TYPES
// ============================================================================

export const severityLevelEnum = pgEnum("severity_level", [
  "nominal",
  "warning",
  "critical",
]);

export const eventSeverityEnum = pgEnum("event_severity", [
  "nominal",
  "warning",
  "critical",
  "info",
]);

export const timeRangeWindowEnum = pgEnum("time_range_window", [
  "1H",
  "6H",
  "24H",
  "7D",
]);

export const fleetOperatingStatusEnum = pgEnum("fleet_operating_status", [
  "operational",
  "warning",
  "critical",
  "maintenance",
]);

export const fleetMaintenanceStatusEnum = pgEnum("fleet_maintenance_status", [
  "up_to_date",
  "scheduled",
  "in_progress",
  "overdue",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "in_progress",
  "scheduled",
  "completed",
]);

export const workOrderTypeEnum = pgEnum("work_order_type", [
  "Predictive",
  "Corrective",
  "Calibration",
  "Inspection",
]);

export const rotorConfigEnum = pgEnum("rotor_configuration", [
  "turbine",
  "spindle",
  "compressor",
  "pump",
  "press",
]);

export const sensorMetricKeyEnum = pgEnum("sensor_metric_key", [
  "vibration",
  "temperature",
  "rpm",
  "acoustic",
]);

export const diagnosticSeverityEnum = pgEnum("diagnostic_severity", [
  "informational",
  "low",
  "medium",
  "high",
  "critical",
]);

export const diagnosticFindingStatusEnum = pgEnum(
  "diagnostic_finding_status",
  ["open", "under_review", "action_planned", "resolved"]
);

export const diagnosticReviewStateEnum = pgEnum("diagnostic_review_state", [
  "requires_review",
  "in_review",
  "verified_baseline",
]);

export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "pending_review",
  "approved_local",
  "scheduled",
  "completed",
]);

export const dataOriginEnum = pgEnum("data_origin", [
  "development_fixture",
  "rule_evaluated",
  "operational_telemetry",
]);

// ============================================================================
// 2. SITES / PLANTS & SYSTEM METADATA
// ============================================================================

export const sites = pgTable("sites", {
  plantCode: varchar("plant_code", { length: 64 }).primaryKey(),
  plantName: varchar("plant_name", { length: 160 }).notNull(),
  primarySectorCode: varchar("primary_sector_code", { length: 64 }).notNull(),
  gatewayNode: varchar("gateway_node", { length: 64 }).notNull(),
  gatewaySyncPercent: doublePrecision("gateway_sync_percent")
    .notNull()
    .default(99.98),
  statusLabel: varchar("status_label", { length: 64 })
    .notNull()
    .default("SYSTEM NOMINAL"),
  uptimePercent: doublePrecision("uptime_percent").notNull().default(98.4),
  samplingRateHz: integer("sampling_rate_hz").notNull().default(25600),
  activeModelBuild: varchar("active_model_build", { length: 128 }).notNull(),
  lastSyncDisplayUtc: varchar("last_sync_display_utc", { length: 64 }).notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dataOrigin: dataOriginEnum("data_origin")
    .notNull()
    .default("development_fixture"),
  isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// 3. MACHINES (FLEET, DIGITAL TWIN & DIAGNOSTICS CORE ASSET REGISTRY)
// ============================================================================

export const machines = pgTable(
  "machines",
  {
    machineId: varchar("machine_id", { length: 64 }).primaryKey(),
    plantCode: varchar("plant_code", { length: 64 })
      .notNull()
      .references(() => sites.plantCode, { onDelete: "restrict" }),
    machineName: varchar("machine_name", { length: 160 }).notNull(),
    machineType: varchar("machine_type", { length: 160 }).notNull(),
    subsystem: varchar("subsystem", { length: 128 })
      .notNull()
      .default("Rotating Machinery"),
    rotorConfiguration: rotorConfigEnum("rotor_configuration")
      .notNull()
      .default("turbine"),
    locationZone: varchar("location_zone", { length: 160 }).notNull(),
    operatingStatus: fleetOperatingStatusEnum("operating_status")
      .notNull()
      .default("operational"),
    severityStatus: severityLevelEnum("severity_status")
      .notNull()
      .default("nominal"),
    healthScore: doublePrecision("health_score").notNull(),
    temperatureC: doublePrecision("temperature_c").notNull(),
    tempThresholdWarning: doublePrecision("temp_threshold_warning").notNull(),
    tempThresholdCritical: doublePrecision("temp_threshold_critical").notNull(),
    vibrationRms: doublePrecision("vibration_rms").notNull(),
    vibThresholdWarning: doublePrecision("vib_threshold_warning").notNull(),
    vibThresholdCritical: doublePrecision("vib_threshold_critical").notNull(),
    rpm: integer("rpm").notNull(),
    rpmNominal: integer("rpm_nominal").notNull(),
    rpmMinBand: integer("rpm_min_band").notNull().default(0),
    rpmMaxBand: integer("rpm_max_band").notNull().default(20000),
    acousticDb: doublePrecision("acoustic_db").notNull().default(70.0),
    acousticThresholdWarning: doublePrecision("acoustic_threshold_warning")
      .notNull()
      .default(82.0),
    acousticThresholdCritical: doublePrecision("acoustic_threshold_critical")
      .notNull()
      .default(90.0),
    operatingHours: integer("operating_hours").notNull().default(10000),
    rulHours: integer("rul_hours").notNull(),
    needsAttention: boolean("needs_attention").notNull().default(false),
    activeFaultSignature: text("active_fault_signature"),
    maintenanceStatus: fleetMaintenanceStatusEnum("maintenance_status")
      .notNull()
      .default("up_to_date"),
    maintenanceLabel: varchar("maintenance_label", { length: 160 }).notNull(),
    nextMaintenanceWindow: varchar("next_maintenance_window", {
      length: 160,
    }).notNull(),
    assignedTeam: varchar("assigned_team", { length: 160 }),
    leadTechnician: varchar("lead_technician", { length: 120 }),
    workOrderId: varchar("work_order_id", { length: 64 }),
    diagnosticReviewStatus: diagnosticReviewStateEnum(
      "diagnostic_review_status"
    )
      .notNull()
      .default("verified_baseline"),
    diagnosticReviewLabel: varchar("diagnostic_review_label", { length: 160 })
      .notNull()
      .default("Baseline Verified"),
    sensorChannelsCount: integer("sensor_channels_count").notNull().default(8),
    gatewayNode: varchar("gateway_node", { length: 64 }).notNull(),
    lastUpdateRelative: varchar("last_update_relative", {
      length: 64,
    }).notNull(),
    lastUpdateUtc: varchar("last_update_utc", { length: 64 }).notNull(),
    lastTelemetryAt: timestamp("last_telemetry_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("machines_plant_status_idx").on(
      table.plantCode,
      table.operatingStatus
    ),
    index("machines_health_score_idx").on(table.healthScore),
    index("machines_needs_attention_idx").on(table.needsAttention),
  ]
);

// ============================================================================
// 4. MACHINE SUB-ASSEMBLIES (3D DIGITAL TWIN STRUCTURAL ZONES)
// ============================================================================

export const machineSubAssemblies = pgTable(
  "machine_sub_assemblies",
  {
    id: serial("id").primaryKey(),
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    subAssemblyKey: varchar("sub_assembly_key", { length: 64 }).notNull(), // e.g., de-bearing, stator-core
    code: varchar("code", { length: 64 }).notNull(), // e.g., ASM-01 // DE-BRG
    name: varchar("name", { length: 160 }).notNull(),
    status: severityLevelEnum("status").notNull().default("nominal"),
    temperatureC: doublePrecision("temperature_c").notNull(),
    vibrationRms: doublePrecision("vibration_rms").notNull(),
    materialSpec: varchar("material_spec", { length: 200 }).notNull(),
    notes: text("notes").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("machine_sub_assembly_unique_idx").on(
      table.machineId,
      table.subAssemblyKey
    ),
    index("machine_sub_assemblies_machine_idx").on(table.machineId),
  ]
);

// ============================================================================
// 5. SENSOR CHANNELS & CONDITION EVALUATION
// ============================================================================

export const sensorChannels = pgTable(
  "sensor_channels",
  {
    channelId: varchar("channel_id", { length: 96 }).primaryKey(), // e.g., sc-turb-vib
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    metricKey: sensorMetricKeyEnum("metric_key").notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    channelCode: varchar("channel_code", { length: 64 }).notNull(),
    currentReading: doublePrecision("current_reading").notNull(),
    unit: varchar("unit", { length: 32 }).notNull(),
    status: severityLevelEnum("status").notNull().default("nominal"),
    normalRangeText: varchar("normal_range_text", { length: 120 }).notNull(),
    warningThreshold: doublePrecision("warning_threshold"),
    criticalThreshold: doublePrecision("critical_threshold"),
    nominalReference: doublePrecision("nominal_reference"),
    thresholdExceeded: boolean("threshold_exceeded").notNull().default(false),
    exceededSummary: text("exceeded_summary"),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sensor_channels_machine_metric_unique_idx").on(
      table.machineId,
      table.metricKey
    ),
    index("sensor_channels_machine_idx").on(table.machineId),
  ]
);

// ============================================================================
// 6. TELEMETRY READINGS & AGGREGATED TIME-WINDOW TRENDS (1H, 6H, 24H, 7D)
// ============================================================================

export const telemetryReadings = pgTable(
  "telemetry_readings",
  {
    id: serial("id").primaryKey(),
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    timeRange: timeRangeWindowEnum("time_range").notNull(),
    sampleIndex: integer("sample_index").notNull(),
    timestampLabel: varchar("timestamp_label", { length: 64 }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    temperatureC: doublePrecision("temperature_c").notNull(),
    vibrationRms: doublePrecision("vibration_rms").notNull(),
    rpm: integer("rpm").notNull(),
    acousticDb: doublePrecision("acoustic_db").notNull(),
    anomalyProbability: doublePrecision("anomaly_probability"),
    isForecast: boolean("is_forecast").notNull().default(false),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
  },
  (table) => [
    uniqueIndex("telemetry_readings_machine_range_sample_unique_idx").on(
      table.machineId,
      table.timeRange,
      table.sampleIndex
    ),
    index("telemetry_readings_machine_range_idx").on(
      table.machineId,
      table.timeRange
    ),
    index("telemetry_readings_recorded_at_idx").on(table.recordedAt),
  ]
);

// ============================================================================
// 7. ALERTS (THRESHOLD EXCURSIONS & PREDICTIVE ANOMALIES)
// ============================================================================

export const alerts = pgTable(
  "alerts",
  {
    alertId: varchar("alert_id", { length: 64 }).primaryKey(), // e.g., ALT-9042
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    sector: varchar("sector", { length: 120 }).notNull(),
    channelCode: varchar("channel_code", { length: 96 }),
    severity: severityLevelEnum("severity").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    faultSignature: varchar("fault_signature", { length: 240 }).notNull(),
    telemetryReading: varchar("telemetry_reading", { length: 160 }).notNull(),
    thresholdLimit: varchar("threshold_limit", { length: 160 }).notNull(),
    aiConfidencePercent: doublePrecision("ai_confidence_percent"),
    estimatedRulHours: integer("estimated_rul_hours"),
    detectedRelative: varchar("detected_relative", { length: 64 }).notNull(),
    detectedUtc: varchar("detected_utc", { length: 64 }).notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    recommendedAction: text("recommended_action").notNull(),
    acknowledged: boolean("acknowledged").notNull().default(false),
    fixtureNote: text("fixture_note")
      .notNull()
      .default(
        "Illustrative development fixture record — not a live operational alert."
      ),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
  },
  (table) => [
    index("alerts_machine_severity_idx").on(table.machineId, table.severity),
    index("alerts_detected_at_idx").on(table.detectedAt),
  ]
);

// ============================================================================
// 8. MAINTENANCE WORK ORDERS
// ============================================================================

export const maintenanceWorkOrders = pgTable(
  "maintenance_work_orders",
  {
    workOrderId: varchar("work_order_id", { length: 64 }).primaryKey(), // e.g., WO-8841
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    taskTitle: varchar("task_title", { length: 240 }).notNull(),
    maintenanceType: workOrderTypeEnum("maintenance_type").notNull(),
    assignedTeam: varchar("assigned_team", { length: 160 }).notNull(),
    leadEngineer: varchar("lead_engineer", { length: 120 }).notNull(),
    scheduledWindow: varchar("scheduled_window", { length: 160 }).notNull(),
    estimatedDuration: varchar("estimated_duration", { length: 64 }).notNull(),
    status: workOrderStatusEnum("status").notNull().default("scheduled"),
    priority: varchar("priority", { length: 64 }).notNull(),
    triggerAlertId: varchar("trigger_alert_id", { length: 64 }),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("work_orders_machine_status_idx").on(table.machineId, table.status),
  ]
);

// ============================================================================
// 9. DIAGNOSTIC FINDINGS & SUPPORTING EVIDENCE
// ============================================================================

export const diagnosticFindings = pgTable(
  "diagnostic_findings",
  {
    findingId: varchar("finding_id", { length: 64 }).primaryKey(), // e.g., FND-4012
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    affectedComponent: varchar("affected_component", { length: 200 }).notNull(),
    componentCode: varchar("component_code", { length: 64 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    severity: diagnosticSeverityEnum("severity").notNull(),
    status: diagnosticFindingStatusEnum("status").notNull().default("open"),
    supportingEvidence: jsonb("supporting_evidence")
      .$type<string[]>()
      .notNull(),
    sensorReadingsSummary: varchar("sensor_readings_summary", {
      length: 200,
    }).notNull(),
    thresholdReference: varchar("threshold_reference", {
      length: 200,
    }).notNull(),
    recommendedNextAction: text("recommended_next_action"),
    lastUpdatedUtc: varchar("last_updated_utc", { length: 64 }).notNull(),
    lastUpdatedRelative: varchar("last_updated_relative", {
      length: 64,
    }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fixtureDisclaimer: text("fixture_disclaimer")
      .notNull()
      .default(
        "Illustrative frontend fixture record — not a live AI or verified engineering diagnosis."
      ),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
  },
  (table) => [
    index("diagnostic_findings_machine_sev_status_idx").on(
      table.machineId,
      table.severity,
      table.status
    ),
  ]
);

// ============================================================================
// 10. MAINTENANCE RECOMMENDATIONS
// ============================================================================

export const maintenanceRecommendations = pgTable(
  "maintenance_recommendations",
  {
    recommendationId: varchar("recommendation_id", {
      length: 64,
    }).primaryKey(), // e.g., REC-301
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    associatedComponent: varchar("associated_component", {
      length: 200,
    }).notNull(),
    actionTitle: varchar("action_title", { length: 240 }).notNull(),
    priority: varchar("priority", { length: 64 }).notNull(),
    supportingReason: text("supporting_reason").notNull(),
    suggestedStatus: recommendationStatusEnum("suggested_status")
      .notNull()
      .default("pending_review"),
    completionStatus: varchar("completion_status", { length: 200 }).notNull(),
    estimatedWindow: varchar("estimated_window", { length: 160 }).notNull(),
    linkedFindingId: varchar("linked_finding_id", { length: 64 }).references(
      () => diagnosticFindings.findingId,
      { onDelete: "set null" }
    ),
    workOrderRef: varchar("work_order_ref", { length: 64 }),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("maintenance_recommendations_machine_status_idx").on(
      table.machineId,
      table.suggestedStatus
    ),
  ]
);

// ============================================================================
// 11. MACHINE EVENTS (DIGITAL TWIN & DIAGNOSTICS TIMELINES)
// ============================================================================

export const machineEvents = pgTable(
  "machine_events",
  {
    eventId: varchar("event_id", { length: 64 }).primaryKey(), // e.g., EVT-401, DEVT-901
    machineId: varchar("machine_id", { length: 64 })
      .notNull()
      .references(() => machines.machineId, { onDelete: "cascade" }),
    eventScope: varchar("event_scope", { length: 32 }).notNull(), // "digital_twin" | "diagnostics"
    category: varchar("category", { length: 64 }).notNull(),
    severity: eventSeverityEnum("severity").notNull().default("info"),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description").notNull(),
    timestampUtc: varchar("timestamp_utc", { length: 64 }).notNull(),
    relativeTime: varchar("relative_time", { length: 64 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dataOrigin: dataOriginEnum("data_origin")
      .notNull()
      .default("development_fixture"),
    isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
  },
  (table) => [
    index("machine_events_machine_scope_idx").on(
      table.machineId,
      table.eventScope
    ),
    index("machine_events_occurred_at_idx").on(table.occurredAt),
  ]
);

// ============================================================================
// 12. DASHBOARD SUMMARY METRICS & SUBSYSTEM COHORT ROLLUPS
// ============================================================================

export const dashboardKpiMetrics = pgTable("dashboard_kpi_metrics", {
  metricId: varchar("metric_id", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  value: varchar("value", { length: 64 }).notNull(),
  unit: varchar("unit", { length: 32 }),
  deltaText: varchar("delta_text", { length: 120 }).notNull(),
  deltaTone: varchar("delta_tone", { length: 32 }).notNull(),
  thresholdText: varchar("threshold_text", { length: 120 }).notNull(),
  status: severityLevelEnum("status").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  dataOrigin: dataOriginEnum("data_origin")
    .notNull()
    .default("development_fixture"),
  isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
});

export const subsystemHealthRollups = pgTable("subsystem_health_rollups", {
  subsystemId: varchar("subsystem_id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  assetCount: integer("asset_count").notNull(),
  healthPercent: doublePrecision("health_percent").notNull(),
  meanRulHours: integer("mean_rul_hours").notNull(),
  status: severityLevelEnum("status").notNull(),
  primaryMetricLabel: varchar("primary_metric_label", { length: 96 }).notNull(),
  primaryMetricValue: varchar("primary_metric_value", { length: 64 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  dataOrigin: dataOriginEnum("data_origin")
    .notNull()
    .default("development_fixture"),
  isFixtureSeed: boolean("is_fixture_seed").notNull().default(true),
});

// ============================================================================
// 13. AI4I 2020 PREDICTIVE MAINTENANCE DATASET RECORDS
// ============================================================================
// Synthetic dataset from UCI Machine Learning Repository (CC BY 4.0).
// Source: https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
// This table stores raw imported records with full provenance. It does NOT
// fabricate vibration, acoustic, or other sensor fields absent from the source.

export const ai4iTelemetryRecords = pgTable("ai4i_telemetry_records", {
  id: serial("id").primaryKey(),
  udi: integer("udi").notNull(),
  productId: varchar("product_id", { length: 32 }).notNull(),
  type: varchar("type", { length: 2 }).notNull(), // "L" | "M" | "H"
  airTemperatureK: doublePrecision("air_temperature_k").notNull(), // Kelvin
  processTemperatureK: doublePrecision("process_temperature_k").notNull(), // Kelvin
  rotationalSpeedRpm: integer("rotational_speed_rpm").notNull(),
  torqueNm: doublePrecision("torque_nm").notNull(), // Newton-meters
  toolWearMin: integer("tool_wear_min").notNull(), // minutes
  machineFailure: boolean("machine_failure").notNull(),
  twf: boolean("twf").notNull(), // Tool Wear Failure
  hdf: boolean("hdf").notNull(), // Heat Dissipation Failure
  pwf: boolean("pwf").notNull(), // Power Failure
  osf: boolean("osf").notNull(), // Overstrain Failure
  rnf: boolean("rnf").notNull(), // Random Failure
  dataOrigin: dataOriginEnum("data_origin")
    .notNull()
    .default("operational_telemetry"),
  isFixtureSeed: boolean("is_fixture_seed").notNull().default(false),
  importedAt: timestamp("imported_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sourceFile: varchar("source_file", { length: 255 }).notNull(),
  sourceDataset: varchar("source_dataset", { length: 64 })
    .notNull()
    .default("ai4i_2020"),
}, (table) => [
  uniqueIndex("ai4i_records_udi_unique_idx").on(table.udi),
  index("ai4i_records_product_id_idx").on(table.productId),
  index("ai4i_records_type_idx").on(table.type),
  index("ai4i_records_machine_failure_idx").on(table.machineFailure),
  index("ai4i_records_imported_at_idx").on(table.importedAt),
]);
