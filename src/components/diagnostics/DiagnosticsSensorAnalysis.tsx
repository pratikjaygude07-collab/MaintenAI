"use client";

import { useState } from "react";
import type {
  DigitalTwinSensorPoint,
  MachineDiagnosticProfile,
  SensorCondition,
  TimeRangeKey,
} from "@/types/telemetry";
import { PanelContainer, StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface DiagnosticsSensorAnalysisProps {
  profile: MachineDiagnosticProfile;
}

const TIME_RANGES: TimeRangeKey[] = ["1H", "6H", "24H", "7D"];

function SensorChannelCard({
  condition,
  points,
}: {
  condition: SensorCondition;
  points: DigitalTwinSensorPoint[];
}) {
  const width = 390;
  const height = 148;
  const padLeft = 38;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const extractor = (pt: DigitalTwinSensorPoint): number => {
    switch (condition.metricKey) {
      case "vibration":
        return pt.vibrationRms;
      case "temperature":
        return pt.temperatureC;
      case "rpm":
        return pt.rpm;
      case "acoustic":
        return pt.acousticDb;
    }
  };

  const domain = (() => {
    switch (condition.metricKey) {
      case "vibration":
        return { min: 0, max: 9.5, stroke: "#00E5FF" };
      case "temperature":
        return { min: 50, max: 95, stroke: "#F59E0B" };
      case "rpm": {
        const ref = condition.nominalReference ?? condition.currentReading;
        return { min: ref - 250, max: ref + 250, stroke: "#10B981" };
      }
      case "acoustic":
        return { min: 60, max: 96, stroke: "#38BDF8" };
    }
  })();

  const getX = (idx: number) => {
    if (points.length <= 1) return padLeft;
    return padLeft + (idx / (points.length - 1)) * plotW;
  };

  const toY = (val: number) => {
    const clamped = Math.max(domain.min, Math.min(domain.max, val));
    return (
      padTop +
      plotH -
      ((clamped - domain.min) / Math.max(1, domain.max - domain.min)) * plotH
    );
  };

  const linePath = points
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${toY(extractor(pt)).toFixed(
          1
        )}`
    )
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${getX(points.length - 1).toFixed(1)} ${(
          padTop + plotH
        ).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : "";

  const midDomain = (domain.min + domain.max) / 2;

  return (
    <article
      className={`rounded-md bg-[#070B12] border p-4 transition-colors duration-200 ease-out ${
        condition.status === "critical"
          ? "border-[#EF4444]/45"
          : condition.status === "warning"
          ? "border-[#F59E0B]/40"
          : "border-[#1E293B]"
      }`}
    >
      {/* Header: Channel Code, Metric Title & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
            [{condition.channelCode}]
          </span>
          <h3 className="mt-0.5 font-display text-sm font-semibold text-[#F1F5F9]">
            {condition.label}
          </h3>
        </div>
        <StatusBadge
          tone={condition.status}
          pulse={condition.status === "critical"}
          label={
            condition.status === "nominal"
              ? "NORMAL"
              : condition.status.toUpperCase()
          }
          ariaLabel={`${condition.label} status: ${condition.status}`}
        />
      </div>

      {/* Current Reading + Threshold Reference */}
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1E293B] pb-2.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-mono text-2xl font-bold tabular-nums ${
              condition.status === "critical"
                ? "text-[#EF4444]"
                : condition.status === "warning"
                ? "text-[#F59E0B]"
                : "text-[#F1F5F9]"
            }`}
          >
            {condition.metricKey === "rpm"
              ? condition.currentReading.toLocaleString()
              : condition.currentReading.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-[#94A3B8]">
            {condition.unit}
          </span>
        </div>

        <div className="text-right font-mono text-[11px] text-[#94A3B8] tabular-nums">
          {condition.warningThreshold !== undefined &&
          condition.criticalThreshold !== undefined ? (
            <span>
              Warn: {condition.warningThreshold} • Crit:{" "}
              {condition.criticalThreshold} {condition.unit}
            </span>
          ) : (
            <span>Normal Band: {condition.normalRangeText}</span>
          )}
        </div>
      </div>

      {/* Threshold Exceeded Visual Callout */}
      {condition.thresholdExceeded && condition.exceededSummary ? (
        <div
          role="status"
          className={`mt-2.5 rounded px-2.5 py-1.5 font-mono text-[11px] flex items-center justify-between gap-2 border ${
            condition.status === "critical"
              ? "bg-[#EF4444]/10 border-[#EF4444]/35 text-[#EF4444]"
              : "bg-[#F59E0B]/10 border-[#F59E0B]/35 text-[#F59E0B]"
          }`}
        >
          <span>▲ THRESHOLD EXCEEDED</span>
          <span className="text-[#F1F5F9] tabular-nums">
            {condition.exceededSummary}
          </span>
        </div>
      ) : (
        <div className="mt-2.5 rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1.5 font-mono text-[11px] text-[#10B981] flex items-center justify-between">
          <span>✓ WITHIN NORMAL BAND</span>
          <span className="text-[#94A3B8] tabular-nums">
            {condition.normalRangeText}
          </span>
        </div>
      )}

      {/* Historical Trend Chart */}
      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 select-none"
          role="img"
          aria-label={`Historical trend chart for ${condition.label} in ${condition.unit}`}
        >
          <desc>
            {`Historical fixture trend chart for ${condition.label} (${condition.channelCode}). Current reading: ${condition.currentReading} ${condition.unit}. Status: ${condition.status}. Normal range: ${condition.normalRangeText}.`}
          </desc>
          <defs>
            <linearGradient
              id={`diag-fill-${condition.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={domain.stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={domain.stroke} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[domain.min, midDomain, domain.max].map((val, i) => {
            const y = toY(val);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#64748B] font-mono text-[9px]"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Warning Threshold Line */}
          {condition.warningThreshold !== undefined && (
            <line
              x1={padLeft}
              y1={toY(condition.warningThreshold)}
              x2={width - padRight}
              y2={toY(condition.warningThreshold)}
              stroke="#F59E0B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Critical Threshold Line */}
          {condition.criticalThreshold !== undefined && (
            <line
              x1={padLeft}
              y1={toY(condition.criticalThreshold)}
              x2={width - padRight}
              y2={toY(condition.criticalThreshold)}
              stroke="#EF4444"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          )}

          {/* Nominal Reference Line */}
          {condition.nominalReference !== undefined && (
            <line
              x1={padLeft}
              y1={toY(condition.nominalReference)}
              x2={width - padRight}
              y2={toY(condition.nominalReference)}
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          <path d={areaPath} fill={`url(#diag-fill-${condition.id})`} />
          <path
            d={linePath}
            fill="none"
            stroke={domain.stroke}
            strokeWidth="2.2"
          />

          {points.map((pt, idx) => {
            const x = getX(idx);
            const val = extractor(pt);
            const y = toY(val);
            const isCrit =
              condition.criticalThreshold !== undefined &&
              val >= condition.criticalThreshold;

            return (
              <g key={pt.timestamp}>
                <circle
                  cx={x}
                  cy={y}
                  r={isCrit ? 4 : 3}
                  className={isCrit ? "fill-[#EF4444]" : "fill-[#070B12]"}
                  stroke={isCrit ? "#F1F5F9" : domain.stroke}
                  strokeWidth="1.8"
                />
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-[#94A3B8] font-mono text-[9px]"
                >
                  {pt.timestamp}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
}

export function DiagnosticsSensorAnalysis({
  profile,
}: DiagnosticsSensorAnalysisProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("6H");
  const points = profile.sensorTrendsByRange[timeRange] ?? [];

  return (
    <PanelContainer
      codeTag="DGN-SEN-01"
      title="Sensor Channel Condition & Threshold Analysis"
      subtitle="Dedicated Vibration, Temperature, RPM, and Acoustic channels with fixture threshold references"
      headerAction={
        <div
          role="group"
          aria-label="Select sensor analysis time window"
          className="inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
        >
          {TIME_RANGES.map((range) => {
            const active = timeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                aria-pressed={active}
                className={`rounded px-2.5 py-1 font-mono text-xs transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                  active
                    ? "bg-[#00E5FF] text-[#070B12] font-semibold"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.sensorConditions.map((cond) => (
          <SensorChannelCard
            key={cond.id}
            condition={cond}
            points={points}
          />
        ))}
      </div>
    </PanelContainer>
  );
}
