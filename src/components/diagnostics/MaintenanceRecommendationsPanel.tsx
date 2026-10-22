"use client";

import { useState } from "react";
import type {
  MaintenanceRecommendation,
  RecommendationActionStatus,
} from "@/types/telemetry";
import {
  DataEmptyState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";

interface MaintenanceRecommendationsPanelProps {
  recommendations: MaintenanceRecommendation[];
  machineId: string;
}

const ACTION_STATUS_META: Record<
  RecommendationActionStatus,
  {
    label: string;
    tone: "nominal" | "warning" | "critical" | "cyan" | "neutral";
  }
> = {
  pending_review: { label: "PENDING REVIEW", tone: "warning" },
  approved_local: { label: "APPROVED (LOCAL UI)", tone: "cyan" },
  scheduled: { label: "SCHEDULED", tone: "cyan" },
  completed: { label: "COMPLETED", tone: "nominal" },
};

export function MaintenanceRecommendationsPanel({
  recommendations,
  machineId,
}: MaintenanceRecommendationsPanelProps) {
  // Local-only UI overrides for recommendation status
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, RecommendationActionStatus>
  >({});
  const [inspectedRecId, setInspectedRecId] = useState<string | null>(
    recommendations[0]?.id ?? null
  );

  const handleStatusChange = (
    recId: string,
    newStatus: RecommendationActionStatus
  ) => {
    setLocalStatusOverrides((prev) => ({
      ...prev,
      [recId]: newStatus,
    }));
  };

  return (
    <PanelContainer
      codeTag="DGN-REC-03"
      title="Maintenance & Inspection Recommendations"
      subtitle="Suggested maintenance actions from fixture records (status changes are local to the UI preview)"
      headerAction={
        <StatusBadge
          tone="cyan"
          label={`${recommendations.length} ACTIONS`}
        />
      }
    >
      {recommendations.length === 0 ? (
        <DataEmptyState
          title="No Maintenance Recommendations"
          description={`No pending maintenance actions are listed in the fixture dataset for ${machineId}.`}
        />
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const currentStatus =
              localStatusOverrides[rec.id] ?? rec.suggestedStatus;
            const statusMeta = ACTION_STATUS_META[currentStatus];
            const isInspected = inspectedRecId === rec.id;
            const isLocallyModified = Boolean(localStatusOverrides[rec.id]);

            return (
              <article
                key={rec.id}
                className="rounded-md bg-[#070B12] border border-[#1E293B] p-4 hover:border-[#26354D] transition-colors duration-200 ease-out"
              >
                {/* Top Row: ID, Priority, Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#131C2E] border border-[#1E293B] px-2 py-0.5 font-mono text-xs font-semibold text-[#00E5FF]">
                      {rec.id}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        rec.priority.startsWith("P1")
                          ? "text-[#EF4444]"
                          : rec.priority.startsWith("P2")
                          ? "text-[#F59E0B]"
                          : "text-[#94A3B8]"
                      }`}
                    >
                      {rec.priority}
                    </span>
                    {rec.workOrderRef && (
                      <span className="font-mono text-[11px] text-[#94A3B8]">
                        [{rec.workOrderRef}]
                      </span>
                    )}
                  </div>

                  <StatusBadge
                    tone={statusMeta.tone}
                    label={statusMeta.label}
                    ariaLabel={`Recommendation status: ${statusMeta.label}`}
                  />
                </div>

                {/* Action Title & Associated Component */}
                <div className="mt-2">
                  <h3 className="font-display text-sm font-semibold text-[#F1F5F9]">
                    {rec.actionTitle}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Component:{" "}
                    <span className="text-[#F1F5F9]">
                      {rec.associatedComponent}
                    </span>
                  </p>
                </div>

                {/* Completion Status & Inspect Toggle */}
                <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-[11px] text-[#94A3B8]">
                    <span className="text-[#64748B]">STATUS NOTE: </span>
                    <span className="text-[#F1F5F9]">
                      {isLocallyModified
                        ? `Updated in local UI preview (${statusMeta.label})`
                        : rec.completionStatus}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setInspectedRecId(isInspected ? null : rec.id)
                    }
                    aria-expanded={isInspected}
                    className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#00E5FF] hover:border-[#00E5FF] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
                  >
                    {isInspected ? "CLOSE DETAILS ▲" : "INSPECT & UPDATE ▼"}
                  </button>
                </div>

                {/* Expandable Inspection & Local Status Controls */}
                {isInspected && (
                  <div className="mt-3 rounded bg-[#0D131F] border border-[#1E293B] p-3.5 space-y-3 transition-all duration-200 ease-out">
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#00E5FF] mb-1">
                        SUPPORTING EVIDENCE & REASONING (FIXTURE)
                      </span>
                      <p className="text-xs text-[#F1F5F9] leading-relaxed">
                        {rec.supportingReason}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#94A3B8] pt-2 border-t border-[#1E293B]">
                      <span>ESTIMATED WINDOW: {rec.estimatedWindow}</span>
                      {rec.linkedFindingId && (
                        <span className="text-[#00E5FF]">
                          LINKED FINDING: {rec.linkedFindingId}
                        </span>
                      )}
                    </div>

                    {/* Local UI Status Selector */}
                    <div className="pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                        LOCAL PREVIEW STATUS OVERRIDE:
                      </span>
                      <div
                        role="group"
                        aria-label={`Set local preview status for ${rec.id}`}
                        className="flex flex-wrap items-center gap-1.5"
                      >
                        {(
                          [
                            { key: "pending_review", label: "Pending" },
                            { key: "approved_local", label: "Approve" },
                            { key: "scheduled", label: "Schedule" },
                            { key: "completed", label: "Complete" },
                          ] as const
                        ).map((opt) => {
                          const active = currentStatus === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleStatusChange(rec.id, opt.key)}
                              aria-pressed={active}
                              className={`rounded px-2 py-1 font-mono text-[10px] uppercase border transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                                active
                                  ? "bg-[#00E5FF] text-[#070B12] border-[#00E5FF] font-semibold"
                                  : "bg-[#070B12] text-[#94A3B8] border-[#1E293B] hover:text-[#F1F5F9]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PanelContainer>
  );
}
