"use client";

import { useState } from "react";
import Link from "next/link";
import type { PredictiveAlert, SeverityLevel } from "@/types/telemetry";
import {
  DataEmptyState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";

interface RecentAlertsPanelProps {
  alerts: PredictiveAlert[];
}

export function RecentAlertsPanel({ alerts }: RecentAlertsPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<"all" | SeverityLevel>("all");
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(
    alerts[0]?.id ?? null
  );
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, boolean>>({});

  const filteredAlerts = alerts.filter((alert) =>
    severityFilter === "all" ? true : alert.severity === severityFilter
  );

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <PanelContainer
      codeTag="ALT-03"
      title="Recent Anomaly Alerts"
      subtitle="AI-classified acoustic, thermal, and harmonic threshold excursions"
      headerAction={
        <div
          role="group"
          aria-label="Filter alerts by severity"
          className="inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
        >
          {(["all", "critical", "warning"] as const).map((level) => {
            const active = severityFilter === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setSeverityFilter(level)}
                aria-pressed={active}
                className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                  active
                    ? "bg-[#131C2E] text-[#00E5FF] font-semibold border border-[#00E5FF]/40"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <DataEmptyState
            title="No Alerts Match Selected Severity"
            description="No fixture alert events match the active severity filter."
            actionLabel="Show All Alerts"
            onAction={() => setSeverityFilter("all")}
          />
        ) : (
          filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const isAck = Boolean(acknowledgedIds[alert.id]);

          return (
            <article
              key={alert.id}
              className={`rounded-md bg-[#070B12] border transition-colors duration-200 ease-out ${
                alert.severity === "critical"
                  ? "border-[#EF4444]/40 hover:border-[#EF4444]/70"
                  : "border-[#1E293B] hover:border-[#00E5FF]/50"
              }`}
            >
              <div className="p-3.5">
                {/* Top Row: Severity Badge + Asset ID + Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      tone={alert.severity}
                      pulse={alert.severity === "critical" && !isAck}
                      label={alert.severity.toUpperCase()}
                    />
                    <Link
                      href={`/fleet/${encodeURIComponent(alert.assetId)}`}
                      className="font-mono text-xs font-semibold text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                    >
                      {alert.assetId}
                    </Link>
                    <span className="font-mono text-[11px] text-[#94A3B8]">
                      {"//"} {alert.sector}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    <span>{alert.id}</span>
                    <span>•</span>
                    <span className="text-[#F1F5F9]">{alert.detectedRelative}</span>
                  </div>
                </div>

                {/* Fault Signature & Asset Name */}
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-[#F1F5F9]">
                    {alert.faultSignature}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    {alert.assetName} — Reading:{" "}
                    <span className="font-mono text-[#F1F5F9] tabular-nums">
                      {alert.telemetryReading}
                    </span>{" "}
                    <span className="font-mono text-[#64748B]">
                      ({alert.thresholdLimit})
                    </span>
                  </p>
                </div>

                {/* Metrics & Controls Bar */}
                <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                    <span className="text-[#94A3B8]">
                      AI CONF:{" "}
                      <strong className="text-[#00E5FF]">
                        {alert.aiConfidencePercent}%
                      </strong>
                    </span>
                    <span className="text-[#64748B]">|</span>
                    <span className="text-[#94A3B8]">
                      EST RUL:{" "}
                      <strong
                        className={
                          alert.estimatedRulHours < 100
                            ? "text-[#EF4444]"
                            : "text-[#F59E0B]"
                        }
                      >
                        {alert.estimatedRulHours} hrs
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAcknowledge(alert.id)}
                      aria-pressed={isAck}
                      className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                        isAck
                          ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40"
                          : "bg-[#131C2E] text-[#94A3B8] border-[#1E293B] hover:text-[#F1F5F9]"
                      }`}
                    >
                      {isAck ? "✓ ACKED" : "ACKNOWLEDGE"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAlertId(isExpanded ? null : alert.id)
                      }
                      aria-expanded={isExpanded}
                      className="rounded bg-[#131C2E] border border-[#1E293B] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#00E5FF] hover:border-[#00E5FF] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                    >
                      {isExpanded ? "HIDE SPEC" : "PRESCRIPTION"}
                    </button>
                  </div>
                </div>

                {/* Expandable Prescriptive Recommendation */}
                {isExpanded && (
                  <div className="mt-3 rounded bg-[#0D131F] border border-[#1E293B] p-3 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] uppercase tracking-wider">
                      <span>AI PRESCRIPTIVE DIRECTIVE</span>
                      <span>DETECTED {alert.detectedUtc}</span>
                    </div>
                    <p className="font-sans text-xs text-[#F1F5F9] leading-relaxed">
                      {alert.recommendedAction}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-[#94A3B8]">
                        ILLUSTRATIVE FIXTURE DIRECTIVE
                      </span>
                      <Link
                        href={`/diagnostics?machine=${encodeURIComponent(alert.assetId)}`}
                        className="font-mono text-[11px] text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                      >
                        OPEN IN DIAGNOSTICS →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })
        )}
      </div>
    </PanelContainer>
  );
}
