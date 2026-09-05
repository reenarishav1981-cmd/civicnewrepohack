import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { executiveIntelligenceService } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // RBAC: Operator or Admin only
    await requireRole(request, ["operator", "admin"]);

    const snapshot = await executiveIntelligenceService.getExecutiveSnapshot();

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
