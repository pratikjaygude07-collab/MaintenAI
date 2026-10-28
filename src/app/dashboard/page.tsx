import { loadDashboardPreviewBundle } from "@/services/telemetryAdapter";
import { loadAi4iSummary } from "@/services/telemetryAdapter";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { DataErrorState } from "@/components/ui/IndustrialPrimitives";
import type { Ai4iDatasetSummary } from "@/types/telemetry";

export default async function DashboardPage() {
  const bundleResponse = loadDashboardPreviewBundle("fixture_preview");

  if (!bundleResponse.data || bundleResponse.status !== "ready") {
    return (
      <DataErrorState
        errorCode={bundleResponse.errorCode ?? "ERR-DASH-UNAVAILABLE"}
        title="Dashboard Telemetry Service Unavailable"
        description={
          bundleResponse.errorMessage ??
          "Unable to load plant overview telemetry bundle."
        }
      />
    );
  }

  const { metrics, streams, buckets, subsystems, alerts, workOrders } =
    bundleResponse.data;

  let ai4iSummary: Ai4iDatasetSummary | null = null;
  let ai4iStatus: "ready" | "empty" | "error" | "unavailable" = "unavailable";
  let ai4iErrorCode: string | undefined;
  let ai4iErrorMessage: string | undefined;

  try {
    const ai4iResponse = await loadAi4iSummary("live_backend");
    if (ai4iResponse.status === "ready" && ai4iResponse.data) {
      ai4iSummary = ai4iResponse.data;
      ai4iStatus = "ready";
    } else {
      ai4iStatus = ai4iResponse.status;
      ai4iErrorCode = ai4iResponse.errorCode;
      ai4iErrorMessage = ai4iResponse.errorMessage;
    }
  } catch {
    ai4iStatus = "error";
    ai4iErrorCode = "ERR-AI4I-UNEXPECTED";
    ai4iErrorMessage = "Unexpected error loading AI4I dataset summary.";
  }

  return (
    <DashboardWorkspace
      metrics={metrics}
      streams={streams}
      buckets={buckets}
      subsystems={subsystems}
      alerts={alerts}
      workOrders={workOrders}
      ai4iSummary={ai4iSummary}
      ai4iStatus={ai4iStatus}
      ai4iErrorCode={ai4iErrorCode}
      ai4iErrorMessage={ai4iErrorMessage}
    />
  );
}
