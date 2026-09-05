import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { evaluateIncidentRisk } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const [incidents, reports] = await Promise.all([
      civicRepository.getIncidents(),
      civicRepository.getReports(),
    ]);

    const riskZones = incidents
      .filter((i) => i.status !== "resolved" && i.status !== "closed")
      .map((inc) => evaluateIncidentRisk(inc, incidents, reports))
      .sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({
      success: true,
      data: {
        riskZones,
        count: riskZones.length,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
