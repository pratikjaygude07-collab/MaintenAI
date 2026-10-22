import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import {
  alerts,
  dashboardKpiMetrics,
  diagnosticFindings,
  machineEvents,
  machineSubAssemblies,
  machines,
  maintenanceRecommendations,
  maintenanceWorkOrders,
  sensorChannels,
  sites,
  subsystemHealthRollups,
  telemetryReadings,
} from "./schema";
import {
  ASSET_SUMMARY_METRICS,
  DIGITAL_TWIN_MACHINE_PROFILES,
  FLEET_MACHINE_INVENTORY,
  MACHINE_DIAGNOSTIC_PROFILES,
  MAINTENANCE_WORK_ORDERS,
  MONITORED_ASSET_STREAMS,
  RECENT_PREDICTIVE_ALERTS,
  SUBSYSTEM_HEALTH_SUMMARIES,
  SYSTEM_STATUS_FIXTURE,
} from "../data/fixtures";
import type { TimeRangeKey } from "../types/telemetry";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the development seed.");
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

const TIME_RANGES: TimeRangeKey[] = ["1H", "6H", "24H", "7D"];

/**
 * Idempotent development seed function.
 * - Uses conflict-safe upserts (`onConflictDoUpdate`) on primary/unique keys.
 * - Never truncates or deletes existing database rows.
 * - Explicitly marks all records with `dataOrigin = "development_fixture"` and `isFixtureSeed = true`.
 */
export async function seedDevelopmentFixtures() {
  console.log(
    "[MainAI Seed] Starting idempotent development fixture seed (dataOrigin='development_fixture')..."
  );

  // 1. Seed Sites / Plants (DETROIT-04 and OHIO-02)
  const siteRows = [
    {
      plantCode: SYSTEM_STATUS_FIXTURE.plantCode,
      plantName: "Detroit Industrial Plant #04",
      primarySectorCode: SYSTEM_STATUS_FIXTURE.sectorCode,
      gatewayNode: SYSTEM_STATUS_FIXTURE.gatewayNode,
      gatewaySyncPercent: SYSTEM_STATUS_FIXTURE.gatewaySyncPercent,
      statusLabel: SYSTEM_STATUS_FIXTURE.statusLabel,
      uptimePercent: SYSTEM_STATUS_FIXTURE.uptimePercent,
      samplingRateHz: SYSTEM_STATUS_FIXTURE.samplingRateHz,
      activeModelBuild: SYSTEM_STATUS_FIXTURE.activeModelBuild,
      lastSyncDisplayUtc: SYSTEM_STATUS_FIXTURE.lastSyncUtc,
      dataOrigin: "development_fixture" as const,
      isFixtureSeed: true,
    },
    {
      plantCode: "OHIO-02",
      plantName: "Ohio Thermal & Process Plant #02",
      primarySectorCode: "SECTOR C",
      gatewayNode: "US-EAST-IND-02",
      gatewaySyncPercent: 99.95,
      statusLabel: "SYSTEM NOMINAL",
      uptimePercent: 99.1,
      samplingRateHz: 25600,
      activeModelBuild: SYSTEM_STATUS_FIXTURE.activeModelBuild,
      lastSyncDisplayUtc: SYSTEM_STATUS_FIXTURE.lastSyncUtc,
      dataOrigin: "development_fixture" as const,
      isFixtureSeed: true,
    },
  ];

  for (const site of siteRows) {
    await db
      .insert(sites)
      .values(site)
      .onConflictDoUpdate({
        target: sites.plantCode,
        set: {
          plantName: site.plantName,
          primarySectorCode: site.primarySectorCode,
          gatewayNode: site.gatewayNode,
          gatewaySyncPercent: site.gatewaySyncPercent,
          statusLabel: site.statusLabel,
          uptimePercent: site.uptimePercent,
          samplingRateHz: site.samplingRateHz,
          activeModelBuild: site.activeModelBuild,
          lastSyncDisplayUtc: site.lastSyncDisplayUtc,
          dataOrigin: site.dataOrigin,
          isFixtureSeed: site.isFixtureSeed,
          updatedAt: sql`now()`,
        },
      });
  }

  // 2. Seed Machines (merging Fleet, Digital Twin, and Diagnostics fixture attributes)
  for (const fleetItem of FLEET_MACHINE_INVENTORY) {
    const twinProfile = DIGITAL_TWIN_MACHINE_PROFILES.find(
      (p) => p.machineId === fleetItem.machineId
    );
    const diagProfile = MACHINE_DIAGNOSTIC_PROFILES.find(
      (p) => p.machineId === fleetItem.machineId
    );
    const streamProfile = MONITORED_ASSET_STREAMS.find(
      (s) => s.assetId === fleetItem.machineId
    );

    const severityStatus =
      fleetItem.operatingStatus === "critical"
        ? ("critical" as const)
        : fleetItem.operatingStatus === "warning"
        ? ("warning" as const)
        : ("nominal" as const);

    const machineRow = {
      machineId: fleetItem.machineId,
      plantCode: fleetItem.plant,
      machineName: fleetItem.machineName,
      machineType: fleetItem.machineType,
      subsystem: streamProfile?.subsystem ?? "Industrial Rotating Unit",
      rotorConfiguration: twinProfile?.rotorConfiguration ?? ("turbine" as const),
      locationZone: fleetItem.locationZone,
      operatingStatus: fleetItem.operatingStatus,
      severityStatus,
      healthScore: fleetItem.healthScore,
      temperatureC: fleetItem.temperatureC,
      tempThresholdWarning: fleetItem.tempThresholdWarning,
      tempThresholdCritical: fleetItem.tempThresholdCritical,
      vibrationRms: fleetItem.vibrationRms,
      vibThresholdWarning: fleetItem.vibThresholdWarning,
      vibThresholdCritical: fleetItem.vibThresholdCritical,
      rpm: fleetItem.rpm,
      rpmNominal: fleetItem.rpmNominal,
      rpmMinBand: twinProfile?.rpmMinBand ?? Math.max(0, fleetItem.rpmNominal - 300),
      rpmMaxBand: twinProfile?.rpmMaxBand ?? fleetItem.rpmNominal + 300,
      acousticDb: twinProfile?.acousticDb ?? 72.0,
      acousticThresholdWarning:
        twinProfile?.acousticWarningDb ??
        streamProfile?.thresholds.acousticWarning ??
        82.0,
      acousticThresholdCritical:
        streamProfile?.thresholds.acousticCritical ?? 90.0,
      operatingHours: twinProfile?.operatingHours ?? 12400,
      rulHours: fleetItem.rulHours,
      needsAttention: fleetItem.needsAttention,
      activeFaultSignature: fleetItem.activeFaultSignature ?? null,
      maintenanceStatus: fleetItem.maintenanceStatus,
      maintenanceLabel: fleetItem.maintenanceLabel,
      nextMaintenanceWindow:
        twinProfile?.maintenanceWindow ?? fleetItem.nextMaintenanceWindow,
      assignedTeam:
        twinProfile?.assignedTeam ??
        diagProfile?.maintenanceSummary.assignedCrew ??
        null,
      leadTechnician: twinProfile?.leadTechnician ?? null,
      workOrderId:
        fleetItem.workOrderId ?? twinProfile?.workOrderRef ?? null,
      diagnosticReviewStatus:
        diagProfile?.diagnosticReviewStatus ?? ("verified_baseline" as const),
      diagnosticReviewLabel:
        diagProfile?.diagnosticReviewLabel ?? "Baseline Verified",
      sensorChannelsCount: fleetItem.sensorChannels,
      gatewayNode: fleetItem.gatewayNode,
      lastUpdateRelative: fleetItem.lastUpdateRelative,
      lastUpdateUtc: fleetItem.lastUpdateUtc,
      dataOrigin: "development_fixture" as const,
      isFixtureSeed: true,
    };

    await db
      .insert(machines)
      .values(machineRow)
      .onConflictDoUpdate({
        target: machines.machineId,
        set: {
          ...machineRow,
          updatedAt: sql`now()`,
        },
      });
  }

  // 3. Seed Machine Sub-Assemblies (from Digital Twin profiles)
  let subAssemblyCount = 0;
  for (const twinProfile of DIGITAL_TWIN_MACHINE_PROFILES) {
    for (let idx = 0; idx < twinProfile.subAssemblies.length; idx++) {
      const sub = twinProfile.subAssemblies[idx];
      await db
        .insert(machineSubAssemblies)
        .values({
          machineId: twinProfile.machineId,
          subAssemblyKey: sub.id,
          code: sub.code,
          name: sub.name,
          status: sub.status,
          temperatureC: sub.temperatureC,
          vibrationRms: sub.vibrationRms,
          materialSpec: sub.materialSpec,
          notes: sub.notes,
          sortOrder: idx,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: [
            machineSubAssemblies.machineId,
            machineSubAssemblies.subAssemblyKey,
          ],
          set: {
            code: sub.code,
            name: sub.name,
            status: sub.status,
            temperatureC: sub.temperatureC,
            vibrationRms: sub.vibrationRms,
            materialSpec: sub.materialSpec,
            notes: sub.notes,
            sortOrder: idx,
            updatedAt: sql`now()`,
          },
        });
      subAssemblyCount++;
    }
  }

  // 4. Seed Sensor Channels (from Diagnostics profiles)
  let channelCount = 0;
  for (const diagProfile of MACHINE_DIAGNOSTIC_PROFILES) {
    for (const cond of diagProfile.sensorConditions) {
      await db
        .insert(sensorChannels)
        .values({
          channelId: cond.id,
          machineId: diagProfile.machineId,
          metricKey: cond.metricKey,
          label: cond.label,
          channelCode: cond.channelCode,
          currentReading: cond.currentReading,
          unit: cond.unit,
          status: cond.status,
          normalRangeText: cond.normalRangeText,
          warningThreshold: cond.warningThreshold ?? null,
          criticalThreshold: cond.criticalThreshold ?? null,
          nominalReference: cond.nominalReference ?? null,
          thresholdExceeded: cond.thresholdExceeded,
          exceededSummary: cond.exceededSummary ?? null,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: sensorChannels.channelId,
          set: {
            currentReading: cond.currentReading,
            unit: cond.unit,
            status: cond.status,
            normalRangeText: cond.normalRangeText,
            warningThreshold: cond.warningThreshold ?? null,
            criticalThreshold: cond.criticalThreshold ?? null,
            nominalReference: cond.nominalReference ?? null,
            thresholdExceeded: cond.thresholdExceeded,
            exceededSummary: cond.exceededSummary ?? null,
            updatedAt: sql`now()`,
          },
        });
      channelCount++;
    }
  }

  // 5. Seed Telemetry Readings across 1H, 6H, 24H, 7D windows
  let telemetryCount = 0;
  for (const twinProfile of DIGITAL_TWIN_MACHINE_PROFILES) {
    const dashboardStream = MONITORED_ASSET_STREAMS.find(
      (s) => s.assetId === twinProfile.machineId
    );

    for (const rangeKey of TIME_RANGES) {
      const streamSeries = dashboardStream?.seriesByRange[rangeKey];
      const twinSeries = twinProfile.sensorTrendsByRange[rangeKey];

      if (streamSeries && streamSeries.length > 0) {
        for (let idx = 0; idx < streamSeries.length; idx++) {
          const pt = streamSeries[idx];
          const twinPt = twinSeries?.[Math.min(idx, (twinSeries?.length ?? 1) - 1)];
          await db
            .insert(telemetryReadings)
            .values({
              machineId: twinProfile.machineId,
              timeRange: rangeKey,
              sampleIndex: idx,
              timestampLabel: pt.timestamp,
              temperatureC: pt.bearingTempC,
              vibrationRms: pt.vibrationRms,
              rpm: twinPt?.rpm ?? twinProfile.rpm,
              acousticDb: pt.acousticDb,
              anomalyProbability: pt.anomalyProbability,
              isForecast: Boolean(pt.isForecast),
              dataOrigin: "development_fixture",
              isFixtureSeed: true,
            })
            .onConflictDoUpdate({
              target: [
                telemetryReadings.machineId,
                telemetryReadings.timeRange,
                telemetryReadings.sampleIndex,
              ],
              set: {
                timestampLabel: pt.timestamp,
                temperatureC: pt.bearingTempC,
                vibrationRms: pt.vibrationRms,
                rpm: twinPt?.rpm ?? twinProfile.rpm,
                acousticDb: pt.acousticDb,
                anomalyProbability: pt.anomalyProbability,
                isForecast: Boolean(pt.isForecast),
              },
            });
          telemetryCount++;
        }
      } else if (twinSeries && twinSeries.length > 0) {
        for (let idx = 0; idx < twinSeries.length; idx++) {
          const pt = twinSeries[idx];
          await db
            .insert(telemetryReadings)
            .values({
              machineId: twinProfile.machineId,
              timeRange: rangeKey,
              sampleIndex: idx,
              timestampLabel: pt.timestamp,
              temperatureC: pt.temperatureC,
              vibrationRms: pt.vibrationRms,
              rpm: pt.rpm,
              acousticDb: pt.acousticDb,
              anomalyProbability: null,
              isForecast: false,
              dataOrigin: "development_fixture",
              isFixtureSeed: true,
            })
            .onConflictDoUpdate({
              target: [
                telemetryReadings.machineId,
                telemetryReadings.timeRange,
                telemetryReadings.sampleIndex,
              ],
              set: {
                timestampLabel: pt.timestamp,
                temperatureC: pt.temperatureC,
                vibrationRms: pt.vibrationRms,
                rpm: pt.rpm,
                acousticDb: pt.acousticDb,
              },
            });
          telemetryCount++;
        }
      }
    }
  }

  // 6. Seed Alerts (Dashboard Predictive Alerts + Digital Twin / Diagnostics Alerts)
  let alertCount = 0;
  for (const alert of RECENT_PREDICTIVE_ALERTS) {
    const matchingTwinAlert = DIGITAL_TWIN_MACHINE_PROFILES.flatMap(
      (p) => p.activeAlerts
    ).find((a) => a.id === alert.id);

    await db
      .insert(alerts)
      .values({
        alertId: alert.id,
        machineId: alert.assetId,
        sector: alert.sector,
        channelCode: matchingTwinAlert?.channel ?? null,
        severity: alert.severity,
        title: matchingTwinAlert?.title ?? alert.faultSignature,
        faultSignature: alert.faultSignature,
        telemetryReading: alert.telemetryReading,
        thresholdLimit: alert.thresholdLimit,
        aiConfidencePercent: alert.aiConfidencePercent,
        estimatedRulHours: alert.estimatedRulHours,
        detectedRelative: alert.detectedRelative,
        detectedUtc: alert.detectedUtc,
        recommendedAction: alert.recommendedAction,
        acknowledged: Boolean(alert.acknowledged),
        fixtureNote:
          matchingTwinAlert?.fixtureNote ??
          "Illustrative frontend fixture record — awaiting backend telemetry stream.",
        dataOrigin: "development_fixture",
        isFixtureSeed: true,
      })
      .onConflictDoUpdate({
        target: alerts.alertId,
        set: {
          severity: alert.severity,
          title: matchingTwinAlert?.title ?? alert.faultSignature,
          faultSignature: alert.faultSignature,
          telemetryReading: alert.telemetryReading,
          thresholdLimit: alert.thresholdLimit,
          aiConfidencePercent: alert.aiConfidencePercent,
          estimatedRulHours: alert.estimatedRulHours,
          detectedRelative: alert.detectedRelative,
          detectedUtc: alert.detectedUtc,
          recommendedAction: alert.recommendedAction,
        },
      });
    alertCount++;
  }

  // Also upsert any Digital Twin alerts not already in RECENT_PREDICTIVE_ALERTS
  for (const twinProfile of DIGITAL_TWIN_MACHINE_PROFILES) {
    for (const twinAlert of twinProfile.activeAlerts) {
      if (RECENT_PREDICTIVE_ALERTS.some((a) => a.id === twinAlert.id)) continue;
      await db
        .insert(alerts)
        .values({
          alertId: twinAlert.id,
          machineId: twinProfile.machineId,
          sector: twinProfile.locationZone,
          channelCode: twinAlert.channel,
          severity: twinAlert.severity,
          title: twinAlert.title,
          faultSignature: twinAlert.title,
          telemetryReading: twinAlert.readingSummary,
          thresholdLimit: twinAlert.thresholdSummary,
          aiConfidencePercent: null,
          estimatedRulHours: null,
          detectedRelative: "24m ago",
          detectedUtc: twinAlert.loggedAt,
          recommendedAction:
            "Inspect sensor channel and verify bearing thermal band during scheduled maintenance.",
          acknowledged: false,
          fixtureNote: twinAlert.fixtureNote,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: alerts.alertId,
          set: {
            title: twinAlert.title,
            telemetryReading: twinAlert.readingSummary,
            thresholdLimit: twinAlert.thresholdSummary,
          },
        });
      alertCount++;
    }
  }

  // 7. Seed Maintenance Work Orders
  for (const wo of MAINTENANCE_WORK_ORDERS) {
    await db
      .insert(maintenanceWorkOrders)
      .values({
        workOrderId: wo.id,
        machineId: wo.assetId,
        taskTitle: wo.taskTitle,
        maintenanceType: wo.maintenanceType,
        assignedTeam: wo.assignedTeam,
        leadEngineer: wo.leadEngineer,
        scheduledWindow: wo.scheduledWindow,
        estimatedDuration: wo.estimatedDuration,
        status: wo.status,
        priority: wo.priority,
        triggerAlertId: wo.triggerAlertId ?? null,
        dataOrigin: "development_fixture",
        isFixtureSeed: true,
      })
      .onConflictDoUpdate({
        target: maintenanceWorkOrders.workOrderId,
        set: {
          taskTitle: wo.taskTitle,
          maintenanceType: wo.maintenanceType,
          assignedTeam: wo.assignedTeam,
          leadEngineer: wo.leadEngineer,
          scheduledWindow: wo.scheduledWindow,
          estimatedDuration: wo.estimatedDuration,
          status: wo.status,
          priority: wo.priority,
          triggerAlertId: wo.triggerAlertId ?? null,
          updatedAt: sql`now()`,
        },
      });
  }

  // 8. Seed Diagnostic Findings
  let findingCount = 0;
  for (const diagProfile of MACHINE_DIAGNOSTIC_PROFILES) {
    for (const fnd of diagProfile.findings) {
      await db
        .insert(diagnosticFindings)
        .values({
          findingId: fnd.id,
          machineId: fnd.machineId,
          affectedComponent: fnd.affectedComponent,
          componentCode: fnd.componentCode,
          title: fnd.title,
          severity: fnd.severity,
          status: fnd.status,
          supportingEvidence: fnd.supportingEvidence,
          sensorReadingsSummary: fnd.sensorReadingsSummary,
          thresholdReference: fnd.thresholdReference,
          recommendedNextAction: fnd.recommendedNextAction ?? null,
          lastUpdatedUtc: fnd.lastUpdatedUtc,
          lastUpdatedRelative: fnd.lastUpdatedRelative,
          fixtureDisclaimer: fnd.fixtureDisclaimer,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: diagnosticFindings.findingId,
          set: {
            affectedComponent: fnd.affectedComponent,
            componentCode: fnd.componentCode,
            title: fnd.title,
            severity: fnd.severity,
            status: fnd.status,
            supportingEvidence: fnd.supportingEvidence,
            sensorReadingsSummary: fnd.sensorReadingsSummary,
            thresholdReference: fnd.thresholdReference,
            recommendedNextAction: fnd.recommendedNextAction ?? null,
            lastUpdatedUtc: fnd.lastUpdatedUtc,
            lastUpdatedRelative: fnd.lastUpdatedRelative,
            fixtureDisclaimer: fnd.fixtureDisclaimer,
            updatedAt: sql`now()`,
          },
        });
      findingCount++;
    }
  }

  // 9. Seed Maintenance Recommendations
  let recCount = 0;
  for (const diagProfile of MACHINE_DIAGNOSTIC_PROFILES) {
    for (const rec of diagProfile.recommendations) {
      await db
        .insert(maintenanceRecommendations)
        .values({
          recommendationId: rec.id,
          machineId: rec.machineId,
          associatedComponent: rec.associatedComponent,
          actionTitle: rec.actionTitle,
          priority: rec.priority,
          supportingReason: rec.supportingReason,
          suggestedStatus: rec.suggestedStatus,
          completionStatus: rec.completionStatus,
          estimatedWindow: rec.estimatedWindow,
          linkedFindingId: rec.linkedFindingId ?? null,
          workOrderRef: rec.workOrderRef ?? null,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: maintenanceRecommendations.recommendationId,
          set: {
            associatedComponent: rec.associatedComponent,
            actionTitle: rec.actionTitle,
            priority: rec.priority,
            supportingReason: rec.supportingReason,
            suggestedStatus: rec.suggestedStatus,
            completionStatus: rec.completionStatus,
            estimatedWindow: rec.estimatedWindow,
            linkedFindingId: rec.linkedFindingId ?? null,
            workOrderRef: rec.workOrderRef ?? null,
            updatedAt: sql`now()`,
          },
        });
      recCount++;
    }
  }

  // 10. Seed Machine Events (Digital Twin & Diagnostics Timelines)
  let eventCount = 0;
  for (const twinProfile of DIGITAL_TWIN_MACHINE_PROFILES) {
    for (const evt of twinProfile.recentEvents) {
      await db
        .insert(machineEvents)
        .values({
          eventId: evt.id,
          machineId: twinProfile.machineId,
          eventScope: "digital_twin",
          category: evt.category,
          severity: evt.severity,
          title: evt.title,
          description: evt.detail,
          timestampUtc: evt.timestampUtc,
          relativeTime: evt.relativeTime,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: machineEvents.eventId,
          set: {
            category: evt.category,
            severity: evt.severity,
            title: evt.title,
            description: evt.detail,
            timestampUtc: evt.timestampUtc,
            relativeTime: evt.relativeTime,
          },
        });
      eventCount++;
    }
  }

  for (const diagProfile of MACHINE_DIAGNOSTIC_PROFILES) {
    for (const devt of diagProfile.timelineEvents) {
      await db
        .insert(machineEvents)
        .values({
          eventId: devt.id,
          machineId: diagProfile.machineId,
          eventScope: "diagnostics",
          category: devt.category,
          severity: devt.severity,
          title: devt.title,
          description: devt.description,
          timestampUtc: devt.timestampUtc,
          relativeTime: devt.relativeTime,
          dataOrigin: "development_fixture",
          isFixtureSeed: true,
        })
        .onConflictDoUpdate({
          target: machineEvents.eventId,
          set: {
            category: devt.category,
            severity: devt.severity,
            title: devt.title,
            description: devt.description,
            timestampUtc: devt.timestampUtc,
            relativeTime: devt.relativeTime,
          },
        });
      eventCount++;
    }
  }

  // 11. Seed Dashboard KPI Metrics & Subsystem Rollups
  for (let i = 0; i < ASSET_SUMMARY_METRICS.length; i++) {
    const kpi = ASSET_SUMMARY_METRICS[i];
    await db
      .insert(dashboardKpiMetrics)
      .values({
        metricId: kpi.id,
        label: kpi.label,
        value: kpi.value,
        unit: kpi.unit ?? null,
        deltaText: kpi.deltaText,
        deltaTone: kpi.deltaTone,
        thresholdText: kpi.thresholdText,
        status: kpi.status,
        sortOrder: i,
        dataOrigin: "development_fixture",
        isFixtureSeed: true,
      })
      .onConflictDoUpdate({
        target: dashboardKpiMetrics.metricId,
        set: {
          label: kpi.label,
          value: kpi.value,
          unit: kpi.unit ?? null,
          deltaText: kpi.deltaText,
          deltaTone: kpi.deltaTone,
          thresholdText: kpi.thresholdText,
          status: kpi.status,
          sortOrder: i,
        },
      });
  }

  for (let i = 0; i < SUBSYSTEM_HEALTH_SUMMARIES.length; i++) {
    const sub = SUBSYSTEM_HEALTH_SUMMARIES[i];
    await db
      .insert(subsystemHealthRollups)
      .values({
        subsystemId: sub.id,
        name: sub.name,
        assetCount: sub.assetCount,
        healthPercent: sub.healthPercent,
        meanRulHours: sub.meanRulHours,
        status: sub.status,
        primaryMetricLabel: sub.primaryMetricLabel,
        primaryMetricValue: sub.primaryMetricValue,
        sortOrder: i,
        dataOrigin: "development_fixture",
        isFixtureSeed: true,
      })
      .onConflictDoUpdate({
        target: subsystemHealthRollups.subsystemId,
        set: {
          name: sub.name,
          assetCount: sub.assetCount,
          healthPercent: sub.healthPercent,
          meanRulHours: sub.meanRulHours,
          status: sub.status,
          primaryMetricLabel: sub.primaryMetricLabel,
          primaryMetricValue: sub.primaryMetricValue,
          sortOrder: i,
        },
      });
  }

  console.log("[MainAI Seed] Idempotent development seed completed:", {
    sites: siteRows.length,
    machines: FLEET_MACHINE_INVENTORY.length,
    subAssemblies: subAssemblyCount,
    sensorChannels: channelCount,
    telemetryReadings: telemetryCount,
    alerts: alertCount,
    workOrders: MAINTENANCE_WORK_ORDERS.length,
    diagnosticFindings: findingCount,
    maintenanceRecommendations: recCount,
    machineEvents: eventCount,
    dashboardKpis: ASSET_SUMMARY_METRICS.length,
    subsystemRollups: SUBSYSTEM_HEALTH_SUMMARIES.length,
  });
}

// Execute when invoked directly via CLI (e.g., `node --import ./src/db/seed.ts` or `npx tsx src/db/seed.ts`)
const isDirectExecution =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"));

if (isDirectExecution) {
  seedDevelopmentFixtures()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("[MainAI Seed] Seed failed:", err);
      await pool.end();
      process.exit(1);
    });
}
