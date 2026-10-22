"use client";

import { useState } from "react";
import Link from "next/link";
import type { DigitalTwinMachineProfile } from "@/types/telemetry";
import {
  DataEmptyState,
  DataErrorState,
  DataLoadingState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";
import { Machine3DViewport } from "@/components/digital-twin/Machine3DViewport";
import { DigitalTwinSensorPanels } from "@/components/digital-twin/DigitalTwinSensorPanels";
import { DigitalTwinConditionPanels } from "@/components/digital-twin/DigitalTwinConditionPanels";

interface DigitalTwinWorkspaceProps {
  profiles: DigitalTwinMachineProfile[];
}

type TwinViewState = "ready" | "loading" | "unavailable" | "empty" | "error";

export function DigitalTwinWorkspace({ profiles }: DigitalTwinWorkspaceProps) {
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
  const [selectedSubAssemblyId, setSelectedSubAssemblyId] = useState<
    string | null
  >(null);
  const [viewState, setViewState] = useState<TwinViewState>("ready");

  const activeMachine =
    profiles.find((p) => p.machineId === selectedMachineId) ?? profiles[0];

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setSelectedSubAssemblyId(null);
    setViewState("ready");
  };

  if (!activeMachine || viewState === "empty") {
    return (
      <div className="space-y-4">
        <DataEmptyState
          title="No Digital Twin Telemetry Profile Selected"
          description="Select an industrial asset from the fixture registry to load its 3D structural mesh and sensor trend channels."
          actionLabel="Restore Default Machine Profile"
          onAction={() => {
            setSelectedMachineId(profiles[0]?.machineId ?? "TURB-GEN-04");
            setViewState("ready");
          }}
        />
      </div>
    );
  }

  const opTone =
    activeMachine.operatingStatus === "operational"
      ? "nominal"
      : activeMachine.operatingStatus === "warning"
      ? "warning"
      : activeMachine.operatingStatus === "critical"
      ? "critical"
      : "cyan";

  const maintTone =
    activeMachine.maintenanceStatus === "up_to_date"
      ? "nominal"
      : activeMachine.maintenanceStatus === "scheduled"
      ? "warning"
      : activeMachine.maintenanceStatus === "overdue"
      ? "critical"
      : "cyan";

  return (
    <div className="space-y-6">
      {/* Top Preview Fixture Notice & Machine Selector Bar */}
      <div className="rounded-md bg-[#0D131F] border border-[#1E293B] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <StatusBadge
              tone="cyan"
              label="PREVIEW DATA // LOCAL FIXTURE TELEMETRY"
            />
            <span className="text-[#94A3B8]">
              ILLUSTRATIVE SENSOR & CONDITION FIXTURES — BACKEND DECOUPLED
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Select any monitored rotating machine below to synchronize its 3D
            structural assembly, sensor trends, and maintenance status.
          </p>
        </div>

        {/* Machine Selector Controls + State Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor="digital-twin-machine-select"
            className="font-mono text-xs uppercase text-[#94A3B8]"
          >
            MACHINE:
          </label>
          <select
            id="digital-twin-machine-select"
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
                {prof.machineId} — {prof.machineName} ({prof.operatingStatus.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Quick Machine Pill Buttons */}
          <div
            role="group"
            aria-label="Quick machine selector pills"
            className="hidden sm:inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
          >
            {profiles.map((prof) => {
              const isSelected = prof.machineId === selectedMachineId;
              return (
                <button
                  key={prof.machineId}
                  type="button"
                  onClick={() => handleSelectMachine(prof.machineId)}
                  aria-pressed={isSelected}
                  className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                    isSelected
                      ? "bg-[#00E5FF] text-[#070B12] font-semibold"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  {prof.machineId}
                </button>
              );
            })}
          </div>

          {/* UI State Preview Switcher */}
          <div
            role="group"
            aria-label="Digital Twin UI state preview"
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
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditional Loading / Unavailable / Error State Handling */}
      {viewState === "loading" ? (
        <DataLoadingState
          title={`INITIALIZING 3D TWIN & SENSOR CHANNELS FOR ${activeMachine.machineId}...`}
          rows={5}
        />
      ) : viewState === "unavailable" ? (
        <DataEmptyState
          title={`Digital Twin Stream Unavailable for ${activeMachine.machineId}`}
          description="Live 3D kinematics telemetry is not connected yet. Restore the local fixture profile to inspect the 3D machine assembly."
          actionLabel="Restore Fixture Twin"
          onAction={() => setViewState("ready")}
        />
      ) : viewState === "error" ? (
        <DataErrorState
          errorCode="ERR-TWIN-SYNC-408"
          title={`Digital Twin Stream Interrupted for ${activeMachine.machineId}`}
          description="Simulated telemetry buffer interruption. Click below to restore the local fixture profile."
          onRetry={() => setViewState("ready")}
        />
      ) : (
        <>
          {/* Section 2: Complete Machine Overview Header & 8-Metric Strip */}
          <PanelContainer
            codeTag={`TWN-OVW // ${activeMachine.machineId}`}
            title={`${activeMachine.machineName} (${activeMachine.machineId})`}
            subtitle={`Equipment Type: ${activeMachine.equipmentType} • Plant/Location: ${activeMachine.plant} — ${activeMachine.locationZone}`}
            headerAction={
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={opTone}
                  pulse={activeMachine.operatingStatus === "critical"}
                  label={`STATUS: ${activeMachine.operatingStatus.toUpperCase()}`}
                />
                <StatusBadge
                  tone={maintTone}
                  label={`MAINT: ${activeMachine.maintenanceLabel}`}
                />
                <Link
                  href={`/diagnostics?machine=${encodeURIComponent(
                    activeMachine.machineId
                  )}`}
                  className="rounded bg-[#131C2E] border border-[#00E5FF]/40 px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                >
                  DIAGNOSTICS →
                </Link>
                <Link
                  href={`/fleet/${encodeURIComponent(activeMachine.machineId)}`}
                  className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF] hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                >
                  FLEET RECORD →
                </Link>
              </div>
            }
          >
            {/* 8-Card Machine Overview Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
              {/* 1. Operating Status */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  OPERATING STATUS
                </span>
                <div className="mt-1.5">
                  <StatusBadge
                    tone={opTone}
                    pulse={activeMachine.operatingStatus === "critical"}
                    label={activeMachine.operatingStatus.toUpperCase()}
                  />
                </div>
              </div>

              {/* 2. Health Score */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  HEALTH SCORE
                </span>
                <span className="mt-1 block font-mono text-lg font-bold text-[#F1F5F9] tabular-nums">
                  {activeMachine.healthScore.toFixed(1)}%
                </span>
              </div>

              {/* 3. Temperature */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  TEMPERATURE
                </span>
                <span
                  className={`mt-1 block font-mono text-lg font-bold tabular-nums ${
                    activeMachine.temperatureC >= activeMachine.tempCriticalC
                      ? "text-[#EF4444]"
                      : activeMachine.temperatureC >= activeMachine.tempWarningC
                      ? "text-[#F59E0B]"
                      : "text-[#F1F5F9]"
                  }`}
                >
                  {activeMachine.temperatureC.toFixed(1)} °C
                </span>
              </div>

              {/* 4. Vibration */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  VIBRATION
                </span>
                <span
                  className={`mt-1 block font-mono text-lg font-bold tabular-nums ${
                    activeMachine.vibrationRms >= activeMachine.vibCriticalRms
                      ? "text-[#EF4444]"
                      : activeMachine.vibrationRms >= activeMachine.vibWarningRms
                      ? "text-[#F59E0B]"
                      : "text-[#F1F5F9]"
                  }`}
                >
                  {activeMachine.vibrationRms.toFixed(1)} mm/s
                </span>
              </div>

              {/* 5. RPM */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  SHAFT SPEED
                </span>
                <span className="mt-1 block font-mono text-lg font-bold text-[#F1F5F9] tabular-nums">
                  {activeMachine.rpm.toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-[#64748B]">
                    RPM
                  </span>
                </span>
              </div>

              {/* 6. Operating Hours */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  OPERATING HOURS
                </span>
                <span className="mt-1 block font-mono text-lg font-bold text-[#F1F5F9] tabular-nums">
                  {activeMachine.operatingHours.toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-[#64748B]">
                    hrs
                  </span>
                </span>
              </div>

              {/* 7. Maintenance Status */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  MAINTENANCE
                </span>
                <span className="mt-1 block font-mono text-xs font-semibold text-[#00E5FF] truncate">
                  {activeMachine.maintenanceLabel}
                </span>
              </div>

              {/* 8. Last Data Update */}
              <div className="rounded bg-[#070B12] border border-[#1E293B] p-3">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  LAST DATA UPDATE
                </span>
                <span className="mt-1 block font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums">
                  {activeMachine.lastUpdateRelative}
                </span>
                <span className="block font-mono text-[10px] text-[#64748B] tabular-nums">
                  {activeMachine.lastUpdateUtc}
                </span>
              </div>
            </div>
          </PanelContainer>

          {/* Main 12-Column Split: 3D Visualization + Sensor Trends (Left 8) & Condition Indicators (Right 4) */}
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 xl:col-span-8 space-y-6">
              {/* 3D Machine Visualization Panel */}
              <PanelContainer
                codeTag="TWN-3D-01"
                title="Interactive 3D Machine Visualization"
                subtitle="Three.js / React Three Fiber industrial rotating machine assembly with sub-component telemetry zones"
              >
                <Machine3DViewport
                  machine={activeMachine}
                  selectedSubAssemblyId={selectedSubAssemblyId}
                  onSelectSubAssembly={setSelectedSubAssemblyId}
                />
              </PanelContainer>

              {/* Sensor Trend Charts & Expandable Sub-Assembly Inspector */}
              <DigitalTwinSensorPanels
                machine={activeMachine}
                selectedSubAssemblyId={selectedSubAssemblyId}
                onSelectSubAssembly={setSelectedSubAssemblyId}
              />
            </div>

            {/* Right Column: Condition Indicators, Active Alerts, Recent Events & Maintenance */}
            <div className="col-span-12 xl:col-span-4">
              <DigitalTwinConditionPanels machine={activeMachine} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
