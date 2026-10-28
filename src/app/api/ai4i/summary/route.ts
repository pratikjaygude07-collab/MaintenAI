import { loadAi4iSummary } from "@/services/telemetryAdapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await loadAi4iSummary("live_backend");

  if (response.status !== "ready" || !response.data) {
    return Response.json(
      {
        success: false,
        error: response.errorCode ?? "ERR-AI4I-SUMMARY-FAILED",
        message: response.errorMessage ?? "Unable to load AI4I summary.",
      },
      { status: response.status === "unavailable" ? 503 : 500 }
    );
  }

  return Response.json({
    success: true,
    data: response.data,
    sourceTag: response.sourceTag,
    isFixturePreview: response.isFixturePreview,
  });
}
