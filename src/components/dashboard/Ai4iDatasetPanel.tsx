"use client";

import type { Ai4iDatasetSummary } from "@/types/telemetry";
import { DataErrorState } from "@/components/ui/IndustrialPrimitives";

interface Ai4iDatasetPanelProps {
  summary: Ai4iDatasetSummary | null;
  status: "ready" | "empty" | "error" | "unavailable";
  errorCode?: string;
  errorMessage?: string;
}

export function Ai4iDatasetPanel({
  summary,
  status,
  errorCode,
  errorMessage,
}: Ai4iDatasetPanelProps) {
  if (status !== "ready" || !summary) {
    return (
      <DataErrorState
        errorCode={errorCode ?? "ERR-AI4I-UNAVAILABLE"}
        title="AI4I Dataset Summary Unavailable"
        description={
          errorMessage ??
          "AI4I 2020 predictive maintenance dataset is not connected. Import the dataset and switch to live_backend mode to view imported records."
        }
      />
    );
  }

  const failureRateDisplay = summary.failureRate.toFixed(1);

  return (
    <section
      className="rounded-md bg-[#0D131F] border border-[#1E293B] p-5"
      aria-label="AI4I 2020 Synthetic Dataset Summary"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm text-[#00E5FF]">
          AI4I 2020 — SYNTHETIC DATASET
        </h2>
        <span className="rounded bg-[#131C2E] px-2 py-0.5 font-mono text-[10px] text-[#94A3B8] border border-[#1E293B]">
          CC BY 4.0 • Synthetic
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50">
          <div className="text-[#94A3B8] font-mono text-[10px] mb-1">
            TOTAL RECORDS
          </div>
          <div className="font-mono text-lg text-[#F1F5F9]">
            {summary.totalRecords.toLocaleString()}
          </div>
        </div>
        <div className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50">
          <div className="text-[#94A3B8] font-mono text-[10px] mb-1">
            MACHINE FAILURES
          </div>
          <div className="font-mono text-lg text-[#F1F5F9]">
            {summary.failureCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50">
          <div className="text-[#94A3B8] font-mono text-[10px] mb-1">
            FAILURE RATE
          </div>
          <div className="font-mono text-lg text-[#F1F5F9]">
            {failureRateDisplay}%
          </div>
        </div>
        <div className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50">
          <div className="text-[#94A3B8] font-mono text-[10px] mb-1">
            DATA ORIGIN
          </div>
          <div className="font-mono text-[10px] text-[#00E5FF]">
            operational_telemetry
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-mono text-[10px] text-[#94A3B8] mb-2">
          FAILURE MODE DISTRIBUTION
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(summary.failureByMode).map(([mode, count]) => (
            <div
              key={mode}
              className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50"
            >
              <div className="font-mono text-[10px] text-[#94A3B8] mb-1">
                {mode.toUpperCase()}
              </div>
              <div className="font-mono text-lg text-[#F1F5F9]">{count}</div>
            </div>
          ))}
          {Object.keys(summary.failureByMode).length === 0 && (
            <div className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50">
              <div className="font-mono text-[10px] text-[#94A3B8]">
                No failure modes recorded
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-mono text-[10px] text-[#94A3B8] mb-2">
          RECORDS BY MACHINE TYPE
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(summary.recordsByType).map(([type, count]) => (
            <div
              key={type}
              className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50"
            >
              <div className="font-mono text-[10px] text-[#94A3B8] mb-1">
                TYPE {type}
              </div>
              <div className="font-mono text-lg text-[#F1F5F9]">{count}</div>
            </div>
          ))}
          {Object.keys(summary.recordsByType).length === 0 && (
            <div className="rounded bg-[#131C2E] p-3 border border-[#1E293B]/50">
              <div className="font-mono text-[10px] text-[#94A3B8]">
                No type breakdown available
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-[10px] text-[#94A3B8] font-mono">
        AI4I 2020 is a synthetic predictive maintenance dataset from the UCI
        Machine Learning Repository (CC BY 4.0). Fields: air/process temperature
        (K), rotational speed (rpm), torque (Nm), tool wear (min), machine
        failure label, and failure-mode indicators (TWF, HDF, PWF, OSF, RNF).
        Does not contain vibration or acoustic measurements.
      </p>
    </section>
  );
}
