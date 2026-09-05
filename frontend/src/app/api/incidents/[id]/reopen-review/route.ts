import { NextResponse } from "next/server";
import { z } from "zod";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

const ReopenReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().max(500, "Review notes cannot exceed 500 characters").optional()
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
    const validation = ReopenReviewSchema.safeParse(rawBody);

    if (!validation.success) {
      return handleApiError(new ValidationError("Invalid reopen review payload", validation.error.format()));
    }

    const { decision, notes } = validation.data;

    // 3. Execute Reopening Review Workflow Transaction
    const result = await civicRepository.reviewReopenRequest(
      incidentId,
      decision,
      notes,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        incident: result.incident
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}