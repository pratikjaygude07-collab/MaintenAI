import { loadDashboardPreviewBundle } from "@/services/telemetryAdapter";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { DataErrorState } from "@/components/ui/IndustrialPrimitives";

export default function DashboardPage() {
  const response = loadDashboardPreviewBundle("fixture_preview");

  if (!response.data || response.status !== "ready") {
    return (
      <DataErrorState
        errorCode={response.errorCode ?? "ERR-DASH-UNAVAILABLE"}
        title="Dashboard Telemetry Service Unavailable"
        description={
          response.errorMessage ??
          "Unable to load plant overview telemetry bundle."
        }
      />
    );
  }

  const { metrics, streams, buckets, subsystems, alerts, workOrders } =
    response.data;

  return (
    <DashboardWorkspace
      metrics={metrics}
      streams={streams}
      buckets={buckets}
      subsystems={subsystems}
      alerts={alerts}
      workOrders={workOrders}
    />
  );
}
