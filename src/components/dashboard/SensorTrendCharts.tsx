"use client";

import { useState } from "react";
import Link from "next/link";
import type { MonitoredAssetStream, TimeRangeKey } from "@/types/telemetry";
import { PanelContainer, StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface SensorTrendChartsProps {
  streams: MonitoredAssetStream[];
}

const TIME_RANGES: TimeRangeKey[] = ["1H", "6H", "24H", "7D"];

export function SensorTrendCharts({ streams }: SensorTrendChartsProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    streams[0]?.assetId ?? "TURB-GEN-04"
  );
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("6H");
  const [showVibration, setShowVibration] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showAcoustic, setShowAcoustic] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeAsset =
    streams.find((item) => item.assetId === selectedAssetId) ?? streams[0];
  const points = activeAsset.seriesByRange[timeRange] ?? [];

  // Default inspected point to latest actual reading
  const defaultPointIndex = Math.max(
    0,
    points.findIndex((p) => p.isForecast) - 1
  );
  const inspectedIndex =
    activeIndex !== null && points[activeIndex]
      ? activeIndex
      : defaultPointIndex >= 0
      ? defaultPointIndex
      : points.length - 1;
  const inspectedPoint = points[inspectedIndex] ?? points[0];

  // SVG coordinate geometry
  const width = 760;
  const height = 270;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (points.length <= 1) return padLeft;
    return padLeft + (idx / (points.length - 1)) * plotW;
  };

  // Normalize Vibration RMS (0 - 10 mm/s) to Y
  const vibToY = (val: number) => {
    const min = 0;
    const max = 10;
    const clamped = Math.max(min, Math.min(max, val));
    return padTop + plotH - ((clamped - min) / (max - min)) * plotH;
  };

  // Normalize Temperature / Acoustic (55 - 100 °C / dB) to Y
  const thermalToY = (val: number) => {
    const min = 55;
    const max = 100;
    const clamped = Math.max(min, Math.min(max, val));
    return padTop + plotH - ((clamped - min) / (max - min)) * plotH;
  };

  const buildPath = (
    extractor: (p: (typeof points)[number]) => number,
    yMapper: (v: number) => number
  ) =>
    points
      .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx).toFixed(1)} ${yMapper(extractor(pt)).toFixed(1)}`)
      .join(" ");

  const buildAreaPath = (
    extractor: (p: (typeof points)[number]) => number,
    yMapper: (v: number) => number
  ) => {
    if (points.length === 0) return "";
    const line = buildPath(extractor, yMapper);
    const firstX = getX(0).toFixed(1);
    const lastX = getX(points.length - 1).toFixed(1);
    const baseY = (padTop + plotH).toFixed(1);
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const firstForecastIdx = points.findIndex((p) => p.isForecast);
  const forecastStartX =
    firstForecastIdx > 0 ? getX(firstForecastIdx - 1) : null;

  const critVibY = vibToY(activeAsset.thresholds.vibrationCritical);
  const warnVibY = vibToY(activeAsset.thresholds.vibrationWarning);

  return (
    <PanelContainer
      codeTag="TEL-01"
      title="Multi-Sensor Harmonic & Thermal Telemetry"
      subtitle="Synchronized triaxial vibration RMS, bearing temperature, and acoustic emission with AI trajectory forecast"
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Selector */}
          <label htmlFor="telemetry-asset-select" className="sr-only">
            Select Monitored Asset
          </label>
          <select
            id="telemetry-asset-select"
            value={selectedAssetId}
            onChange={(e) => {
              setSelectedAssetId(e.target.value);
              setActiveIndex(null);
            }}
            className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9] hover:border-[#00E5FF]/60 focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            {streams.map((stream) => (
              <option key={stream.assetId} value={stream.assetId} className="bg-[#0D131F]">
                {stream.assetId} — {stream.assetName}
              </option>
            ))}
          </select>

          {/* Time Window Selector */}
          <div
            role="group"
            aria-label="Telemetry time window"
            className="inline-flex rounded bg-[#070B12] p-0.5 border border-[#1E293B]"
          >
            {TIME_RANGES.map((range) => {
              const active = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => {
                    setTimeRange(range);
                    setActiveIndex(null);
                  }}
                  aria-pressed={active}
                  className={`rounded px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
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
        </div>
      }
    >
      {/* Asset Telemetry Context Strip */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded bg-[#070B12] border border-[#1E293B] p-3">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
            ACTIVE STREAM
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#F1F5F9]">
              {activeAsset.assetId}
            </span>
            <StatusBadge
              tone={activeAsset.status}
              label={`${activeAsset.healthScore}% HLTH`}
            />
          </div>
        </div>
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
            ZONE // SUBSYSTEM
          </span>
          <span className="mt-0.5 block font-mono text-xs text-[#94A3B8] truncate">
            {activeAsset.locationZone}
          </span>
        </div>
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
            SHAFT SPEED // RUL
          </span>
          <span className="mt-0.5 block font-mono text-xs text-[#F1F5F9] tabular-nums">
            {activeAsset.rpmNominal.toLocaleString()} RPM •{" "}
            <span className="text-[#00E5FF]">{activeAsset.rulHours}h RUL</span>
          </span>
        </div>
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
            INSPECTED SAMPLE ({inspectedPoint?.timestamp})
          </span>
          <span className="mt-0.5 block font-mono text-xs text-[#F1F5F9] tabular-nums">
            {inspectedPoint?.vibrationRms.toFixed(1)} mm/s •{" "}
            {inspectedPoint?.bearingTempC.toFixed(1)} °C •{" "}
            <span
              className={
                (inspectedPoint?.anomalyProbability ?? 0) >= 75
                  ? "text-[#EF4444]"
                  : (inspectedPoint?.anomalyProbability ?? 0) >= 45
                  ? "text-[#F59E0B]"
                  : "text-[#10B981]"
              }
            >
              {inspectedPoint?.anomalyProbability}% RISK
            </span>
          </span>
        </div>
      </div>

      {/* Series Toggle Legend Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVibration((v) => !v)}
            aria-pressed={showVibration}
            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
              showVibration
                ? "bg-[#131C2E] border-[#00E5FF]/50 text-[#F1F5F9]"
                : "bg-[#070B12] border-[#1E293B] text-[#64748B]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#00E5FF]" />
            <span>Vibration RMS (mm/s)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTemp((v) => !v)}
            aria-pressed={showTemp}
            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
              showTemp
                ? "bg-[#131C2E] border-[#F59E0B]/50 text-[#F1F5F9]"
                : "bg-[#070B12] border-[#1E293B] text-[#64748B]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            <span>Bearing Temp (°C)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAcoustic((v) => !v)}
            aria-pressed={showAcoustic}
            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
              showAcoustic
                ? "bg-[#131C2E] border-[#38BDF8]/50 text-[#F1F5F9]"
                : "bg-[#070B12] border-[#1E293B] text-[#64748B]"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
            <span>Acoustic Emission (dB)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-[#EF4444]" />
            <span>Crit Limit ({activeAsset.thresholds.vibrationCritical} mm/s)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-xs" />
            <span>*Fixture Projection</span>
          </span>
          <Link
            href={`/digital-twin?machine=${encodeURIComponent(
              activeAsset.assetId
            )}`}
            className="text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            3D TWIN →
          </Link>
        </div>
      </div>

      {/* SVG Telemetry Plot */}
      <div className="relative w-full overflow-hidden rounded bg-[#070B12] border border-[#1E293B] p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 select-none"
          role="img"
          aria-label={`Sensor telemetry chart for ${activeAsset.assetName} over ${timeRange}`}
        >
          <desc>
            {`Multi-sensor fixture trend for ${activeAsset.assetName} (${activeAsset.assetId}) over ${timeRange}. Latest inspected sample at ${inspectedPoint?.timestamp}: Vibration ${inspectedPoint?.vibrationRms.toFixed(1)} mm/s (Critical threshold ${activeAsset.thresholds.vibrationCritical} mm/s), Bearing Temperature ${inspectedPoint?.bearingTempC.toFixed(1)} °C, Acoustic ${inspectedPoint?.acousticDb.toFixed(1)} dB.`}
          </desc>
          <defs>
            <linearGradient id="cyanAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Left Axis (Vibration mm/s) */}
          {[0, 2.5, 5.0, 7.5, 10.0].map((val) => {
            const y = vibToY(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#64748B] font-mono text-[10px]"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* AI Forecast Projection Shaded Zone */}
          {forecastStartX !== null && (
            <g>
              <rect
                x={forecastStartX}
                y={padTop}
                width={width - padRight - forecastStartX}
                height={plotH}
                fill="#00E5FF"
                fillOpacity="0.05"
              />
              <line
                x1={forecastStartX}
                y1={padTop}
                x2={forecastStartX}
                y2={padTop + plotH}
                stroke="#00E5FF"
                strokeDasharray="3 3"
                strokeOpacity="0.5"
              />
              <text
                x={forecastStartX + 6}
                y={padTop + 12}
                className="fill-[#00E5FF] font-mono text-[9px] uppercase tracking-wider"
              >
                AI FORECAST ZONE
              </text>
            </g>
          )}

          {/* Threshold Reference Lines */}
          <line
            x1={padLeft}
            y1={critVibY}
            x2={width - padRight}
            y2={critVibY}
            stroke="#EF4444"
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <line
            x1={padLeft}
            y1={warnVibY}
            x2={width - padRight}
            y2={warnVibY}
            stroke="#F59E0B"
            strokeWidth="1"
            strokeDasharray="3 4"
            strokeOpacity="0.65"
          />

          {/* Acoustic Emission Line */}
          {showAcoustic && (
            <path
              d={buildPath((p) => p.acousticDb, thermalToY)}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.75"
              strokeDasharray="4 2"
            />
          )}

          {/* Bearing Temp Line */}
          {showTemp && (
            <path
              d={buildPath((p) => p.bearingTempC, thermalToY)}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
            />
          )}

          {/* Vibration RMS Area + Line */}
          {showVibration && (
            <>
              <path
                d={buildAreaPath((p) => p.vibrationRms, vibToY)}
                fill="url(#cyanAreaFill)"
              />
              <path
                d={buildPath((p) => p.vibrationRms, vibToY)}
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2.4"
              />
            </>
          )}

          {/* Vertical Cursor for Inspected Sample */}
          {points[inspectedIndex] && (
            <line
              x1={getX(inspectedIndex)}
              y1={padTop}
              x2={getX(inspectedIndex)}
              y2={padTop + plotH}
              stroke="#F1F5F9"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          )}

          {/* Interactive Data Point Nodes & X-Axis Labels */}
          {points.map((pt, idx) => {
            const x = getX(idx);
            const isSelected = idx === inspectedIndex;
            return (
              <g key={pt.timestamp}>
                {/* X-Axis Timestamp */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`font-mono text-[10px] ${
                    pt.isForecast
                      ? "fill-[#00E5FF]"
                      : isSelected
                      ? "fill-[#F1F5F9] font-semibold"
                      : "fill-[#64748B]"
                  }`}
                >
                  {pt.timestamp}
                </text>

                {/* Plotted Dots */}
                {showAcoustic && (
                  <circle
                    cx={x}
                    cy={thermalToY(pt.acousticDb)}
                    r={isSelected ? 4.5 : 3}
                    className="fill-[#070B12] stroke-[#38BDF8]"
                    strokeWidth="1.75"
                  />
                )}
                {showTemp && (
                  <circle
                    cx={x}
                    cy={thermalToY(pt.bearingTempC)}
                    r={isSelected ? 4.5 : 3}
                    className="fill-[#070B12] stroke-[#F59E0B]"
                    strokeWidth="1.75"
                  />
                )}
                {showVibration && (
                  <circle
                    cx={x}
                    cy={vibToY(pt.vibrationRms)}
                    r={isSelected ? 5 : 3.5}
                    className={
                      pt.vibrationRms >= activeAsset.thresholds.vibrationCritical
                        ? "fill-[#EF4444] stroke-[#F1F5F9]"
                        : "fill-[#070B12] stroke-[#00E5FF]"
                    }
                    strokeWidth="2"
                  />
                )}

                {/* Invisible Interactive Hit Column */}
                <rect
                  x={x - plotW / (points.length * 2)}
                  y={padTop}
                  width={plotW / points.length}
                  height={plotH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Keyboard-Accessible Sample Selector Strip */}
      <div className="mt-3 flex items-center justify-between gap-2 overflow-x-auto py-1">
        <span className="font-mono text-[11px] text-[#64748B] shrink-0">
          SAMPLE CURSOR:
        </span>
        <div className="flex items-center gap-1.5">
          {points.map((pt, idx) => {
            const active = idx === inspectedIndex;
            return (
              <button
                key={pt.timestamp}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`rounded px-2 py-0.5 font-mono text-[11px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                  active
                    ? "bg-[#131C2E] text-[#00E5FF] border border-[#00E5FF]/50"
                    : "bg-[#070B12] text-[#94A3B8] border border-[#1E293B] hover:text-[#F1F5F9]"
                }`}
              >
                {pt.timestamp}
              </button>
            );
          })}
        </div>
      </div>
    </PanelContainer>
  );
}
