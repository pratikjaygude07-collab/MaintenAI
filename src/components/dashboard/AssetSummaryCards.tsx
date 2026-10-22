import type { AssetSummaryMetric } from "@/types/telemetry";
import { StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface AssetSummaryCardsProps {
  metrics: AssetSummaryMetric[];
}

export function AssetSummaryCards({ metrics }: AssetSummaryCardsProps) {
  const statusAccentBar: Record<AssetSummaryMetric["status"], string> = {
    nominal: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    critical: "bg-[#EF4444]",
  };

  const deltaBadgeStyle: Record<AssetSummaryMetric["deltaTone"], string> = {
    nominal: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
    warning: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
    critical: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/35",
    info: "text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/30",
  };

  return (
    <section
      aria-label="Asset Summary Key Performance Indicators"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
    >
      {metrics.map((metric, idx) => (
        <article
          key={metric.id}
          className="group relative rounded-md bg-[#0D131F] border border-[#1E293B] border-t-[#26354D] p-5 transition-colors duration-150 hover:border-[#00E5FF]/50 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.75)]"
        >
          {/* Left vertical status indicator bar */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r ${statusAccentBar[metric.status]}`}
          />

          {/* Data Point 1: Metric Label + Primary Value */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#94A3B8]">
                0{idx + 1} {"//"} {metric.label}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight text-[#F1F5F9] tabular-nums">
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="font-mono text-xs uppercase tracking-wider text-[#64748B]">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>

            <StatusBadge
              tone={metric.status}
              label={
                metric.status === "nominal"
                  ? "NOMINAL"
                  : metric.status === "warning"
                  ? "WATCH"
                  : "ALERT"
              }
              pulse={metric.status === "critical"}
            />
          </div>

          {/* Data Point 2 & 3: Delta Badge + Target Threshold */}
          <div className="mt-4 pt-3.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium border tabular-nums ${deltaBadgeStyle[metric.deltaTone]}`}
            >
              {metric.deltaText}
            </span>

            <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
              {metric.thresholdText}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
