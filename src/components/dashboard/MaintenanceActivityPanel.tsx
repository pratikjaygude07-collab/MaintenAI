"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  MaintenanceStatus,
  MaintenanceWorkOrder,
} from "@/types/telemetry";
import {
  DataEmptyState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";

interface MaintenanceActivityPanelProps {
  workOrders: MaintenanceWorkOrder[];
}

const STATUS_META: Record<
  MaintenanceStatus,
  { label: string; tone: "cyan" | "warning" | "nominal" }
> = {
  in_progress: { label: "IN PROGRESS", tone: "cyan" },
  scheduled: { label: "SCHEDULED", tone: "warning" },
  completed: { label: "COMPLETED", tone: "nominal" },
};

export function MaintenanceActivityPanel({
  workOrders,
}: MaintenanceActivityPanelProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | MaintenanceStatus>(
    "all"
  );

  const filteredOrders = workOrders.filter((wo) =>
    statusFilter === "all" ? true : wo.status === statusFilter
  );

  return (
    <PanelContainer
      codeTag="MNT-04"
      title="Maintenance Activity & Dispatch"
      subtitle="Predictive work orders synchronized with plant reliability teams"
      headerAction={
        <div
          role="group"
          aria-label="Filter maintenance work orders by status"
          className="inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
        >
          {(
            [
              { key: "all", label: "ALL" },
              { key: "in_progress", label: "ACTIVE" },
              { key: "scheduled", label: "QUEUED" },
              { key: "completed", label: "DONE" },
            ] as const
          ).map((item) => {
            const active = statusFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key)}
                aria-pressed={active}
                className={`rounded px-2 py-1 font-mono text-[11px] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
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
      }
    >
      <div className="relative space-y-3">
        {filteredOrders.length === 0 ? (
          <DataEmptyState
            title="No Work Orders Match Selected Filter"
            description="No fixture maintenance work orders match the active status filter."
            actionLabel="Show All Work Orders"
            onAction={() => setStatusFilter("all")}
          />
        ) : (
          filteredOrders.map((wo) => {
          const meta = STATUS_META[wo.status];

          return (
            <article
              key={wo.id}
              className="rounded-md bg-[#070B12] border border-[#1E293B] p-3.5 hover:border-[#26354D] transition-colors duration-200 ease-out"
            >
              {/* Top Row: Work Order ID, Asset ID, Priority & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#131C2E] border border-[#1E293B] px-2 py-0.5 font-mono text-xs font-semibold text-[#00E5FF]">
                    {wo.id}
                  </span>
                  <Link
                    href={`/fleet/${encodeURIComponent(wo.assetId)}`}
                    className="font-mono text-xs font-medium text-[#F1F5F9] hover:text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                  >
                    {wo.assetId}
                  </Link>
                  <span className="rounded bg-[#0D131F] border border-[#1E293B] px-1.5 py-0.5 font-mono text-[10px] text-[#94A3B8] uppercase">
                    {wo.maintenanceType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] ${
                      wo.priority.startsWith("P1")
                        ? "text-[#EF4444]"
                        : wo.priority.startsWith("P2")
                        ? "text-[#F59E0B]"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {wo.priority}
                  </span>
                  <StatusBadge
                    tone={meta.tone}
                    pulse={wo.status === "in_progress"}
                    label={meta.label}
                  />
                </div>
              </div>

              {/* Task Title & Asset Name */}
              <div className="mt-2">
                <h3 className="text-sm font-medium text-[#F1F5F9]">
                  {wo.taskTitle}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Target Unit: {wo.assetName}
                  {wo.triggerAlertId && (
                    <span className="ml-2 font-mono text-[11px] text-[#00E5FF]">
                      [Linked Alert: {wo.triggerAlertId}]
                    </span>
                  )}
                </p>
              </div>

              {/* Footer Metadata: Team, Lead Engineer, Window, Duration */}
              <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                <div className="flex items-center gap-2">
                  <span className="text-[#64748B]">CREW:</span>
                  <span className="text-[#F1F5F9]">{wo.assignedTeam}</span>
                  <span className="text-[#64748B]">({wo.leadEngineer})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>{wo.scheduledWindow}</span>
                  <span className="text-[#64748B]">•</span>
                  <span className="text-[#00E5FF]">EST {wo.estimatedDuration}</span>
                </div>
              </div>
            </article>
          );
        })
        )}
      </div>
    </PanelContainer>
  );
}
