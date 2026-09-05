import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { detectEmergingIssues } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const [incidents, reports] = await Promise.all([
      civicRepository.getIncidents(),
      civicRepository.getReports(),
    ]);

    const emergingIssues = detectEmergingIssues(incidents, reports);

    return NextResponse.json({
      success: true,
      data: {
        emergingIssues,
        count: emergingIssues.length,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
