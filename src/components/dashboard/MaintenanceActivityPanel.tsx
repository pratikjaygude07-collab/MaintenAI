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

const WORK_ORDER_TRANSITIONS_ENABLED =
  process.env.NEXT_PUBLIC_WORK_ORDER_TRANSITIONS_ENABLED === "true";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function hasWorkOrderTransitionPermission(): boolean {
  if (typeof window === "undefined") return false;
  const perms = (window as typeof window & { __mainai_permissions__?: string[] }).__mainai_permissions__;
  return perms !== undefined && perms.includes("work_order:transition");
}

async function transitionWorkOrderStatus(
  workOrderId: string,
  toStatus: MaintenanceStatus
): Promise<{ ok: boolean; error?: string }> {
  const url = `${API_BASE_URL}/api/maintenance/work-orders/${encodeURIComponent(workOrderId)}`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "network error" };
  }
}

export function MaintenanceActivityPanel({
  workOrders,
}: MaintenanceActivityPanelProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | MaintenanceStatus>(
    "all"
  );
  const [transitioning, setTransitioning] = useState<Record<string, boolean>>(
    {}
  );
  const [transitionError, setTransitionError] = useState<Record<string, string>>(
    {}
  );

  const canTransition = WORK_ORDER_TRANSITIONS_ENABLED && hasWorkOrderTransitionPermission();

  const filteredOrders = workOrders.filter((wo) =>
    statusFilter === "all" ? true : wo.status === statusFilter
  );

  const handleTransition = async (
    wo: MaintenanceWorkOrder,
    toStatus: MaintenanceStatus
  ) => {
    setTransitioning((prev) => ({ ...prev, [wo.id]: true }));
    setTransitionError((prev) => {
      const next = { ...prev };
      delete next[wo.id];
      return next;
    });

    const result = await transitionWorkOrderStatus(wo.id, toStatus);

    setTransitioning((prev) => {
      const next = { ...prev };
      delete next[wo.id];
      return next;
    });

    if (!result.ok) {
      setTransitionError((prev) => ({ ...prev, [wo.id]: result.error ?? "failed" }));
    }
  };

  const actionButton = (wo: MaintenanceWorkOrder) => {
    if (!canTransition) return null;

    if (wo.status === "scheduled") {
      return (
        <button
          type="button"
          disabled={transitioning[wo.id]}
          onClick={() => handleTransition(wo, "in_progress")}
          className={`rounded bg-[#131C2E] border border-[#00E5FF]/50 px-3 py-1.5 font-mono text-xs font-medium text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]`}
          aria-label={`Start work order ${wo.id}`}
        >
          {transitioning[wo.id] ? "STARTING..." : "START WORK ORDER"}
        </button>
      );
    }

    if (wo.status === "in_progress") {
      return (
        <button
          type="button"
          disabled={transitioning[wo.id]}
          onClick={() => handleTransition(wo, "completed")}
          className={`rounded bg-[#131C2E] border border-[#10B981]/50 px-3 py-1.5 font-mono text-xs font-medium text-[#34D399] hover:bg-[#10B981] hover:text-[#070B12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[#10B981]`}
          aria-label={`Complete work order ${wo.id}`}
        >
          {transitioning[wo.id] ? "FINISHING..." : "COMPLETE / MARK FINISHED"}
        </button>
      );
    }

    return null;
  };

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
            const btn = actionButton(wo);
            const err = transitionError[wo.id];

            return (
              <article
                key={wo.id}
                className="rounded-md bg-[#070B12] border border-[#1E293B] p-3.5 hover:border-[#26354D] transition-colors duration-200 ease-out"
              >
                  {/* Top Row: Work Order ID, Asset ID, Priority & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {wo.status === "scheduled" ? (
                        <Link
                          href={`/work-orders/${encodeURIComponent(wo.id)}`}
                          className="rounded bg-[#131C2E] border border-[#00E5FF]/50 px-2 py-0.5 font-mono text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                        >
                          {wo.id}
                        </Link>
                      ) : (
                        <span className="rounded bg-[#131C2E] border border-[#1E293B] px-2 py-0.5 font-mono text-xs font-semibold text-[#00E5FF]">
                          {wo.id}
                        </span>
                      )}
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
                    {btn && (
                      <span className="ml-2">{btn}</span>
                    )}
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

                {err && (
                  <div className="mt-2 p-2 rounded bg-[#EF4444]/10 border border-[#EF4444]/30">
                    <p className="font-mono text-[10px] text-[#F87171]">
                      Transition failed: {err}
                    </p>
                  </div>
                )}

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
