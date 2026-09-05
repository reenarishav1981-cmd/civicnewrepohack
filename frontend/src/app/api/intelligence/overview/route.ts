import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { generatePredictiveOverview } from "@/lib/predictive";
import { generateCityIntelligenceSnapshot } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Enforce RBAC: Operator or Admin only
    await requireRole(request, ["operator", "admin"]);

    // 2. Fetch ground-truth repository records
    const incidents = await civicRepository.getIncidents();
    const reports = await civicRepository.getReports();

    // 3. Compute city snapshot and predictive overview
    const snapshot = await generateCityIntelligenceSnapshot();
    const predictive = generatePredictiveOverview(incidents, reports);

    return NextResponse.json({
      success: true,
      data: {
        ...snapshot,
        ...predictive,
        cityHealthScore: snapshot.cityHealthScore,
        cityRiskIndex: 100 - snapshot.cityHealthScore,
        hotspots: snapshot.activeHotspots,
        criticalHotspots: snapshot.criticalHotspots,
        chronicPatterns: predictive.chronicPatterns,
        chronicLocations: snapshot.chronicLocations,
        escalationWatchlist: predictive.escalationWatchlist,
        emergingIssues: snapshot.emergingIssues,
        criticalRisks: snapshot.criticalRisks,
        riskZones: snapshot.criticalRisks,
        incidentVelocity: snapshot.incidentVelocity,
        aiPerformance: snapshot.aiPerformance,
        aiAgreementRate: snapshot.aiAgreementRate,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
