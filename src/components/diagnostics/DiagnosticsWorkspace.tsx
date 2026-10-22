"use client";

import { useState } from "react";
import Link from "next/link";
import type { MachineDiagnosticProfile } from "@/types/telemetry";
import {
  DataEmptyState,
  DataErrorState,
  DataLoadingState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";
import { DiagnosticsSensorAnalysis } from "@/components/diagnostics/DiagnosticsSensorAnalysis";
import { DiagnosticFindingsPanel } from "@/components/diagnostics/DiagnosticFindingsPanel";
import { MaintenanceRecommendationsPanel } from "@/components/diagnostics/MaintenanceRecommendationsPanel";
import { DiagnosticsTimelinePanel } from "@/components/diagnostics/DiagnosticsTimelinePanel";

interface DiagnosticsWorkspaceProps {
  profiles: MachineDiagnosticProfile[];
}

type DiagnosticsViewState = "ready" | "loading" | "unavailable" | "error";

export function DiagnosticsWorkspace({ profiles }: DiagnosticsWorkspaceProps) {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const paramId = new URLSearchParams(window.location.search).get(
        "machine"
      );
      if (
        paramId &&
        profiles.some(
          (p) => p.machineId.toLowerCase() === paramId.toLowerCase()
        )
      ) {
        return (
          profiles.find(
            (p) => p.machineId.toLowerCase() === paramId.toLowerCase()
          )?.machineId ??
          profiles[0]?.machineId ??
          "TURB-GEN-04"
        );
      }
    }
    return profiles[0]?.machineId ?? "TURB-GEN-04";
  });
  const [viewState, setViewState] = useState<DiagnosticsViewState>("ready");

  const activeProfile =
    profiles.find((p) => p.machineId === selectedMachineId) ?? profiles[0];

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setViewState("ready");
  };

  if (!activeProfile) {
    return (
      <DataEmptyState
        title="No Diagnostic Profiles Available"
        description="No industrial machine diagnostic profiles were loaded from the fixture dataset."
      />
    );
  }

  const opTone =
    activeProfile.operatingStatus === "operational"
      ? "nominal"
      : activeProfile.operatingStatus === "warning"
      ? "warning"
      : activeProfile.operatingStatus === "critical"
      ? "critical"
      : "cyan";

  const reviewTone =
    activeProfile.diagnosticReviewStatus === "verified_baseline"
      ? "nominal"
      : activeProfile.diagnosticReviewStatus === "in_review"
      ? "warning"
      : "critical";

  const exceededCount = activeProfile.sensorConditions.filter(
    (c) => c.thresholdExceeded
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Preview Fixture Banner & Machine Selector */}
      <div className="rounded-md bg-[#0D131F] border border-[#1E293B] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <StatusBadge
              tone="cyan"
              label="PREVIEW DATA // DIAGNOSTICS FIXTURE"
            />
            <span className="text-[#94A3B8]">
              FRONTEND CONDITION ANALYSIS WORKBENCH — BACKEND DECOUPLED
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Structured machine condition analysis, multi-channel sensor
            threshold verification, diagnostic findings, and maintenance
            recommendations using isolated frontend fixture data.
          </p>
        </div>

        {/* Machine Selector + UI State Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor="diagnostics-machine-select"
            className="font-mono text-xs uppercase text-[#94A3B8]"
          >
            ASSET:
          </label>
          <select
            id="diagnostics-machine-select"
            value={selectedMachineId}
            onChange={(e) => handleSelectMachine(e.target.value)}
            className="rounded bg-[#131C2E] border border-[#00E5FF]/50 px-3 py-1.5 font-mono text-xs text-[#F1F5F9] hover:border-[#00E5FF] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            {profiles.map((prof) => (
              <option
                key={prof.machineId}
                value={prof.machineId}
                className="bg-[#0D131F]"
              >
                {prof.machineId} — {prof.machineName} (
                {prof.operatingStatus.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Quick Asset Pills */}
          <div
            role="group"
            aria-label="Quick machine selector pills"
            className="hidden sm:inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
          >
            {profiles.map((prof) => {
              const active = prof.machineId === selectedMachineId;
              return (
                <button
                  key={prof.machineId}
                  type="button"
                  onClick={() => handleSelectMachine(prof.machineId)}
                  aria-pressed={active}
                  className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                    active
                      ? "bg-[#00E5FF] text-[#070B12] font-semibold"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  {prof.machineId}
                </button>
              );
            })}
          </div>

          {/* UI State Preview Switcher (Ready / Loading / Unavailable / Error) */}
          <div
            role="group"
            aria-label="Diagnostics view state preview"
            className="inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
          >
            {(
              [
                { id: "ready", label: "READY" },
                { id: "loading", label: "LOAD" },
                { id: "unavailable", label: "UNAVAIL" },
                { id: "error", label: "FAULT" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setViewState(st.id)}
                aria-pressed={viewState === st.id}
                className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                  viewState === st.id
                    ? "bg-[#131C2E] text-[#00E5FF] font-semibold border border-[#00E5FF]/40"
                    : "text-[#64748B] hover:text-[#F1F5F9]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditional Loading / Data Unavailable / Error States */}
      {viewState === "loading" ? (
        <DataLoadingState
          title={`LOADING DIAGNOSTIC WORKBENCH FOR ${activeProfile.machineId}...`}
          rows={6}
        />
      ) : viewState === "unavailable" ? (
        <DataEmptyState
          title={`Diagnostic Telemetry Unavailable for ${activeProfile.machineId}`}
          description="Diagnostic telemetry packet is currently unavailable or awaiting backend service connection. Do not substitute unverified results."
          actionLabel="Restore Fixture Preview"
          onAction={() => setViewState("ready")}
        />
      ) : viewState === "error" ? (
        <DataErrorState
          errorCode="ERR-DIAG-STREAM-503"
          title={`Diagnostic Service Stream Interrupted (${activeProfile.machineId})`}
          description="Unable to retrieve diagnostic condition records from the telemetry buffer. Retry to restore the local fixture view."
          onRetry={() => setViewState("ready")}
        />
      ) : (
        <>
          {/* Section 2: Diagnostics Overview Panel */}
          <PanelContainer
            codeTag={`DGN-OVW // ${activeProfile.machineId}`}
            title={`${activeProfile.machineName} (${activeProfile.machineId})`}
            subtitle={`${activeProfile.equipmentType} • ${activeProfile.plant} — ${activeProfile.locationZone}`}
            headerAction={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/digital-twin?machine=${encodeURIComponent(
                    activeProfile.machineId
                  )}`}
                  className="rounded bg-[#131C2E] border border-[#00E5FF]/40 px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                >
                  3D DIGITAL TWIN →
                </Link>
                <Link
                  href={`/fleet/${encodeURIComponent(activeProfile.machineId)}`}
                  className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF] hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                >
                  FLEET PROFILE →
                </Link>
              </div>
            }
          >
            {/* 6-Column Diagnostics Overview Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* 1. Operating Status */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  OPERATING STATUS
                </span>
                <div className="mt-2">
                  <StatusBadge
                    tone={opTone}
                    pulse={activeProfile.operatingStatus === "critical"}
                    label={activeProfile.operatingStatus.toUpperCase()}
                  />
                </div>
                <span className="mt-2 block font-mono text-[11px] text-[#94A3B8]">
                  Sync: {activeProfile.lastDiagnosticSyncRelative}
                </span>
              </div>

              {/* 2. Machine Health Indicator */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  HEALTH INDICATOR
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-bold text-[#F1F5F9] tabular-nums">
                    {activeProfile.healthScore.toFixed(1)}%
                  </span>
                  <span className="font-mono text-[10px] text-[#64748B]">
                    COMPOSITE
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 w-full rounded-full bg-[#131C2E] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={activeProfile.healthScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Machine health indicator ${activeProfile.healthScore}%`}
                >
                  <div
                    className={`h-full rounded-full ${
                      activeProfile.healthScore < 70
                        ? "bg-[#EF4444]"
                        : activeProfile.healthScore < 88
                        ? "bg-[#F59E0B]"
                        : "bg-[#10B981]"
                    }`}
                    style={{ width: `${activeProfile.healthScore}%` }}
                  />
                </div>
              </div>

              {/* 3. Diagnostic Review Status */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  DIAGNOSTIC REVIEW
                </span>
                <div className="mt-2">
                  <StatusBadge
                    tone={reviewTone}
                    label={activeProfile.diagnosticReviewLabel}
                  />
                </div>
                <span className="mt-2 block font-mono text-[11px] text-[#94A3B8]">
                  {activeProfile.findings.length} Fixture Findings
                </span>
              </div>

              {/* 4. Sensor Condition Summary */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  SENSOR SUMMARY
                </span>
                <div className="mt-1 font-mono text-lg font-bold text-[#F1F5F9] tabular-nums">
                  {exceededCount > 0 ? (
                    <span className="text-[#EF4444]">
                      {exceededCount} / {activeProfile.sensorConditions.length}{" "}
                      EXCEEDED
                    </span>
                  ) : (
                    <span className="text-[#10B981]">
                      {activeProfile.sensorConditions.length} /{" "}
                      {activeProfile.sensorConditions.length} NORMAL
                    </span>
                  )}
                </div>
                <span className="mt-1 block font-mono text-[11px] text-[#94A3B8]">
                  Vib • Temp • RPM • Acoustic
                </span>
              </div>

              {/* 5. Active Alerts Summary */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  ACTIVE ALERTS
                </span>
                <div className="mt-1 font-mono text-xl font-bold text-[#F1F5F9] tabular-nums">
                  {activeProfile.activeAlerts.length}{" "}
                  <span className="text-xs font-normal text-[#94A3B8]">
                    EVENTS
                  </span>
                </div>
                <span className="mt-1 block font-mono text-[11px] text-[#94A3B8]">
                  {activeProfile.timelineEvents.length} Timeline Logs
                </span>
              </div>

              {/* 6. Maintenance Information */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  MAINTENANCE INFO
                </span>
                <span className="mt-1 block font-mono text-xs font-semibold text-[#00E5FF] truncate">
                  {activeProfile.maintenanceSummary.statusLabel}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-[#94A3B8] truncate">
                  {activeProfile.maintenanceSummary.scheduledWindow}
                </span>
              </div>
            </div>
          </PanelContainer>

          {/* Section 3: Dedicated Sensor Analysis Panels */}
          <DiagnosticsSensorAnalysis
            key={`sensor-${activeProfile.machineId}`}
            profile={activeProfile}
          />

          {/* Section 4, 5, 6: Main 12-Column Split — Findings & Recommendations (Left 7) + Alerts & Event Timeline (Right 5) */}
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 xl:col-span-7 space-y-6">
              {/* Diagnostic Results / Findings Panel */}
              <DiagnosticFindingsPanel
                key={`findings-${activeProfile.machineId}`}
                findings={activeProfile.findings}
                machineId={activeProfile.machineId}
              />

              {/* Maintenance Recommendations Panel */}
              <MaintenanceRecommendationsPanel
                key={`recs-${activeProfile.machineId}`}
                recommendations={activeProfile.recommendations}
                machineId={activeProfile.machineId}
              />
            </div>

            <div className="col-span-12 xl:col-span-5">
              {/* Active Alerts & Recent Diagnostic Events Timeline */}
              <DiagnosticsTimelinePanel
                alerts={activeProfile.activeAlerts}
                events={activeProfile.timelineEvents}
                machineId={activeProfile.machineId}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
