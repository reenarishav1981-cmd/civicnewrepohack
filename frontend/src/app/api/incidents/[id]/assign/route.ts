import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { AssignTeamSchema } from "@/lib/validation/schemas";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/errors/AppError";
import { requireRole } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Enforce Role-Based Access Control: Operator or Admin only
    await requireRole(request, ["operator", "admin"]);

    const incidentId = params.id;
    const rawBody = await request.json();

    // 1. Zod schema validation
    const validation = AssignTeamSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed on assignment payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { teamId, instructions, workerId } = validation.data;

    // 2. Execute Atomic Domain Workflow Transaction
    const result = await civicRepository.assignTeamToIncident(incidentId, teamId, instructions, workerId);

    // 3. Return exact existing contract
    return NextResponse.json({
      success: true,
      data: {
        incident: result.incident,
        task: result.task,
        team: result.team
      }
    });
  } catch (error: any) {
    if (error.message === "Incident not found" || error.message === "Team not found" || error.message.includes("not found")) {
      return handleApiError(new NotFoundError(error.message));
    }
    if (error.message && (
      error.message.includes("already dispatched") || 
      error.message.includes("cannot be assigned") || 
      error.message.includes("is currently") ||
      error.message.includes("not available") ||
      error.message.includes("busy")
    )) {
      return handleApiError(new ConflictError(error.message));
    }
    return handleApiError(error);
  }
}
