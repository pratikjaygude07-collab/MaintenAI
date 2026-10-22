import { loadDiagnosticsPreviewProfiles } from "@/services/telemetryAdapter";
import { DiagnosticsWorkspace } from "@/components/diagnostics/DiagnosticsWorkspace";
import { DataErrorState } from "@/components/ui/IndustrialPrimitives";

export default function DiagnosticsPage() {
  const response = loadDiagnosticsPreviewProfiles("fixture_preview");

  if (!response.data || response.status !== "ready") {
    return (
      <DataErrorState
        errorCode={response.errorCode ?? "ERR-DIAG-UNAVAILABLE"}
        title="Diagnostics Telemetry Service Unavailable"
        description={
          response.errorMessage ??
          "Unable to load machine diagnostic profiles."
        }
      />
    );
  }

  return <DiagnosticsWorkspace profiles={response.data} />;
}
