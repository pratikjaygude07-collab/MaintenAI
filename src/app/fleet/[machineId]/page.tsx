import Link from "next/link";
import { FLEET_MACHINE_INVENTORY } from "@/data/fixtures";
import { loadFleetMachineDetailPreview } from "@/services/telemetryAdapter";
import {
  DataEmptyState,
  PanelContainer,
  StatusBadge,
} from "@/components/ui/IndustrialPrimitives";

interface FleetMachineDetailPageProps {
  params: Promise<{ machineId: string }>;
}

export function generateStaticParams() {
  return FLEET_MACHINE_INVENTORY.map((m) => ({
    machineId: m.machineId,
  }));
}

export default async function FleetMachineDetailPage({
  params,
}: FleetMachineDetailPageProps) {
  const { machineId } = await params;
  const decodedId = decodeURIComponent(machineId);
  const response = loadFleetMachineDetailPreview(decodedId, "fixture_preview");
  const machine = response.data;

  if (!machine) {
    return (
      <div className="space-y-4">
        <DataEmptyState
          title={`Machine Record "${decodedId}" Not Found`}
          description="The requested industrial asset ID does not exist in the local Fleet fixture dataset."
        />
        <div className="flex justify-center">
          <Link
            href="/fleet"
            className="rounded bg-[#131C2E] border border-[#00E5FF]/50 px-4 py-2 font-mono text-xs text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors"
          >
            ← RETURN TO /FLEET INVENTORY
          </Link>
        </div>
      </div>
    );
  }

  const opTone =
    machine.operatingStatus === "operational"
      ? "nominal"
      : machine.operatingStatus === "warning"
      ? "warning"
      : machine.operatingStatus === "critical"
      ? "critical"
      : "cyan";

  const maintTone =
    machine.maintenanceStatus === "up_to_date"
      ? "nominal"
      : machine.maintenanceStatus === "scheduled"
      ? "warning"
      : machine.maintenanceStatus === "overdue"
      ? "critical"
      : "cyan";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb + Preview Data Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded bg-[#0D131F] border border-[#1E293B] px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link
            href="/fleet"
            className="text-[#00E5FF] hover:underline focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            ← BACK TO FLEET INVENTORY
          </Link>
          <span className="text-[#64748B]">/</span>
          <span className="text-[#F1F5F9] font-semibold">
            {machine.machineId}
          </span>
        </div>

        <StatusBadge
          tone="cyan"
          label="PREVIEW DATA // FIXTURE RECORD"
          ariaLabel="Preview Data Mode: Local Fixture Record"
        />
      </div>

      {/* Primary Asset Telemetry Header Panel */}
      <PanelContainer
        codeTag={machine.machineId}
        title={machine.machineName}
        subtitle={`${machine.machineType} • ${machine.plant} (${machine.locationZone})`}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={opTone}
              pulse={machine.operatingStatus === "critical"}
              label={machine.operatingStatus.toUpperCase()}
              ariaLabel={`Operating Status: ${machine.operatingStatus}`}
            />
            <StatusBadge
              tone={maintTone}
              label={machine.maintenanceLabel}
              ariaLabel={`Maintenance Status: ${machine.maintenanceLabel}`}
            />
            <Link
              href={`/digital-twin?machine=${encodeURIComponent(
                machine.machineId
              )}`}
              className="rounded bg-[#131C2E] border border-[#00E5FF]/40 px-2.5 py-1 font-mono text-[11px] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors duration-200 ease-out"
            >
              3D TWIN →
            </Link>
            <Link
              href={`/diagnostics?machine=${encodeURIComponent(
                machine.machineId
              )}`}
              className="rounded bg-[#131C2E] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF] hover:text-[#F1F5F9] transition-colors duration-200 ease-out"
            >
              DIAGNOSTICS →
            </Link>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Health Score */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
              COMPOSITE HEALTH SCORE
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold text-[#F1F5F9] tabular-nums">
                {machine.healthScore.toFixed(1)}%
              </span>
              <span className="font-mono text-xs text-[#00E5FF] tabular-nums">
                FIXTURE RUL: {machine.rulHours} hrs
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#131C2E] overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  machine.healthScore < 70
                    ? "bg-[#EF4444]"
                    : machine.healthScore < 88
                    ? "bg-[#F59E0B]"
                    : "bg-[#10B981]"
                }`}
                style={{ width: `${machine.healthScore}%` }}
              />
            </div>
          </div>

          {/* Bearing Temperature */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
              TEMPERATURE READING
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  machine.temperatureC >= machine.tempThresholdCritical
                    ? "text-[#EF4444]"
                    : machine.temperatureC >= machine.tempThresholdWarning
                    ? "text-[#F59E0B]"
                    : "text-[#F1F5F9]"
                }`}
              >
                {machine.temperatureC.toFixed(1)} °C
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#94A3B8] tabular-nums">
              Warn: {machine.tempThresholdWarning}°C • Crit:{" "}
              {machine.tempThresholdCritical}°C
            </p>
          </div>

          {/* Vibration RMS */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
              VIBRATION VELOCITY (RMS)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  machine.vibrationRms >= machine.vibThresholdCritical
                    ? "text-[#EF4444]"
                    : machine.vibrationRms >= machine.vibThresholdWarning
                    ? "text-[#F59E0B]"
                    : "text-[#F1F5F9]"
                }`}
              >
                {machine.vibrationRms.toFixed(1)} mm/s
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#94A3B8] tabular-nums">
              ISO Warn: {machine.vibThresholdWarning} • Crit:{" "}
              {machine.vibThresholdCritical} mm/s
            </p>
          </div>

          {/* Rotational Speed (RPM) */}
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
              SHAFT SPEED (RPM)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-[#F1F5F9] tabular-nums">
                {machine.rpm.toLocaleString()}
              </span>
              <span className="font-mono text-xs text-[#64748B] tabular-nums">
                / {machine.rpmNominal.toLocaleString()} RPM
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#94A3B8] tabular-nums">
              Sync: {machine.lastUpdateRelative} ({machine.lastUpdateUtc})
            </p>
          </div>
        </div>

        {/* Hardware & Maintenance Metadata Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
              ASSET TOPOLOGY & EDGE TELEMETRY
            </span>
            <dl className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
              <div>
                <dt className="text-[#64748B]">PLANT / SECTOR</dt>
                <dd className="text-[#F1F5F9] mt-0.5">
                  {machine.plant} • {machine.locationZone}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">GATEWAY NODE</dt>
                <dd className="text-[#F1F5F9] mt-0.5">
                  {machine.gatewayNode} ({machine.sensorChannels} CH)
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded bg-[#070B12] border border-[#1E293B] p-4 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#00E5FF]">
              MAINTENANCE & FAULT DISPATCH
            </span>
            <div className="font-mono text-xs space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">MAINTENANCE WINDOW:</span>
                <span className="text-[#F1F5F9]">
                  {machine.nextMaintenanceWindow}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748B]">FIXTURE OBSERVATION:</span>
                <span className="text-[#F1F5F9] text-right">
                  {machine.activeFaultSignature ?? "None — Baseline Harmonics"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PanelContainer>
    </div>
  );
}
