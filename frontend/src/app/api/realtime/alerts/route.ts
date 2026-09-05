import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { civicRepository } from "@/lib/repositories";
import { detectCivicHotspots, detectEmergingIssues } from "@/lib/intelligence";
import { deriveOperationalAlerts } from "@/lib/realtime";

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

    const alerts = deriveOperationalAlerts(incidents, hotspots, emerging);

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
