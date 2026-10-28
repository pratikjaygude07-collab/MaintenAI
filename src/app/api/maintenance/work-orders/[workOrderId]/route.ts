import { maintenanceWorkOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  scheduled: ["in_progress"],
  in_progress: ["completed"],
};

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  const { workOrderId } = await params;

  // Dynamic import defers @/db evaluation to runtime so the route module
  // can be collected at build time without DATABASE_URL being set.
  const { db } = await import("@/db");

  const existing = await db
    .select()
    .from(maintenanceWorkOrders)
    .where(eq(maintenanceWorkOrders.workOrderId, workOrderId))
    .limit(1);

  if (existing.length === 0) {
    return Response.json(
      { success: false, error: "ERR-WO-NOT-FOUND" },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: existing[0] });
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  const { workOrderId } = await params;

  let body: { status?: string };
  try {
    body = await _req.json();
  } catch {
    return Response.json(
      { success: false, error: "ERR-WO-INVALID-BODY" },
      { status: 400 }
    );
  }

  const { status } = body;
  if (!status || typeof status !== "string") {
    return Response.json(
      { success: false, error: "ERR-WO-MISSING-STATUS" },
      { status: 400 }
    );
  }

  const { db } = await import("@/db");

  const existing = await db
    .select()
    .from(maintenanceWorkOrders)
    .where(eq(maintenanceWorkOrders.workOrderId, workOrderId))
    .limit(1);

  if (existing.length === 0) {
    return Response.json(
      { success: false, error: "ERR-WO-NOT-FOUND" },
      { status: 404 }
    );
  }

  const currentStatus = existing[0].status;
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowedNext || !allowedNext.includes(status)) {
    return Response.json(
      {
        success: false,
        error: "ERR-WO-INVALID-TRANSITION",
        message: `Cannot transition from "${currentStatus}" to "${status}".`,
      },
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(maintenanceWorkOrders)
    .set({
      status: status as typeof maintenanceWorkOrders.$inferSelect.status,
      updatedAt: new Date(),
    })
    .where(eq(maintenanceWorkOrders.workOrderId, workOrderId))
    .returning();

  return Response.json({ success: true, data: updated });
}
