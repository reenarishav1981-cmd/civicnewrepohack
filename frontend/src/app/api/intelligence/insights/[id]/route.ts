import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/errors/AppError";
import { analyzeIncidentPredictiveProfile } from "@/lib/predictive";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const incidentId = params.id;
    const incident = await civicRepository.getIncidentById(incidentId);

    if (!incident) {
      return handleApiError(new NotFoundError("Incident not found"));
    }

    const allIncidents = await civicRepository.getIncidents();
    const allReports = await civicRepository.getReports();

    const profile = analyzeIncidentPredictiveProfile(incident, allIncidents, allReports);

    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
