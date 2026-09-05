import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { executiveIntelligenceService } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const snapshot = await executiveIntelligenceService.getExecutiveSnapshot();
    let recommendations = snapshot.recommendations;

    if (statusFilter && statusFilter !== "ALL") {
      recommendations = recommendations.filter(
        (r) => r.status.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
