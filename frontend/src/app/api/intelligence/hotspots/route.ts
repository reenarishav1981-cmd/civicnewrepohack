import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { detectCivicHotspots } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");
    const riskLevelFilter = searchParams.get("riskLevel");
    const timeWindowFilter = searchParams.get("timeWindow"); // e.g. 7d, 30d

    const [incidents, reports] = await Promise.all([
      civicRepository.getIncidents(),
      civicRepository.getReports(),
    ]);

    let hotspots = detectCivicHotspots(incidents, reports);

    if (categoryFilter && categoryFilter !== "all") {
      hotspots = hotspots.filter((h) =>
        h.dominantCategory.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (riskLevelFilter && riskLevelFilter !== "all") {
      hotspots = hotspots.filter((h) => {
        const lvl = h.hotspotRiskScore >= 75 ? "critical" : h.hotspotRiskScore >= 50 ? "high" : h.hotspotRiskScore >= 25 ? "moderate" : "low";
        return lvl === riskLevelFilter.toLowerCase();
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hotspots,
        count: hotspots.length,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
