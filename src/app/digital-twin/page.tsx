import { loadDigitalTwinPreviewProfiles } from "@/services/telemetryAdapter";
import { DigitalTwinWorkspace } from "@/components/digital-twin/DigitalTwinWorkspace";
import { DataErrorState } from "@/components/ui/IndustrialPrimitives";

export default function DigitalTwinPage() {
  const response = loadDigitalTwinPreviewProfiles("fixture_preview");

  if (!response.data || response.status !== "ready") {
    return (
      <DataErrorState
        errorCode={response.errorCode ?? "ERR-TWIN-UNAVAILABLE"}
        title="Digital Twin Telemetry Service Unavailable"
        description={
          response.errorMessage ??
          "Unable to load Digital Twin machine profiles."
        }
      />
    );
  }

  return <DigitalTwinWorkspace profiles={response.data} />;
}
