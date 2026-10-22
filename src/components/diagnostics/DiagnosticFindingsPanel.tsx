"use client";

import { useMemo, useState } from "react";
import type {
  DiagnosticFinding,
  DiagnosticFindingStatus,
  DiagnosticSeverity,
} from "@/types/telemetry";
import {
  DataEmptyState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";

interface DiagnosticFindingsPanelProps {
  findings: DiagnosticFinding[];
  machineId: string;
}

const SEVERITY_META: Record<
  DiagnosticSeverity,
  {
    label: string;
    tone: "nominal" | "warning" | "critical" | "cyan" | "neutral";
    borderClass: string;
  }
> = {
  informational: {
    label: "INFORMATIONAL",
    tone: "neutral",
    borderClass: "border-[#1E293B]",
  },
  low: {
    label: "LOW",
    tone: "cyan",
    borderClass: "border-[#00E5FF]/35",
  },
  medium: {
    label: "MEDIUM",
    tone: "warning",
    borderClass: "border-[#F59E0B]/35",
  },
  high: {
    label: "HIGH",
    tone: "warning",
    borderClass: "border-[#F59E0B]/55",
  },
  critical: {
    label: "CRITICAL",
    tone: "critical",
    borderClass: "border-[#EF4444]/55",
  },
};

const STATUS_META: Record<
  DiagnosticFindingStatus,
  {
    label: string;
    tone: "nominal" | "warning" | "critical" | "cyan" | "neutral";
  }
> = {
  open: { label: "OPEN", tone: "critical" },
  under_review: { label: "UNDER REVIEW", tone: "warning" },
  action_planned: { label: "ACTION PLANNED", tone: "cyan" },
  resolved: { label: "RESOLVED", tone: "nominal" },
};

export function DiagnosticFindingsPanel({
  findings,
  machineId,
}: DiagnosticFindingsPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<
    "all" | DiagnosticSeverity
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | DiagnosticFindingStatus
  >("all");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() =>
    findings[0] ? { [findings[0].id]: true } : {}
  );

  const hasActiveFilters =
    severityFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSeverityFilter("all");
    setStatusFilter("all");
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((item) => {
      if (severityFilter !== "all" && item.severity !== severityFilter) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [findings, severityFilter, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <PanelContainer
      codeTag="DGN-RES-02"
      title="Diagnostic Results & Condition Findings (Fixture)"
      subtitle={`Structured condition findings and supporting sensor evidence for ${machineId}`}
      headerAction={
        <StatusBadge
          tone="cyan"
          label={`${filteredFindings.length} OF ${findings.length} FINDINGS`}
        />
      }
    >
      {/* Filter Controls Bar */}
      <div className="mb-4 rounded bg-[#070B12] border border-[#1E293B] p-3.5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Filter by Severity */}
          <div className="md:col-span-5 flex items-center gap-2">
            <label
              htmlFor="diag-severity-filter"
              className="font-mono text-[11px] uppercase text-[#64748B] shrink-0"
            >
              SEVERITY:
            </label>
            <select
              id="diag-severity-filter"
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as "all" | DiagnosticSeverity)
              }
              className="w-full rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9] hover:border-[#00E5FF]/50 focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
            >
              <option value="all" className="bg-[#0D131F]">
                All Severities ({findings.length})
              </option>
              <option value="critical" className="bg-[#0D131F]">
                Critical
              </option>
              <option value="high" className="bg-[#0D131F]">
                High
              </option>
              <option value="medium" className="bg-[#0D131F]">
                Medium
              </option>
              <option value="low" className="bg-[#0D131F]">
                Low
              </option>
              <option value="informational" className="bg-[#0D131F]">
                Informational
              </option>
            </select>
          </div>

          {/* Filter by Diagnostic Status */}
          <div className="md:col-span-5 flex items-center gap-2">
            <label
              htmlFor="diag-status-filter"
              className="font-mono text-[11px] uppercase text-[#64748B] shrink-0"
            >
              STATUS:
            </label>
            <select
              id="diag-status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | DiagnosticFindingStatus
                )
              }
              className="w-full rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9] hover:border-[#00E5FF]/50 focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
            >
              <option value="all" className="bg-[#0D131F]">
                All Diagnostic Statuses
              </option>
              <option value="open" className="bg-[#0D131F]">
                Open
              </option>
              <option value="under_review" className="bg-[#0D131F]">
                Under Review
              </option>
              <option value="action_planned" className="bg-[#0D131F]">
                Action Planned
              </option>
              <option value="resolved" className="bg-[#0D131F]">
                Resolved
              </option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={`w-full rounded px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider border transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                hasActiveFilters
                  ? "bg-[#131C2E] border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12]"
                  : "bg-[#0D131F] border-[#1E293B] text-[#64748B] cursor-not-allowed"
              }`}
            >
              CLEAR FILTERS
            </button>
          </div>
        </div>

        {/* Fixture Notice */}
        <div className="pt-2 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#64748B]">
          <span>
            NOTE: Findings below are isolated frontend fixtures for layout &
            interaction preview — not verified AI diagnoses.
          </span>
          {hasActiveFilters && (
            <span className="text-[#00E5FF]">
              FILTERS ACTIVE ({filteredFindings.length} MATCHED)
            </span>
          )}
        </div>
      </div>

      {/* Findings List or Empty State */}
      {findings.length === 0 ? (
        <DataEmptyState
          title="No Diagnostic Findings Recorded"
          description={`No condition findings are logged in the local fixture dataset for ${machineId}.`}
        />
      ) : filteredFindings.length === 0 ? (
        <DataEmptyState
          title="No Diagnostic Findings Match Active Filters"
          description="Adjust or clear the severity and diagnostic status filters to view fixture findings."
          actionLabel="Clear Finding Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const sevMeta = SEVERITY_META[finding.severity];
            const statMeta = STATUS_META[finding.status];
            const isExpanded = Boolean(expandedIds[finding.id]);

            return (
              <article
                key={finding.id}
                className={`rounded-md bg-[#070B12] border ${sevMeta.borderClass} p-4 transition-colors duration-200 ease-out`}
              >
                {/* Top Row: Severity, Finding ID, Status & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={sevMeta.tone}
                      pulse={finding.severity === "critical"}
                      label={`SEV: ${sevMeta.label}`}
                      ariaLabel={`Finding severity: ${sevMeta.label}`}
                    />
                    <StatusBadge
                      tone={statMeta.tone}
                      label={statMeta.label}
                      ariaLabel={`Finding status: ${statMeta.label}`}
                    />
                    <span className="font-mono text-xs font-semibold text-[#00E5FF]">
                      {finding.id}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    Updated {finding.lastUpdatedRelative} (
                    {finding.lastUpdatedUtc})
                  </span>
                </div>

                {/* Finding Title & Affected Component */}
                <div className="mt-2.5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm md:text-base font-semibold text-[#F1F5F9]">
                      {finding.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">
                      Affected Component:{" "}
                      <span className="font-medium text-[#F1F5F9]">
                        {finding.affectedComponent}
                      </span>{" "}
                      <span className="font-mono text-[11px] text-[#00E5FF]">
                        [{finding.componentCode}]
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(finding.id)}
                    aria-expanded={isExpanded}
                    className="shrink-0 rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] uppercase text-[#00E5FF] hover:border-[#00E5FF] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                  >
                    {isExpanded ? "HIDE EVIDENCE ▲" : "INSPECT EVIDENCE ▼"}
                  </button>
                </div>

                {/* Summary Reading Strip */}
                <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 font-mono text-xs tabular-nums">
                  <div>
                    <span className="text-[#64748B]">SENSOR EVIDENCE: </span>
                    <span className="text-[#F1F5F9] font-medium">
                      {finding.sensorReadingsSummary}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">REFERENCE: </span>
                    <span className="text-[#94A3B8]">
                      {finding.thresholdReference}
                    </span>
                  </div>
                </div>

                {/* Expandable Supporting Evidence & Recommended Next Action */}
                {isExpanded && (
                  <div className="mt-3 rounded bg-[#0D131F] border border-[#1E293B] p-3.5 space-y-3 transition-all duration-200 ease-out">
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#00E5FF] mb-1.5">
                        SUPPORTING SENSOR OBSERVATIONS (FIXTURE)
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#F1F5F9]">
                        {finding.supportingEvidence.map((ev, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {finding.recommendedNextAction && (
                      <div className="pt-2.5 border-t border-[#1E293B]">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#10B981] mb-1">
                          RECOMMENDED NEXT ACTION
                        </span>
                        <p className="text-xs text-[#F1F5F9]">
                          {finding.recommendedNextAction}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#1E293B] font-mono text-[10px] text-[#64748B]">
                      {finding.fixtureDisclaimer}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PanelContainer>
  );
}
