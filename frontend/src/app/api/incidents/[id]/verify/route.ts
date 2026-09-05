import { NextResponse } from "next/server";
import { z } from "zod";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

const VerifyIncidentSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Enforce Role-Based Access Control: Operator or Admin only
    const user = await requireRole(request, ["operator", "admin"]);
    const incidentId = params.id;

    // 2. Parse & Validate Payload
    const rawBody = await request.json().catch(() => ({}));
    const validation = VerifyIncidentSchema.safeParse(rawBody);

    if (!validation.success) {
      return handleApiError(new ValidationError("Invalid verification payload", validation.error.format()));
    }

    const { decision, notes } = validation.data;

    // 3. Execute Verification Workflow Transaction
    const result = await civicRepository.verifyIncident(incidentId, decision, notes, user.id);

    return NextResponse.json({
      success: true,
      data: {
        incident: result.incident,
        team: result.team
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}