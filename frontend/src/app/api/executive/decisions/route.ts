import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";
import { executiveIntelligenceService } from "@/lib/executive";

export const dynamic = "force-dynamic";

const decisionInputSchema = z.object({
  recommendationId: z.string().min(1, "Recommendation ID is required"),
  actionType: z.enum([
    "DEPLOY_ADDITIONAL_TEAM",
    "PRIORITIZE_CRITICAL_CLUSTER",
    "ESCALATE_DEPARTMENT_REVIEW",
    "MONITOR_EMERGING_PATTERN",
    "REBALANCE_OPERATIONAL_LOAD",
  ]),
  decision: z.enum(["ACCEPTED", "DISMISSED", "DEFERRED"]),
  reason: z.string().optional(),
  targetArea: z.string().optional(),
  department: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. RBAC Guard: Operator or Admin only
    const user = await requireRole(request, ["operator", "admin"]);

    const body = await request.json().catch(() => ({}));
    const parseResult = decisionInputSchema.safeParse(body);

    if (!parseResult.success) {
      return handleApiError(new ValidationError(parseResult.error.issues[0]?.message || "Invalid input payload"));
    }

    const { recommendationId, actionType, decision, reason, targetArea, department, metadata } = parseResult.data;

    // 2. Dismiss Rule: Requires reason
    if (decision === "DISMISSED" && (!reason || reason.trim().length === 0)) {
      return handleApiError(new ValidationError("A clear operational rationale is required when dismissing an executive recommendation."));
    }

    // 3. Persist audit record in ExecutiveDecision table
    // CRITICAL SECURITY RULE: Recording a decision DOES NOT automatically execute operations.
    const record = await executiveIntelligenceService.recordDecision({
      recommendationId,
      actionType,
      decision,
      reason,
      actorId: user.id,
      actorName: user.name || "Municipal Executive",
      targetArea,
      department,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: `Executive recommendation ${recommendationId} successfully recorded as ${decision}.`,
      data: record,
      humanApproved: true,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);
    const history = await executiveIntelligenceService.getDecisionHistory(50);
    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
