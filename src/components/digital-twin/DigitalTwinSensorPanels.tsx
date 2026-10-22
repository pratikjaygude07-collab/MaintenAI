"use client";

import { useState } from "react";
import type {
  DigitalTwinMachineProfile,
  DigitalTwinSensorPoint,
  TimeRangeKey,
} from "@/types/telemetry";
import { PanelContainer, StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface DigitalTwinSensorPanelsProps {
  machine: DigitalTwinMachineProfile;
  selectedSubAssemblyId: string | null;
  onSelectSubAssembly: (id: string | null) => void;
}

const TIME_RANGES: TimeRangeKey[] = ["1H", "6H", "24H", "7D"];

interface SingleMetricChartProps {
  title: string;
  code: string;
  unit: string;
  latestValue: string;
  strokeColor: string;
  fillId: string;
  points: DigitalTwinSensorPoint[];
  extractor: (p: DigitalTwinSensorPoint) => number;
  minDomain: number;
  maxDomain: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  nominalReference?: number;
  thresholdCaption: string;
}

function SingleMetricTrendCard({
  title,
  code,
  unit,
  latestValue,
  strokeColor,
  fillId,
  points,
  extractor,
  minDomain,
  maxDomain,
  warningThreshold,
  criticalThreshold,
  nominalReference,
  thresholdCaption,
}: SingleMetricChartProps) {
  const width = 420;
  const height = 165;
  const padLeft = 38;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (points.length <= 1) return padLeft;
    return padLeft + (idx / (points.length - 1)) * plotW;
  };

  const toY = (val: number) => {
    const clamped = Math.max(minDomain, Math.min(maxDomain, val));
    return (
      padTop +
      plotH -
      ((clamped - minDomain) / Math.max(1, maxDomain - minDomain)) * plotH
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

  const midValue = (minDomain + maxDomain) / 2;

  return (
    <article className="rounded-md bg-[#070B12] border border-[#1E293B] p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
            [{code}]
          </span>
          <h3 className="font-display text-sm font-semibold text-[#F1F5F9]">
            {title}
          </h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-[#F1F5F9] tabular-nums">
            {latestValue}{" "}
            <span className="text-xs font-normal text-[#94A3B8]">{unit}</span>
          </div>
          <div className="font-mono text-[10px] text-[#64748B]">
            {thresholdCaption}
          </div>
        </div>
      </div>

      {/* SVG Trend Plot */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 select-none"
          role="img"
          aria-label={`${title} trend chart in ${unit}`}
        >
          <desc>
            {`${title} trend chart showing ${points.length} fixture samples. Latest reading: ${latestValue} ${unit} (${thresholdCaption}).`}
          </desc>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[minDomain, midValue, maxDomain].map((val, i) => {
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

          {/* Warning Threshold Reference */}
          {warningThreshold !== undefined && (
            <line
              x1={padLeft}
              y1={toY(warningThreshold)}
              x2={width - padRight}
              y2={toY(warningThreshold)}
              stroke="#F59E0B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Critical Threshold Reference */}
          {criticalThreshold !== undefined && (
            <line
              x1={padLeft}
              y1={toY(criticalThreshold)}
              x2={width - padRight}
              y2={toY(criticalThreshold)}
              stroke="#EF4444"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          )}

          {/* Nominal Reference Line (for RPM) */}
          {nominalReference !== undefined && (
            <line
              x1={padLeft}
              y1={toY(nominalReference)}
              x2={width - padRight}
              y2={toY(nominalReference)}
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.75"
            />
          )}

          {/* Area & Line */}
          <path d={areaPath} fill={`url(#${fillId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
          />

          {/* Data Points & Time Labels */}
          {points.map((pt, idx) => {
            const x = getX(idx);
            const y = toY(extractor(pt));
            return (
              <g key={pt.timestamp}>
                <circle
                  cx={x}
                  cy={y}
                  r="3.2"
                  className="fill-[#070B12]"
                  stroke={strokeColor}
                  strokeWidth="2"
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

export function DigitalTwinSensorPanels({
  machine,
  selectedSubAssemblyId,
  onSelectSubAssembly,
}: DigitalTwinSensorPanelsProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("6H");
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const series = machine.sensorTrendsByRange[timeRange] ?? [];

  return (
    <PanelContainer
      codeTag="TWN-SEN-02"
      title="Machine Sensor Telemetry Trends"
      subtitle="Synchronized Temperature, Vibration RMS, and Rotational Speed (RPM) channels from fixture dataset"
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div
            role="group"
            aria-label="Sensor chart time window"
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

          {/* Expand / Collapse Detailed Sub-Assembly & Acoustic Table */}
          <button
            type="button"
            onClick={() => setDetailsExpanded((prev) => !prev)}
            aria-expanded={detailsExpanded}
            className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:border-[#00E5FF] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            {detailsExpanded ? "COLLAPSE SUB-ASSEMBLIES ▲" : "EXPAND SUB-ASSEMBLIES ▼"}
          </button>
        </div>
      }
    >
      {/* 3 Primary Sensor Trend Charts: Temperature, Vibration, RPM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Temperature Trend */}
        <SingleMetricTrendCard
          code="SEN-TEMP"
          title="Temperature Trend"
          unit="°C"
          latestValue={machine.temperatureC.toFixed(1)}
          strokeColor="#F59E0B"
          fillId="dtTempFill"
          points={series}
          extractor={(p) => p.temperatureC}
          minDomain={50}
          maxDomain={95}
          warningThreshold={machine.tempWarningC}
          criticalThreshold={machine.tempCriticalC}
          thresholdCaption={`Warn: ${machine.tempWarningC}°C • Crit: ${machine.tempCriticalC}°C`}
        />

        {/* 2. Vibration Trend */}
        <SingleMetricTrendCard
          code="SEN-VIB"
          title="Vibration Velocity Trend"
          unit="mm/s RMS"
          latestValue={machine.vibrationRms.toFixed(1)}
          strokeColor="#00E5FF"
          fillId="dtVibFill"
          points={series}
          extractor={(p) => p.vibrationRms}
          minDomain={0}
          maxDomain={9.5}
          warningThreshold={machine.vibWarningRms}
          criticalThreshold={machine.vibCriticalRms}
          thresholdCaption={`ISO Warn: ${machine.vibWarningRms} • Crit: ${machine.vibCriticalRms} mm/s`}
        />

        {/* 3. RPM Trend */}
        <SingleMetricTrendCard
          code="SEN-RPM"
          title="Rotational Speed (RPM) Trend"
          unit="RPM"
          latestValue={machine.rpm.toLocaleString()}
          strokeColor="#10B981"
          fillId="dtRpmFill"
          points={series}
          extractor={(p) => p.rpm}
          minDomain={machine.rpmMinBand}
          maxDomain={machine.rpmMaxBand}
          nominalReference={machine.rpmNominal}
          thresholdCaption={`Nominal Setpoint: ${machine.rpmNominal.toLocaleString()} RPM`}
        />
      </div>

      {/* Collapsible Sub-Assembly & Secondary Sensor Channel Table */}
      {detailsExpanded && (
        <div className="mt-5 pt-4 border-t border-[#1E293B] transition-all duration-300 ease-out">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#94A3B8]">
                SUB-ASSEMBLY STRUCTURAL ZONES & ACOUSTIC TELEMETRY
              </h3>
              <p className="text-xs text-[#64748B]">
                Click any sub-assembly row to highlight the corresponding zone in the 3D Digital Twin
              </p>
            </div>
            <div className="rounded bg-[#070B12] border border-[#1E293B] px-3 py-1 font-mono text-xs text-[#94A3B8] tabular-nums">
              ACOUSTIC FLOOR:{" "}
              <strong
                className={
                  machine.acousticDb >= machine.acousticWarningDb
                    ? "text-[#F59E0B]"
                    : "text-[#F1F5F9]"
                }
              >
                {machine.acousticDb.toFixed(1)} dB
              </strong>{" "}
              (Ref: {machine.acousticWarningDb.toFixed(1)} dB)
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-[#1E293B] bg-[#070B12]">
            <table
              className="w-full text-left border-collapse"
              aria-label="Machine Sub-Assembly Telemetry Table"
            >
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0D131F] font-mono text-[11px] uppercase text-[#64748B]">
                  <th scope="col" className="py-2.5 pl-3.5 pr-2">
                    Zone Code
                  </th>
                  <th scope="col" className="py-2.5 px-2">
                    Sub-Assembly Component
                  </th>
                  <th scope="col" className="py-2.5 px-2">
                    Condition
                  </th>
                  <th scope="col" className="py-2.5 px-2 text-right">
                    Temp (°C)
                  </th>
                  <th scope="col" className="py-2.5 px-2 text-right">
                    Vibration (mm/s)
                  </th>
                  <th scope="col" className="py-2.5 pl-2 pr-3.5">
                    Engineering Notes (Fixture)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] text-xs">
                {machine.subAssemblies.map((sub) => {
                  const isSelected = selectedSubAssemblyId === sub.id;
                  return (
                    <tr
                      key={sub.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() =>
                        onSelectSubAssembly(isSelected ? null : sub.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectSubAssembly(isSelected ? null : sub.id);
                        }
                      }}
                      className={`cursor-pointer transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#00E5FF] ${
                        isSelected
                          ? "bg-[#131C2E] border-l-2 border-l-[#00E5FF]"
                          : "hover:bg-[#131C2E]/60"
                      }`}
                    >
                      <td className="py-2.5 pl-3.5 pr-2 font-mono text-[#00E5FF] whitespace-nowrap">
                        {sub.code}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-[#F1F5F9]">
                          {sub.name}
                        </div>
                        <div className="font-mono text-[10px] text-[#64748B]">
                          {sub.materialSpec}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <StatusBadge
                          tone={sub.status}
                          label={sub.status.toUpperCase()}
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#F1F5F9]">
                        {sub.temperatureC.toFixed(1)} °C
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#F1F5F9]">
                        {sub.vibrationRms.toFixed(1)} mm/s
                      </td>
                      <td className="py-2.5 pl-2 pr-3.5 text-[#94A3B8]">
                        {sub.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PanelContainer>
  );
}
