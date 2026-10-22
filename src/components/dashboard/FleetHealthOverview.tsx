import Link from "next/link";
import type {
  FleetHealthBucket,
  SubsystemHealthSummary,
} from "@/types/telemetry";
import { PanelContainer, StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface FleetHealthOverviewProps {
  buckets: FleetHealthBucket[];
  subsystems: SubsystemHealthSummary[];
}

export function FleetHealthOverview({
  buckets,
  subsystems,
}: FleetHealthOverviewProps) {
  const bucketBarColor: Record<FleetHealthBucket["id"], string> = {
    nominal: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    critical: "bg-[#EF4444]",
  };

  const bucketDotColor: Record<FleetHealthBucket["id"], string> = {
    nominal: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    critical: "bg-[#EF4444]",
  };

  return (
    <PanelContainer
      codeTag="FLT-02"
      title="Fleet Health Overview"
      subtitle="Condition distribution across 148 active industrial assets"
      headerAction={
        <Link
          href="/fleet"
          className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:border-[#00E5FF] transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
        >
          FLEET MATRIX →
        </Link>
      }
    >
      {/* Segmented Health Distribution Bar */}
      <div>
        <div className="flex items-center justify-between font-mono text-[11px] text-[#94A3B8] mb-2">
          <span>COMPOSITE CONDITION INDEX</span>
          <span className="text-[#F1F5F9] tabular-nums">148 TOTAL UNITS</span>
        </div>

        <div
          className="flex h-3 w-full overflow-hidden rounded bg-[#070B12] p-0.5 border border-[#1E293B] gap-1"
          role="img"
          aria-label="Fleet health distribution: 83.8% Optimal, 11.5% Watch, 4.7% Critical"
        >
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              style={{ width: `${bucket.percentage}%` }}
              className={`h-full first:rounded-l-xs last:rounded-r-xs ${bucketBarColor[bucket.id]}`}
              title={`${bucket.label}: ${bucket.assetCount} assets (${bucket.percentage}%)`}
            />
          ))}
        </div>

        {/* Bucket Breakdown Cards */}
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              className="rounded bg-[#070B12] border border-[#1E293B] p-2.5"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${bucketDotColor[bucket.id]}`}
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] truncate">
                  {bucket.id === "nominal"
                    ? "OPTIMAL"
                    : bucket.id === "warning"
                    ? "DEGRADING"
                    : "CRITICAL"}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-1">
                <span className="font-mono text-lg font-bold text-[#F1F5F9] tabular-nums">
                  {bucket.assetCount}
                </span>
                <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                  {bucket.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subsystem Health List */}
      <div className="mt-5 pt-4 border-t border-[#1E293B]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#64748B]">
            SUBSYSTEM COHORT HEALTH
          </span>
          <span className="font-mono text-[11px] text-[#64748B]">
            MEAN RUL / SCORE
          </span>
        </div>

        <div className="space-y-2.5">
          {subsystems.map((sub) => (
            <div
              key={sub.id}
              className="rounded bg-[#070B12] border border-[#1E293B] p-3 hover:border-[#26354D] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#F1F5F9] truncate">
                      {sub.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#64748B] tabular-nums">
                      [{sub.assetCount}]
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    {sub.primaryMetricLabel}:{" "}
                    <span className="text-[#F1F5F9]">{sub.primaryMetricValue}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums">
                      {sub.healthPercent}%
                    </span>
                    <StatusBadge
                      tone={sub.status}
                      label={`${sub.meanRulHours}h`}
                    />
                  </div>
                </div>
              </div>

              {/* Precision Health Progress Bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#131C2E] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    sub.status === "critical"
                      ? "bg-[#EF4444]"
                      : sub.status === "warning"
                      ? "bg-[#F59E0B]"
                      : "bg-[#10B981]"
                  }`}
                  style={{ width: `${sub.healthPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelContainer>
  );
}
