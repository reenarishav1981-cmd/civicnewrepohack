import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";
import { recordAIFeedback } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  incidentId: z.string().optional().nullable(),
  reportId: z.string().optional().nullable(),
  decisionType: z.enum(["correlation", "priority", "category", "risk", "hotspot"]),
  aiSuggestedValue: z.string().min(1, "AI suggested value is required"),
  operatorDecision: z.string().min(1, "Operator decision is required"),
  wasAccepted: z.boolean(),
  overrideReason: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  correlationScore: z.number().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    // 1. RBAC Guard: Operator or Admin only
    const user = await requireRole(request, ["operator", "admin"]);

    // 2. Validate request body
    const body = await request.json();
    const parseResult = feedbackSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues?.[0];
      return handleApiError(new ValidationError(firstIssue?.message || "Invalid feedback payload"));
    }

    const data = parseResult.data;

    // 3. Persist feedback
    const recorded = await recordAIFeedback({
      incidentId: data.incidentId || undefined,
      reportId: data.reportId || undefined,
      operatorId: user.id,
      decisionType: data.decisionType,
      aiSuggestedValue: data.aiSuggestedValue,
      operatorDecision: data.operatorDecision,
      wasAccepted: data.wasAccepted,
      overrideReason: data.overrideReason || undefined,
      category: data.category || undefined,
      correlationScore: data.correlationScore ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: recorded,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
