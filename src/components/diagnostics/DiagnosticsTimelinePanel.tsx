"use client";

import type {
  DiagnosticEvent,
  DiagnosticEventCategory,
  DigitalTwinAlertFixture,
} from "@/types/telemetry";
import { PanelContainer, StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface DiagnosticsTimelinePanelProps {
  alerts: DigitalTwinAlertFixture[];
  events: DiagnosticEvent[];
  machineId: string;
}

const CATEGORY_LABELS: Record<DiagnosticEventCategory, string> = {
  THRESHOLD_EXCEEDED: "THRESHOLD EXCEEDED",
  CONDITION_CHANGED: "CONDITION CHANGED",
  DIAGNOSTIC_REVIEW: "DIAGNOSTIC REVIEW",
  MAINTENANCE_ACTION: "MAINTENANCE ACTION",
};

export function DiagnosticsTimelinePanel({
  alerts,
  events,
  machineId,
}: DiagnosticsTimelinePanelProps) {
  return (
    <div className="space-y-6">
      {/* 1. Active Threshold Alerts */}
      <PanelContainer
        codeTag="DGN-ALT-04"
        title="Active Threshold Alerts"
        subtitle={`Current threshold breaches logged in fixture data for ${machineId}`}
        headerAction={
          <StatusBadge
            tone={alerts.length > 0 ? "critical" : "nominal"}
            label={`${alerts.length} ACTIVE`}
          />
        }
      >
        {alerts.length === 0 ? (
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4 text-center">
            <p className="font-mono text-xs text-[#10B981]">
              ✓ NO ACTIVE THRESHOLD ALERTS
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              All monitored channels for {machineId} are within normal fixture
              bands.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <article
                key={alert.id}
                className={`rounded bg-[#070B12] border p-3.5 ${
                  alert.severity === "critical"
                    ? "border-[#EF4444]/45"
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
                <h3 className="mt-1.5 text-sm font-medium text-[#F1F5F9]">
                  {alert.title}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-[#94A3B8] tabular-nums">
                  {alert.channel}:{" "}
                  <strong className="text-[#F1F5F9]">
                    {alert.readingSummary}
                  </strong>{" "}
                  ({alert.thresholdSummary})
                </p>
              </article>
            ))}
          </div>
        )}
      </PanelContainer>

      {/* 2. Recent Diagnostic & Maintenance Event Timeline */}
      <PanelContainer
        codeTag="DGN-TML-05"
        title="Diagnostic & Condition Event Timeline"
        subtitle="Chronological fixture history of threshold breaches, condition transitions, and reviews"
      >
        <ol
          aria-label={`Diagnostic event timeline for ${machineId}`}
          className="relative border-l border-[#1E293B] ml-2.5 space-y-4 pl-5"
        >
          {events.map((evt) => {
            const dotColor =
              evt.severity === "critical"
                ? "bg-[#EF4444]"
                : evt.severity === "warning"
                ? "bg-[#F59E0B]"
                : evt.severity === "nominal"
                ? "bg-[#10B981]"
                : "bg-[#00E5FF]";

            return (
              <li key={evt.id} className="relative">
                {/* Timeline Node Dot */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#0D131F] ${dotColor}`}
                />

                <article className="rounded bg-[#070B12] border border-[#1E293B] p-3.5 hover:border-[#26354D] transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={evt.severity === "info" ? "cyan" : evt.severity}
                        label={CATEGORY_LABELS[evt.category]}
                      />
                      <span className="text-[#00E5FF]">{evt.machineId}</span>
                      <span className="text-[#64748B]">• {evt.id}</span>
                    </div>
                    <span className="text-[#94A3B8] tabular-nums">
                      {evt.relativeTime} ({evt.timestampUtc})
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-semibold text-[#F1F5F9]">
                    {evt.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#94A3B8] leading-relaxed">
                    {evt.description}
                  </p>
                </article>
              </li>
            );
          })}
        </ol>
      </PanelContainer>
    </div>
  );
}
