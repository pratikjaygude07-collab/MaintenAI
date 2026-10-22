import { loadFleetPreviewBundle } from "@/services/telemetryAdapter";
import { FleetInventoryView } from "@/components/fleet/FleetInventoryView";
import { DataErrorState } from "@/components/ui/IndustrialPrimitives";

export default function FleetPage() {
  const response = loadFleetPreviewBundle("fixture_preview");

  if (!response.data || response.status !== "ready") {
    return (
      <DataErrorState
        errorCode={response.errorCode ?? "ERR-FLEET-UNAVAILABLE"}
        title="Fleet Inventory Service Unavailable"
        description={
          response.errorMessage ??
          "Unable to load industrial machine inventory."
        }
      />
    );
  }

  return (
    <FleetInventoryView
      initialMachines={response.data.machines}
      summary={response.data.summary}
    />
  );
}
