import { NextResponse } from "next/server";
import { z } from "zod";
import { civicRepository } from "@/lib/repositories";
import { requireAuthenticatedUser, normalizeRole } from "@/lib/auth";
import { handleApiError, ValidationError, ForbiddenError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

const FeedbackSchema = z.object({
  feedbackStatus: z.enum(["RESOLVED SUCCESSFULLY", "ISSUE STILL EXISTS"]),
  feedbackNotes: z.string().max(500, "Feedback notes cannot exceed 500 characters").optional()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const userRole = normalizeRole(user.role);

    // Only citizens can submit citizen resolution feedback
    if (userRole !== "citizen") {
      throw new ForbiddenError("Access denied: only authenticated citizens can submit citizen resolution feedback.");
    }

    const incidentId = params.id;
    const rawBody = await request.json().catch(() => ({}));
    const validation = FeedbackSchema.safeParse(rawBody);

    if (!validation.success) {
      return handleApiError(new ValidationError("Validation failed on feedback payload", validation.error.format()));
    }

    const { feedbackStatus, feedbackNotes } = validation.data;

    const result = await civicRepository.submitCitizenFeedback(
      incidentId,
      user.id,
      feedbackStatus,
      feedbackNotes
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