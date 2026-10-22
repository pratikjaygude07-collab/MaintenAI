"use client";

import type { DigitalTwinMachineProfile } from "@/types/telemetry";
import { PanelContainer, StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface DigitalTwinConditionPanelsProps {
  machine: DigitalTwinMachineProfile;
}

export function DigitalTwinConditionPanels({
  machine,
}: DigitalTwinConditionPanelsProps) {
  const opTone =
    machine.operatingStatus === "operational"
      ? "nominal"
      : machine.operatingStatus === "warning"
      ? "warning"
      : machine.operatingStatus === "critical"
      ? "critical"
      : "cyan";

  const maintTone =
    machine.maintenanceStatus === "up_to_date"
      ? "nominal"
      : machine.maintenanceStatus === "scheduled"
      ? "warning"
      : machine.maintenanceStatus === "overdue"
      ? "critical"
      : "cyan";

  const healthBarColor =
    machine.healthScore < 70
      ? "bg-[#EF4444]"
      : machine.healthScore < 88
      ? "bg-[#F59E0B]"
      : "bg-[#10B981]";

  return (
    <div className="space-y-6">
      {/* 1. Machine Health Indicator, Operating Status & Maintenance Information */}
      <PanelContainer
        codeTag="TWN-CND-01"
        title="Condition & Maintenance Status"
        subtitle="Composite health indicator, operating state, and scheduled work-order metadata (fixture)"
        headerAction={
          <StatusBadge
            tone={opTone}
            pulse={machine.operatingStatus === "critical"}
            label={machine.operatingStatus.toUpperCase()}
            ariaLabel={`Operating status: ${machine.operatingStatus}`}
          />
        }
      >
        <div className="space-y-4">
          {/* Health Score Gauge Bar */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
            <div className="flex items-center justify-between font-mono text-xs mb-1.5">
              <span className="text-[#94A3B8] uppercase tracking-wider">
                MACHINE HEALTH INDICATOR
              </span>
              <span className="text-lg font-bold text-[#F1F5F9] tabular-nums">
                {machine.healthScore.toFixed(1)}%
              </span>
            </div>
            <div
              className="h-2.5 w-full rounded-full bg-[#131C2E] overflow-hidden"
              role="progressbar"
              aria-valuenow={machine.healthScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Machine health score ${machine.healthScore}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${healthBarColor}`}
                style={{ width: `${machine.healthScore}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#64748B]">
              <span>CRITICAL &lt;70%</span>
              <span>WATCH 70–88%</span>
              <span>NOMINAL &gt;88%</span>
            </div>
          </div>

          {/* Maintenance Information Block */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#00E5FF]">
                MAINTENANCE SCHEDULE
              </span>
              <StatusBadge
                tone={maintTone}
                label={machine.maintenanceLabel}
                ariaLabel={`Maintenance status: ${machine.maintenanceLabel}`}
              />
            </div>

            <dl className="grid grid-cols-2 gap-2.5 pt-1 font-mono text-xs">
              <div>
                <dt className="text-[10px] text-[#64748B]">SERVICE WINDOW</dt>
                <dd className="text-[#F1F5F9] mt-0.5">
                  {machine.maintenanceWindow}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-[#64748B]">WORK ORDER REF</dt>
                <dd className="text-[#00E5FF] mt-0.5">{machine.workOrderRef}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-[#64748B]">ASSIGNED CREW</dt>
                <dd className="text-[#F1F5F9] mt-0.5">{machine.assignedTeam}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-[#64748B]">OPERATING HOURS</dt>
                <dd className="text-[#F1F5F9] mt-0.5 tabular-nums">
                  {machine.operatingHours.toLocaleString()} hrs
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </PanelContainer>

      {/* 2. Active Alerts Panel */}
      <PanelContainer
        codeTag="TWN-ALT-02"
        title="Active Threshold Alerts (Fixture)"
        subtitle="Sensor threshold breaches recorded in local preview dataset"
        headerAction={
          <StatusBadge
            tone={machine.activeAlerts.length > 0 ? opTone : "nominal"}
            label={`${machine.activeAlerts.length} ACTIVE`}
          />
        }
      >
        {machine.activeAlerts.length === 0 ? (
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4 text-center">
            <p className="font-mono text-xs text-[#10B981]">
              ✓ NO ACTIVE THRESHOLD ALERTS
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              All monitored temperature, vibration, and RPM channels for{" "}
              {machine.machineId} are within configured fixture bands.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {machine.activeAlerts.map((alert) => (
              <article
                key={alert.id}
                className={`rounded bg-[#070B12] border p-3.5 ${
                  alert.severity === "critical"
                    ? "border-[#EF4444]/40"
                    : "border-[#F59E0B]/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      tone={alert.severity}
                      pulse={alert.severity === "critical"}
                      label={alert.severity.toUpperCase()}
                    />
                    <span className="font-mono text-xs font-semibold text-[#F1F5F9]">
                      {alert.id}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    {alert.loggedAt}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-medium text-[#F1F5F9]">
                  {alert.title}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-[#94A3B8] tabular-nums">
                  {alert.channel}:{" "}
                  <strong className="text-[#F1F5F9]">
                    {alert.readingSummary}
                  </strong>{" "}
                  ({alert.thresholdSummary})
                </p>
                <p className="mt-2 pt-2 border-t border-[#1E293B] font-mono text-[10px] text-[#64748B]">
                  {alert.fixtureNote}
                </p>
              </article>
            ))}
          </div>
        )}
      </PanelContainer>

      {/* 3. Recent Machine Events Log */}
      <PanelContainer
        codeTag="TWN-EVT-03"
        title="Recent Machine Events"
        subtitle="Chronological operational, threshold, and maintenance log entries"
      >
        <div className="space-y-2.5">
          {machine.recentEvents.map((evt) => (
            <article
              key={evt.id}
              className="rounded bg-[#070B12] border border-[#1E293B] p-3 hover:border-[#26354D] transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={evt.severity === "info" ? "cyan" : evt.severity}
                    label={evt.category}
                  />
                  <span className="text-[#64748B]">{evt.id}</span>
                </div>
                <span className="text-[#94A3B8] tabular-nums">
                  {evt.relativeTime} • {evt.timestampUtc}
                </span>
              </div>
              <h3 className="mt-1.5 text-xs font-semibold text-[#F1F5F9]">
                {evt.title}
              </h3>
              <p className="mt-0.5 text-xs text-[#94A3B8]">{evt.detail}</p>
            </article>
          ))}
        </div>
      </PanelContainer>
    </div>
  );
}
