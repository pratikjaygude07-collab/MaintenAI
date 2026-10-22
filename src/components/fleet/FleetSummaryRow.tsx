import type {
  FleetInventorySummary,
  FleetOperatingStatus,
} from "@/types/telemetry";
import { StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface FleetSummaryRowProps {
  summary: FleetInventorySummary;
  activeStatusFilter: "all" | FleetOperatingStatus;
  onlyNeedsAttention: boolean;
  onSelectQuickFilter: (filter: {
    status: "all" | FleetOperatingStatus;
    attention: boolean;
  }) => void;
}

export function FleetSummaryRow({
  summary,
  activeStatusFilter,
  onlyNeedsAttention,
  onSelectQuickFilter,
}: FleetSummaryRowProps) {
  const cards = [
    {
      id: "total-assets",
      code: "FLT-SUM-01",
      label: "Total Monitored Assets",
      value: summary.totalAssets,
      unit: "MACHINES",
      meta: "2 Plants • 4 Sectors Indexed",
      badgeLabel: "FIXTURE REGISTRY",
      tone: "cyan" as const,
      accentBar: "bg-[#00E5FF]",
      isActive: activeStatusFilter === "all" && !onlyNeedsAttention,
      onClick: () =>
        onSelectQuickFilter({ status: "all", attention: false }),
    },
    {
      id: "operational-assets",
      code: "FLT-SUM-02",
      label: "Operational Assets",
      value: summary.operationalAssets,
      unit: "NOMINAL",
      meta: `${Math.round(
        (summary.operationalAssets / Math.max(1, summary.totalAssets)) * 100
      )}% within baseline envelope`,
      badgeLabel: "OPERATIONAL",
      tone: "nominal" as const,
      accentBar: "bg-[#10B981]",
      isActive:
        activeStatusFilter === "operational" && !onlyNeedsAttention,
      onClick: () =>
        onSelectQuickFilter({ status: "operational", attention: false }),
    },
    {
      id: "attention-assets",
      code: "FLT-SUM-03",
      label: "Assets Needing Attention",
      value: summary.attentionAssets,
      unit: "FLAGGED",
      meta: "Degrading health, active service, or watch",
      badgeLabel: "NEEDS ATTENTION",
      tone: "warning" as const,
      accentBar: "bg-[#F59E0B]",
      isActive: onlyNeedsAttention,
      onClick: () =>
        onSelectQuickFilter({
          status: "all",
          attention: !onlyNeedsAttention,
        }),
    },
    {
      id: "critical-assets",
      code: "FLT-SUM-04",
      label: "Critical Assets",
      value: summary.criticalAssets,
      unit: "CRITICAL",
      meta: "Immediate fault threshold excursion",
      badgeLabel: "CRITICAL FAULT",
      tone: "critical" as const,
      accentBar: "bg-[#EF4444]",
      isActive: activeStatusFilter === "critical" && !onlyNeedsAttention,
      onClick: () =>
        onSelectQuickFilter({ status: "critical", attention: false }),
    },
  ];

  return (
    <section aria-label="Fleet Asset Summary Overview" className="space-y-2.5">
      {/* Explicit Frontend Fixture Data Indicator Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-[#0D131F] border border-[#1E293B] px-3.5 py-2">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8]">
          <span
            className="h-2 w-2 rounded-full bg-[#00E5FF]"
            aria-hidden="true"
          />
          <span className="font-semibold text-[#F1F5F9]">
            PREVIEW DATA MODE:
          </span>
          <span>{summary.fixtureSourceTag}</span>
        </div>
        <span className="font-mono text-[11px] text-[#64748B]">
          CLICK ANY SUMMARY CARD TO QUICK-FILTER INVENTORY
        </span>
      </div>

      {/* 4-Card Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            aria-pressed={card.isActive}
            className={`group relative text-left rounded-md bg-[#0D131F] border p-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.75)] ${
              card.isActive
                ? "border-[#00E5FF] bg-[#131C2E]/75"
                : "border-[#1E293B] border-t-[#26354D] hover:border-[#00E5FF]/50"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r ${card.accentBar}`}
            />

            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                  {card.code}
                </span>
                <h2 className="mt-0.5 text-xs font-medium text-[#94A3B8]">
                  {card.label}
                </h2>
              </div>
              <StatusBadge
                tone={card.tone}
                label={card.badgeLabel}
                pulse={card.tone === "critical"}
                ariaLabel={`${card.label} status indicator: ${card.badgeLabel}`}
              />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tracking-tight text-[#F1F5F9] tabular-nums">
                {card.value}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
                {card.unit}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center justify-between gap-2 font-mono text-[11px]">
              <span className="text-[#94A3B8] truncate">{card.meta}</span>
              <span className="text-[#00E5FF] shrink-0">
                {card.isActive ? "[ACTIVE]" : "FILTER →"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
