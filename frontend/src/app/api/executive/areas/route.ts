import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { civicRepository } from "@/lib/repositories";
import { detectCivicHotspots, detectEmergingIssues, detectRecurrencePatterns } from "@/lib/intelligence";
import { analyzeAreaPerformance } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const [incidents, reports] = await Promise.all([
      civicRepository.getIncidents(),
      civicRepository.getReports(),
    ]);

    const hotspots = detectCivicHotspots(incidents, reports);
    const emerging = detectEmergingIssues(incidents, reports);
    const recurrence = detectRecurrencePatterns(incidents);

    const areas = analyzeAreaPerformance(incidents, reports, hotspots, recurrence, emerging);

    return NextResponse.json({
      success: true,
      data: areas,
      count: areas.length,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
