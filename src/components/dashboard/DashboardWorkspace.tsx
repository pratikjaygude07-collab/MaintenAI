"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  Ai4iDatasetSummary,
  AssetSummaryMetric,
  FleetHealthBucket,
  MaintenanceWorkOrder,
  MonitoredAssetStream,
  PredictiveAlert,
  SubsystemHealthSummary,
} from "@/types/telemetry";
import {
  DataEmptyState,
  DataErrorState,
  DataLoadingState,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";
import { AssetSummaryCards } from "@/components/dashboard/AssetSummaryCards";
import { Ai4iDatasetPanel } from "@/components/dashboard/Ai4iDatasetPanel";
import { SensorTrendCharts } from "@/components/dashboard/SensorTrendCharts";
import { FleetHealthOverview } from "@/components/dashboard/FleetHealthOverview";
import { RecentAlertsPanel } from "@/components/dashboard/RecentAlertsPanel";
import { MaintenanceActivityPanel } from "@/components/dashboard/MaintenanceActivityPanel";

interface DashboardWorkspaceProps {
  metrics: AssetSummaryMetric[];
  streams: MonitoredAssetStream[];
  buckets: FleetHealthBucket[];
  subsystems: SubsystemHealthSummary[];
  alerts: PredictiveAlert[];
  workOrders: MaintenanceWorkOrder[];
  ai4iSummary?: Ai4iDatasetSummary | null;
  ai4iStatus?: "ready" | "empty" | "error" | "unavailable";
  ai4iErrorCode?: string;
  ai4iErrorMessage?: string;
}

type DashboardViewState = "ready" | "loading" | "unavailable" | "error";

export function DashboardWorkspace({
  metrics,
  streams,
  buckets,
  subsystems,
  alerts,
  workOrders,
  ai4iSummary = null,
  ai4iStatus = "unavailable",
  ai4iErrorCode,
  ai4iErrorMessage,
}: DashboardWorkspaceProps) {
  const [viewState, setViewState] = useState<DashboardViewState>("ready");

  return (
    <div className="space-y-6">
      {/* Top Preview Fixture Notice & Quick Module Links */}
      <div className="rounded-md bg-[#0D131F] border border-[#1E293B] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <StatusBadge
              tone="cyan"
              label="PREVIEW DATA // LOCAL FIXTURE TELEMETRY"
            />
            <span className="text-[#94A3B8]">
              PLANT OVERVIEW & TELEMETRY SUMMARY — BACKEND DECOUPLED
            </span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Displaying isolated frontend fixture data for 148 monitored assets.
            Select any module or asset link to inspect Fleet inventory, 3D
            Digital Twin, or Diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Cross-Route Navigation */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href="/fleet"
              className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:border-[#00E5FF] transition-colors duration-200 ease-out"
            >
              FLEET →
            </Link>
            <Link
              href="/digital-twin"
              className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:border-[#00E5FF] transition-colors duration-200 ease-out"
            >
              3D TWIN →
            </Link>
            <Link
              href="/diagnostics"
              className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:border-[#00E5FF] transition-colors duration-200 ease-out"
            >
              DIAGNOSTICS →
            </Link>
          </div>

          {/* UI State Preview Switcher */}
          <div
            role="group"
            aria-label="Dashboard view state preview"
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

      {/* Conditional Loading / Data Unavailable / Error States */}
      {viewState === "loading" ? (
        <DataLoadingState
          title="SYNCHRONIZING PLANT DASHBOARD TELEMETRY..."
          rows={5}
        />
      ) : viewState === "unavailable" ? (
        <DataEmptyState
          title="Dashboard Telemetry Service Unavailable"
          description="Live plant telemetry stream is not connected yet. Restore the local fixture dataset to preview the Dashboard."
          actionLabel="Restore Fixture Preview"
          onAction={() => setViewState("ready")}
        />
      ) : viewState === "error" ? (
        <DataErrorState
          errorCode="ERR-DASH-GATEWAY-502"
          title="Plant Telemetry Aggregation Interrupted"
          description="Simulated gateway timeout while reading sector summary buffers. Click retry to restore the local fixture view."
          onRetry={() => setViewState("ready")}
        />
      ) : (
        <>
          {/* Row 1: 4-Column Asset Summary KPI Cards */}
          <AssetSummaryCards metrics={metrics} />

          {/* Row 2: Primary Telemetry & Fleet Health Split (12-Column Grid) */}
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 xl:col-span-8">
              <SensorTrendCharts streams={streams} />
            </div>
            <div className="col-span-12 xl:col-span-4">
              <FleetHealthOverview
                buckets={buckets}
                subsystems={subsystems}
              />
            </div>
          </div>

          {/* Row 3: Operational Action Split — Recent Alerts & Maintenance Activity */}
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 lg:col-span-6">
              <RecentAlertsPanel alerts={alerts} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <MaintenanceActivityPanel workOrders={workOrders} />
            </div>
          </div>

          {/* Row 4: AI4I Synthetic Dataset Summary */}
          <div className="col-span-12">
            <Ai4iDatasetPanel
              summary={ai4iSummary}
              status={ai4iStatus}
              errorCode={ai4iErrorCode}
              errorMessage={ai4iErrorMessage}
            />
          </div>
        </>
      )}
    </div>
  );
}
