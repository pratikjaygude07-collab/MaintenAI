"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  FleetInventorySummary,
  FleetMachineRecord,
  FleetMaintenanceStatus,
  FleetOperatingStatus,
  FleetSortField,
  SortDirection,
} from "@/types/telemetry";
import {
  DataEmptyState,
  DataErrorState,
  DataLoadingState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";
import { FleetSummaryRow } from "@/components/fleet/FleetSummaryRow";

interface FleetInventoryViewProps {
  initialMachines: FleetMachineRecord[];
  summary: FleetInventorySummary;
}

type PreviewFeedState = "ready" | "loading" | "unavailable" | "error";

const OPERATING_STATUS_META: Record<
  FleetOperatingStatus,
  {
    label: string;
    tone: "nominal" | "warning" | "critical" | "cyan";
    ariaDescription: string;
    rowAccent: string;
  }
> = {
  operational: {
    label: "OPERATIONAL",
    tone: "nominal",
    ariaDescription: "Operating Status: Operational within normal limits",
    rowAccent: "border-l-2 border-l-transparent",
  },
  warning: {
    label: "WARNING",
    tone: "warning",
    ariaDescription: "Operating Status: Warning — early degradation detected",
    rowAccent: "border-l-2 border-l-[#F59E0B] bg-[#F59E0B]/[0.03]",
  },
  critical: {
    label: "CRITICAL",
    tone: "critical",
    ariaDescription: "Operating Status: Critical — immediate fault threshold exceeded",
    rowAccent: "border-l-2 border-l-[#EF4444] bg-[#EF4444]/[0.04]",
  },
  maintenance: {
    label: "MAINTENANCE",
    tone: "cyan",
    ariaDescription: "Operating Status: Offline for active maintenance service",
    rowAccent: "border-l-2 border-l-[#00E5FF] bg-[#00E5FF]/[0.02]",
  },
};

const MAINTENANCE_STATUS_META: Record<
  FleetMaintenanceStatus,
  {
    tone: "nominal" | "warning" | "critical" | "cyan";
    ariaPrefix: string;
  }
> = {
  up_to_date: {
    tone: "nominal",
    ariaPrefix: "Maintenance Status: Up to date —",
  },
  scheduled: {
    tone: "warning",
    ariaPrefix: "Maintenance Status: Scheduled —",
  },
  in_progress: {
    tone: "cyan",
    ariaPrefix: "Maintenance Status: In progress —",
  },
  overdue: {
    tone: "critical",
    ariaPrefix: "Maintenance Status: Action required —",
  },
};

export function FleetInventoryView({
  initialMachines,
  summary,
}: FleetInventoryViewProps) {
  const router = useRouter();

  // Interactive filter & sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FleetOperatingStatus>(
    "all"
  );
  const [onlyNeedsAttention, setOnlyNeedsAttention] = useState(false);
  const [sortField, setSortField] = useState<FleetSortField>("healthScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [feedState, setFeedState] = useState<PreviewFeedState>("ready");

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    onlyNeedsAttention ||
    sortField !== "healthScore" ||
    sortDirection !== "asc";

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setOnlyNeedsAttention(false);
    setSortField("healthScore");
    setSortDirection("asc");
    setFeedState("ready");
  };

  const handleToggleSort = (field: FleetSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "healthScore" ? "asc" : "asc");
    }
  };

  const filteredAndSortedMachines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = initialMachines.filter((machine) => {
      if (statusFilter !== "all" && machine.operatingStatus !== statusFilter) {
        return false;
      }
      if (onlyNeedsAttention && !machine.needsAttention) {
        return false;
      }
      if (query.length > 0) {
        const matchesId = machine.machineId.toLowerCase().includes(query);
        const matchesName = machine.machineName.toLowerCase().includes(query);
        const matchesType = machine.machineType.toLowerCase().includes(query);
        const matchesPlant =
          machine.plant.toLowerCase().includes(query) ||
          machine.locationZone.toLowerCase().includes(query);
        return matchesId || matchesName || matchesType || matchesPlant;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === "healthScore") {
        comparison = a.healthScore - b.healthScore;
      } else {
        comparison = a.machineName.localeCompare(b.machineName);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    initialMachines,
    searchQuery,
    statusFilter,
    onlyNeedsAttention,
    sortField,
    sortDirection,
  ]);

  const navigateToMachine = (machineId: string) => {
    router.push(`/fleet/${encodeURIComponent(machineId)}`);
  };

  const getHealthBarColor = (score: number) => {
    if (score < 70) return "bg-[#EF4444]";
    if (score < 88) return "bg-[#F59E0B]";
    return "bg-[#10B981]";
  };

  const getTempColor = (m: FleetMachineRecord) => {
    if (m.temperatureC >= m.tempThresholdCritical)
      return "text-[#EF4444] font-semibold";
    if (m.temperatureC >= m.tempThresholdWarning)
      return "text-[#F59E0B] font-semibold";
    return "text-[#F1F5F9]";
  };

  const getVibrationColor = (m: FleetMachineRecord) => {
    if (m.vibrationRms >= m.vibThresholdCritical)
      return "text-[#EF4444] font-semibold";
    if (m.vibrationRms >= m.vibThresholdWarning)
      return "text-[#F59E0B] font-semibold";
    return "text-[#F1F5F9]";
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Row */}
      <FleetSummaryRow
        summary={summary}
        activeStatusFilter={statusFilter}
        onlyNeedsAttention={onlyNeedsAttention}
        onSelectQuickFilter={({ status, attention }) => {
          setStatusFilter(status);
          setOnlyNeedsAttention(attention);
          setFeedState("ready");
        }}
      />

      {/* 2. Machine Inventory Panel */}
      <PanelContainer
        codeTag="FLT-INV-01"
        title="Industrial Machine Inventory & Telemetry Matrix"
        subtitle="Click any machine row or card to inspect its dedicated asset profile and sensor thresholds"
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            {/* UI State Preview Switcher for testing Loading / Error / Ready states */}
            <div
              role="group"
              aria-label="Preview telemetry feed state"
              className="inline-flex items-center rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
            >
              <span className="px-2 font-mono text-[10px] uppercase text-[#64748B]">
                STATE:
              </span>
              {(
                [
                  { id: "ready", label: "READY" },
                  { id: "loading", label: "LOAD" },
                  { id: "unavailable", label: "UNAVAIL" },
                  { id: "error", label: "FAULT" },
                ] as const
              ).map((item) => {
                const active = feedState === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeedState(item.id)}
                    aria-pressed={active}
                    className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                      active
                        ? "bg-[#131C2E] text-[#00E5FF] font-semibold border border-[#00E5FF]/40"
                        : "text-[#94A3B8] hover:text-[#F1F5F9]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        }
      >
        {/* Interactive Filter, Search & Sort Control Bar */}
        <div className="mb-5 rounded-md bg-[#070B12] border border-[#1E293B] p-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search by Machine Name or ID */}
            <div className="md:col-span-4 relative">
              <label htmlFor="fleet-machine-search" className="sr-only">
                Search machines by name or ID
              </label>
              <div className="relative flex items-center">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute left-3 h-4 w-4 text-[#64748B]"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M13.5 13.5L17 17"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  id="fleet-machine-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Machine ID, name, or sector..."
                  className="w-full rounded bg-[#0D131F] border border-[#1E293B] pl-9 pr-8 py-1.5 font-mono text-xs text-[#F1F5F9] placeholder:text-[#64748B] hover:border-[#26354D] focus:border-[#00E5FF] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search query"
                    className="absolute right-2 rounded px-1.5 py-0.5 font-mono text-xs text-[#94A3B8] hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Operating Status */}
            <div className="md:col-span-3 flex items-center gap-2">
              <label
                htmlFor="fleet-status-filter"
                className="font-mono text-[11px] uppercase text-[#64748B] shrink-0"
              >
                STATUS:
              </label>
              <select
                id="fleet-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | FleetOperatingStatus
                  )
                }
                className="w-full rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9] hover:border-[#00E5FF]/50 focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
              >
                <option value="all" className="bg-[#0D131F]">
                  All Operating Statuses ({initialMachines.length})
                </option>
                <option value="operational" className="bg-[#0D131F]">
                  Operational ({summary.operationalAssets})
                </option>
                <option value="warning" className="bg-[#0D131F]">
                  Warning / Degrading (3)
                </option>
                <option value="critical" className="bg-[#0D131F]">
                  Critical ({summary.criticalAssets})
                </option>
                <option value="maintenance" className="bg-[#0D131F]">
                  Active Maintenance (1)
                </option>
              </select>
            </div>

            {/* Sort By Field + Direction */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <label
                htmlFor="fleet-sort-field"
                className="font-mono text-[11px] uppercase text-[#64748B] shrink-0"
              >
                SORT:
              </label>
              <select
                id="fleet-sort-field"
                value={sortField}
                onChange={(e) =>
                  setSortField(e.target.value as FleetSortField)
                }
                className="w-full rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9] hover:border-[#00E5FF]/50 focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
              >
                <option value="healthScore" className="bg-[#0D131F]">
                  Health Score
                </option>
                <option value="machineName" className="bg-[#0D131F]">
                  Machine Name
                </option>
              </select>

              <button
                type="button"
                onClick={() =>
                  setSortDirection((prev) =>
                    prev === "asc" ? "desc" : "asc"
                  )
                }
                aria-label={`Sort direction: ${
                  sortDirection === "asc" ? "Ascending" : "Descending"
                }. Click to toggle.`}
                className="shrink-0 rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1.5 font-mono text-xs text-[#00E5FF] hover:border-[#00E5FF] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
              >
                {sortField === "healthScore"
                  ? sortDirection === "asc"
                    ? "LOW→HIGH ↑"
                    : "HIGH→LOW ↓"
                  : sortDirection === "asc"
                  ? "A→Z ↑"
                  : "Z→A ↓"}
              </button>
            </div>

            {/* Filter Assets Needing Attention Toggle */}
            <div className="md:col-span-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setOnlyNeedsAttention((prev) => !prev)}
                aria-pressed={onlyNeedsAttention}
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                  onlyNeedsAttention
                    ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] font-semibold"
                    : "bg-[#0D131F] border-[#1E293B] text-[#94A3B8] hover:border-[#F59E0B]/50 hover:text-[#F1F5F9]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    onlyNeedsAttention ? "bg-[#F59E0B]" : "bg-[#64748B]"
                  }`}
                  aria-hidden="true"
                />
                <span>NEEDS ATTENTION ({summary.attentionAssets})</span>
              </button>
            </div>
          </div>

          {/* Filter Status Strip + Clear Filters Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E293B] font-mono text-[11px]">
            <div className="flex flex-wrap items-center gap-2 text-[#94A3B8]">
              <span>
                SHOWING{" "}
                <strong className="text-[#F1F5F9]">
                  {filteredAndSortedMachines.length}
                </strong>{" "}
                OF {initialMachines.length} FIXTURE UNITS
              </span>
              {statusFilter !== "all" && (
                <span className="rounded bg-[#131C2E] border border-[#1E293B] px-2 py-0.5 text-[#00E5FF]">
                  STATUS: {statusFilter.toUpperCase()}
                </span>
              )}
              {onlyNeedsAttention && (
                <span className="rounded bg-[#F59E0B]/12 border border-[#F59E0B]/35 px-2 py-0.5 text-[#F59E0B]">
                  FILTER: NEEDS ATTENTION
                </span>
              )}
              {searchQuery.trim() && (
                <span className="rounded bg-[#131C2E] border border-[#1E293B] px-2 py-0.5 text-[#00E5FF]">
                  QUERY: &ldquo;{searchQuery.trim()}&rdquo;
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters && feedState === "ready"}
              className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider border transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                hasActiveFilters || feedState !== "ready"
                  ? "bg-[#131C2E] border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12]"
                  : "bg-[#0D131F] border-[#1E293B] text-[#64748B] cursor-not-allowed"
              }`}
            >
              CLEAR FILTERS
            </button>
          </div>
        </div>

        {/* Conditional State Handling: Loading / Unavailable / Error / Empty / Data */}
        {feedState === "loading" ? (
          <DataLoadingState
            title="BUFFERING FLEET ASSET INVENTORY..."
            rows={6}
          />
        ) : feedState === "unavailable" ? (
          <DataEmptyState
            title="Fleet Inventory Service Unavailable"
            description="Fleet registry telemetry stream is currently offline or awaiting backend connection. Restore the local fixture dataset to inspect the 12 industrial records."
            actionLabel="Restore Fixture Registry"
            onAction={() => setFeedState("ready")}
          />
        ) : feedState === "error" ? (
          <DataErrorState
            onRetry={() => setFeedState("ready")}
          />
        ) : filteredAndSortedMachines.length === 0 ? (
          <DataEmptyState
            onAction={handleClearFilters}
          />
        ) : (
          <>
            {/* DESKTOP VIEW (xl+): Full 10-Column Machine Inventory Table */}
            <div className="hidden xl:block overflow-x-auto rounded-md border border-[#1E293B] bg-[#070B12]">
              <table
                className="w-full text-left border-collapse"
                aria-label="Industrial Machine Inventory Table"
              >
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#0D131F] font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
                    <th scope="col" className="py-3 pl-4 pr-3">
                      Machine ID
                    </th>
                    <th scope="col" className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleSort("machineName")}
                        className="inline-flex items-center gap-1 uppercase hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                      >
                        <span>Machine Name & Type</span>
                        <span className="text-[#00E5FF]">
                          {sortField === "machineName"
                            ? sortDirection === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Plant / Location
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Operating Status
                    </th>
                    <th scope="col" className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleSort("healthScore")}
                        className="inline-flex items-center gap-1 uppercase hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                      >
                        <span>Health Score</span>
                        <span className="text-[#00E5FF]">
                          {sortField === "healthScore"
                            ? sortDirection === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Temp
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Vibration
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      RPM
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Last Update
                    </th>
                    <th scope="col" className="py-3 pl-3 pr-4">
                      Maintenance Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs">
                  {filteredAndSortedMachines.map((machine) => {
                    const opMeta =
                      OPERATING_STATUS_META[machine.operatingStatus];
                    const maintMeta =
                      MAINTENANCE_STATUS_META[machine.maintenanceStatus];

                    return (
                      <tr
                        key={machine.machineId}
                        role="link"
                        tabIndex={0}
                        aria-label={`Inspect ${machine.machineName} (${machine.machineId}), status ${opMeta.label}, health score ${machine.healthScore}%`}
                        onClick={() => navigateToMachine(machine.machineId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigateToMachine(machine.machineId);
                          }
                        }}
                        className={`group cursor-pointer transition-colors hover:bg-[#131C2E]/75 focus-visible:bg-[#131C2E] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#00E5FF] ${opMeta.rowAccent}`}
                      >
                        {/* 1. Machine ID */}
                        <td className="py-3.5 pl-4 pr-3 font-mono whitespace-nowrap">
                          <Link
                            href={`/fleet/${encodeURIComponent(machine.machineId)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-[#00E5FF] group-hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                          >
                            {machine.machineId}
                          </Link>
                          {machine.needsAttention && (
                            <span
                              className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#F59E0B]"
                              title="Flagged for engineering attention"
                              aria-label="Needs attention"
                            />
                          )}
                        </td>

                        {/* 2. Machine Name & Type */}
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-[#F1F5F9] group-hover:text-[#00E5FF] transition-colors">
                            {machine.machineName}
                          </div>
                          <div className="font-mono text-[11px] text-[#64748B]">
                            {machine.machineType}
                          </div>
                        </td>

                        {/* 3. Plant / Location */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-mono text-xs text-[#F1F5F9]">
                            {machine.plant}
                          </div>
                          <div className="font-mono text-[11px] text-[#94A3B8]">
                            {machine.locationZone}
                          </div>
                        </td>

                        {/* 4. Operating Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <StatusBadge
                            tone={opMeta.tone}
                            pulse={machine.operatingStatus === "critical"}
                            label={opMeta.label}
                            ariaLabel={opMeta.ariaDescription}
                          />
                        </td>

                        {/* 5. Health Score */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="w-28">
                            <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                              <span className="font-semibold text-[#F1F5F9]">
                                {machine.healthScore.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-[#64748B]">
                                RUL {machine.rulHours}h
                              </span>
                            </div>
                            <div
                              className="mt-1 h-1.5 w-full rounded-full bg-[#131C2E] overflow-hidden"
                              role="progressbar"
                              aria-valuenow={machine.healthScore}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Health score ${machine.healthScore}%`}
                            >
                              <div
                                className={`h-full rounded-full ${getHealthBarColor(
                                  machine.healthScore
                                )}`}
                                style={{ width: `${machine.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 6. Temperature */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className={getTempColor(machine)}>
                            {machine.temperatureC.toFixed(1)} °C
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            Lim {machine.tempThresholdWarning}°C
                          </div>
                        </td>

                        {/* 7. Vibration */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className={getVibrationColor(machine)}>
                            {machine.vibrationRms.toFixed(1)} mm/s
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            ISO {machine.vibThresholdWarning}
                          </div>
                        </td>

                        {/* 8. RPM */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="text-[#F1F5F9]">
                            {machine.rpm.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            /{machine.rpmNominal.toLocaleString()}
                          </div>
                        </td>

                        {/* 9. Last Update */}
                        <td className="py-3.5 px-3 font-mono tabular-nums whitespace-nowrap">
                          <div className="text-[#F1F5F9]">
                            {machine.lastUpdateRelative}
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            {machine.lastUpdateUtc}
                          </div>
                        </td>

                        {/* 10. Maintenance Status */}
                        <td className="py-3.5 pl-3 pr-4 whitespace-nowrap">
                          <StatusBadge
                            tone={maintMeta.tone}
                            label={machine.maintenanceLabel}
                            ariaLabel={`${maintMeta.ariaPrefix} ${machine.maintenanceLabel}`}
                          />
                          <div className="mt-1 font-mono text-[10px] text-[#64748B]">
                            {machine.nextMaintenanceWindow}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TABLET VIEW (md to xl): Compact Structured Layout */}
            <div className="hidden md:block xl:hidden overflow-x-auto rounded-md border border-[#1E293B] bg-[#070B12]">
              <table
                className="w-full text-left border-collapse"
                aria-label="Compact Tablet Machine Inventory Table"
              >
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#0D131F] font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
                    <th scope="col" className="py-3 pl-4 pr-2">
                      Machine / Plant
                    </th>
                    <th scope="col" className="py-3 px-2">
                      Status & Health
                    </th>
                    <th scope="col" className="py-3 px-2">
                      Sensor Telemetry (Temp / Vib / RPM)
                    </th>
                    <th scope="col" className="py-3 pl-2 pr-4">
                      Maintenance & Sync
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs">
                  {filteredAndSortedMachines.map((machine) => {
                    const opMeta =
                      OPERATING_STATUS_META[machine.operatingStatus];
                    const maintMeta =
                      MAINTENANCE_STATUS_META[machine.maintenanceStatus];

                    return (
                      <tr
                        key={machine.machineId}
                        role="link"
                        tabIndex={0}
                        aria-label={`Inspect ${machine.machineName} (${machine.machineId})`}
                        onClick={() => navigateToMachine(machine.machineId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigateToMachine(machine.machineId);
                          }
                        }}
                        className={`cursor-pointer transition-colors hover:bg-[#131C2E]/75 ${opMeta.rowAccent}`}
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/fleet/${encodeURIComponent(
                                machine.machineId
                              )}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-xs font-semibold text-[#00E5FF] hover:underline"
                            >
                              {machine.machineId}
                            </Link>
                            <span className="font-mono text-[10px] text-[#94A3B8]">
                              [{machine.plant}]
                            </span>
                          </div>
                          <div className="mt-0.5 font-medium text-[#F1F5F9]">
                            {machine.machineName}
                          </div>
                          <div className="font-mono text-[11px] text-[#64748B]">
                            {machine.machineType} • {machine.locationZone}
                          </div>
                        </td>

                        <td className="py-3.5 px-2 whitespace-nowrap">
                          <StatusBadge
                            tone={opMeta.tone}
                            pulse={machine.operatingStatus === "critical"}
                            label={opMeta.label}
                            ariaLabel={opMeta.ariaDescription}
                          />
                          <div className="mt-2 w-28">
                            <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                              <span className="font-semibold text-[#F1F5F9]">
                                {machine.healthScore.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-[#64748B]">
                                {machine.rulHours}h RUL
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-[#131C2E] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getHealthBarColor(
                                  machine.healthScore
                                )}`}
                                style={{ width: `${machine.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-2 font-mono text-xs tabular-nums whitespace-nowrap">
                          <div className="grid grid-cols-3 gap-2 rounded bg-[#0D131F] border border-[#1E293B] p-2">
                            <div>
                              <span className="block text-[10px] text-[#64748B]">
                                TEMP
                              </span>
                              <span className={getTempColor(machine)}>
                                {machine.temperatureC.toFixed(1)}°C
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-[#64748B]">
                                VIB RMS
                              </span>
                              <span className={getVibrationColor(machine)}>
                                {machine.vibrationRms.toFixed(1)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-[#64748B]">
                                RPM
                              </span>
                              <span className="text-[#F1F5F9]">
                                {machine.rpm.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 pl-2 pr-4 whitespace-nowrap">
                          <StatusBadge
                            tone={maintMeta.tone}
                            label={machine.maintenanceLabel}
                            ariaLabel={`${maintMeta.ariaPrefix} ${machine.maintenanceLabel}`}
                          />
                          <div className="mt-1 font-mono text-[10px] text-[#94A3B8]">
                            {machine.nextMaintenanceWindow}
                          </div>
                          <div className="font-mono text-[10px] text-[#64748B]">
                            Sync: {machine.lastUpdateRelative} ({machine.lastUpdateUtc})
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW (< md): Readable Industrial Machine Cards */}
            <div
              className="grid grid-cols-1 gap-3.5 md:hidden"
              aria-label="Mobile Machine Inventory Cards"
            >
              {filteredAndSortedMachines.map((machine) => {
                const opMeta = OPERATING_STATUS_META[machine.operatingStatus];
                const maintMeta =
                  MAINTENANCE_STATUS_META[machine.maintenanceStatus];

                return (
                  <article
                    key={machine.machineId}
                    onClick={() => navigateToMachine(machine.machineId)}
                    className={`cursor-pointer rounded-md bg-[#070B12] border border-[#1E293B] p-4 transition-colors hover:border-[#00E5FF]/50 ${opMeta.rowAccent}`}
                  >
                    {/* Header: ID + Operating Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/fleet/${encodeURIComponent(
                              machine.machineId
                            )}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-sm font-bold text-[#00E5FF] hover:underline"
                          >
                            {machine.machineId}
                          </Link>
                          <span className="font-mono text-[11px] text-[#94A3B8]">
                            • {machine.plant}
                          </span>
                        </div>
                        <h3 className="mt-1 font-display text-sm font-semibold text-[#F1F5F9]">
                          {machine.machineName}
                        </h3>
                        <p className="font-mono text-[11px] text-[#64748B]">
                          {machine.machineType}
                        </p>
                      </div>

                      <StatusBadge
                        tone={opMeta.tone}
                        pulse={machine.operatingStatus === "critical"}
                        label={opMeta.label}
                        ariaLabel={opMeta.ariaDescription}
                      />
                    </div>

                    {/* Location & Health Score Bar */}
                    <div className="mt-3 pt-3 border-t border-[#1E293B]">
                      <div className="flex items-center justify-between font-mono text-xs mb-1">
                        <span className="text-[#94A3B8]">
                          {machine.locationZone}
                        </span>
                        <span className="text-[#F1F5F9] font-semibold tabular-nums">
                          HLTH {machine.healthScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#131C2E] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getHealthBarColor(
                            machine.healthScore
                          )}`}
                          style={{ width: `${machine.healthScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Telemetry 4-Grid: Temp, Vibration, RPM, Last Update */}
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded bg-[#0D131F] border border-[#1E293B] p-2.5 font-mono text-xs tabular-nums">
                      <div>
                        <span className="block text-[10px] text-[#64748B]">
                          TEMPERATURE
                        </span>
                        <span className={getTempColor(machine)}>
                          {machine.temperatureC.toFixed(1)} °C
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#64748B]">
                          VIBRATION RMS
                        </span>
                        <span className={getVibrationColor(machine)}>
                          {machine.vibrationRms.toFixed(1)} mm/s
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#64748B]">
                          SHAFT SPEED
                        </span>
                        <span className="text-[#F1F5F9]">
                          {machine.rpm.toLocaleString()} RPM
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#64748B]">
                          LAST UPDATE
                        </span>
                        <span className="text-[#F1F5F9]">
                          {machine.lastUpdateRelative}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Maintenance Status + Inspect Link */}
                    <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge
                        tone={maintMeta.tone}
                        label={machine.maintenanceLabel}
                        ariaLabel={`${maintMeta.ariaPrefix} ${machine.maintenanceLabel}`}
                      />
                      <Link
                        href={`/fleet/${encodeURIComponent(machine.machineId)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs font-medium text-[#00E5FF] hover:underline"
                      >
                        INSPECT ASSET →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </PanelContainer>
    </div>
  );
}
