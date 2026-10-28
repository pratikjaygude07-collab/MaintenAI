import { notFound } from "next/navigation";
import Link from "next/link";
import type { MaintenanceWorkOrder } from "@/types/telemetry";
import { StatusBadge } from "@/components/ui/IndustrialPrimitives";

export const dynamic = "force-dynamic";

const WORK_ORDER_STATUSES: Record<
  MaintenanceWorkOrder["status"],
  { label: string; tone: "cyan" | "warning" | "nominal" }
> = {
  scheduled: { label: "QUEUED", tone: "warning" },
  in_progress: { label: "IN PROGRESS", tone: "cyan" },
  completed: { label: "COMPLETED", tone: "nominal" },
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function fetchWorkOrder(
  workOrderId: string
): Promise<MaintenanceWorkOrder | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/maintenance/work-orders/${encodeURIComponent(workOrderId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

interface WorkOrderDetailPageProps {
  params: Promise<{ workOrderId: string }>;
}

export default async function WorkOrderDetailPage({
  params,
}: WorkOrderDetailPageProps) {
  const { workOrderId } = await params;
  const decodedId = decodeURIComponent(workOrderId);

  const workOrder = await fetchWorkOrder(decodedId);

  if (!workOrder) {
    notFound();
  }

  const meta = WORK_ORDER_STATUSES[workOrder.status];
  const isQueued = workOrder.status === "scheduled";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-3 rounded bg-[#0D131F] border border-[#1E293B] px-4 py-2.5">
        <Link
          href="/dashboard"
          className="text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF] font-mono text-xs"
        >
          ← BACK TO DASHBOARD
        </Link>
        <span className="text-[#64748B]">/</span>
        <span className="text-[#F1F5F9] font-semibold">{workOrder.id}</span>
        {isQueued && (
          <StatusBadge
            tone={meta.tone}
            label={meta.label}
            ariaLabel={`Work order status: ${workOrder.status}`}
          />
        )}
      </div>

      <section className="rounded-md bg-[#0D131F] border border-[#1E293B] border-t-[#26354D] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.75)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] px-5 py-3.5">
          <div className="min-w-0">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#00E5FF]">
              [WORK ORDER]
            </span>
            <h2 className="font-display text-sm md:text-base font-semibold tracking-tight text-[#F1F5F9]">
              {workOrder.id}
            </h2>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              Work-order detail view — asset-independent dispatch record
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              tone={meta.tone}
              pulse={workOrder.status === "in_progress"}
              label={meta.label}
              ariaLabel={`Work order ${workOrder.id} status: ${workOrder.status}`}
            />
            <Link
              href={`/fleet/${encodeURIComponent(workOrder.assetId)}`}
              className="rounded bg-[#131C2E] border border-[#00E5FF]/40 px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors duration-200 ease-out"
            >
              VIEW ASSET →
            </Link>
          </div>
        </header>

        <div className="p-5 space-y-4">
          {/* Work Order Type & Status (queued/scheduled distinction) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
                WORK ORDER TYPE
              </span>
              <div className="mt-2 font-mono text-sm text-[#F1F5F9]">
                {workOrder.maintenanceType}
              </div>
            </div>
            <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
                DISPATCH STATE
              </span>
              <div className="mt-2 font-mono text-sm">
                <span className={`font-semibold ${isQueued ? "text-[#FBBF24]" : "text-[#34D399]"}`}>
                  {isQueued ? "QUEUED — awaits start action" : workOrder.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Task & Asset */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
              TASK & TARGET UNIT
            </span>
            <h3 className="mt-1 font-medium text-[#F1F5F9]">
              {workOrder.taskTitle}
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Target Unit:{" "}
              <Link
                href={`/fleet/${encodeURIComponent(workOrder.assetId)}`}
                className="text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
              >
                {workOrder.assetId}
              </Link>{" "}
              ({workOrder.assetName})
              {workOrder.triggerAlertId && (
                <span className="ml-2 font-mono text-[11px] text-[#00E5FF]">
                  [Linked Alert: {workOrder.triggerAlertId}]
                </span>
              )}
            </p>
          </div>

          {/* Priority & metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                PRIORITY
              </span>
              <div className="mt-2 font-mono text-sm">
                <span
                  className={`font-semibold ${
                    workOrder.priority.startsWith("P1")
                      ? "text-[#EF4444]"
                      : workOrder.priority.startsWith("P2")
                      ? "text-[#F59E0B]"
                      : "text-[#94A3B8]"
                  }`}
                >
                  {workOrder.priority}
                </span>
              </div>
            </div>
            <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                SCHEDULED WINDOW
              </span>
              <div className="mt-2 font-mono text-sm text-[#F1F5F9]">
                {workOrder.scheduledWindow}
              </div>
            </div>
            <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                EST. DURATION
              </span>
              <div className="mt-2 font-mono text-sm text-[#F1F5F9]">
                {workOrder.estimatedDuration}
              </div>
            </div>
          </div>

          {/* Crew */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
              CREW
            </span>
            <div className="mt-1 font-mono text-sm text-[#F1F5F9]">
              {workOrder.assignedTeam} ({workOrder.leadEngineer})
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center">
        <Link
          href="/dashboard"
          className="rounded bg-[#131C2E] border border-[#00E5FF]/50 px-4 py-2 font-mono text-xs text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors"
        >
          ← RETURN TO DISPATCH
        </Link>
      </div>
    </div>
  );
}
