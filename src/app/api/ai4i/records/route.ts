import { loadAi4iRecords } from "@/services/telemetryAdapter";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request
) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");
  const type = searchParams.get("type");
  const machineFailure = searchParams.get("machineFailure");

  const parsedPage = page ? Number(page) : undefined;
  const parsedPageSize = pageSize ? Number(pageSize) : undefined;
  const parsedType = type === "L" || type === "M" || type === "H" ? type : undefined;
  const parsedMachineFailure =
    machineFailure === "true" ? true : machineFailure === "false" ? false : undefined;

  if (parsedPage !== undefined && (!Number.isFinite(parsedPage) || parsedPage < 1)) {
    return Response.json(
      { success: false, error: "ERR-AI4I-INVALID-PAGE" },
      { status: 400 }
    );
  }

  if (parsedPageSize !== undefined && (!Number.isFinite(parsedPageSize) || parsedPageSize < 1)) {
    return Response.json(
      { success: false, error: "ERR-AI4I-INVALID-PAGE-SIZE" },
      { status: 400 }
    );
  }

  const response = await loadAi4iRecords("live_backend", {
    page: parsedPage,
    pageSize: parsedPageSize,
    type: parsedType,
    machineFailure: parsedMachineFailure,
  });

  if (response.status !== "ready" || !response.data) {
    return Response.json(
      {
        success: false,
        error: response.errorCode ?? "ERR-AI4I-RECORDS-FAILED",
        message: response.errorMessage ?? "Unable to load AI4I records.",
      },
      { status: response.status === "unavailable" ? 503 : 500 }
    );
  }

  return Response.json({
    success: true,
    data: response.data.records,
    pagination: {
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    },
    sourceTag: response.sourceTag,
    isFixturePreview: response.isFixturePreview,
  });
}
