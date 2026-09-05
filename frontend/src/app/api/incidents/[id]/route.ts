import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { handleApiError, NotFoundError } from "@/lib/errors/AppError";
import { requireRole } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;
    const incident = await civicRepository.getIncidentById(incidentId);

    if (!incident) {
      return handleApiError(new NotFoundError("Incident not found"));
    }

    const allReports = await civicRepository.getReports();
    const connectedReports = allReports.filter(r => r.incidentId === incidentId);
    const assignedTeam = incident.assignedTeamId ? await civicRepository.getTeamById(incident.assignedTeamId) : undefined;
    const allTasks = await civicRepository.getTasks();
    const tasks = allTasks.filter(t => t.incidentId === incidentId);

    return NextResponse.json({
      success: true,
      data: {
        incident,
        connectedReports,
        assignedTeam,
        tasks
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Enforce Role-Based Access Control: Operator or Admin only
    await requireRole(request, ["operator", "admin"]);

    const incidentId = params.id;
    const body = await request.json();

    const updated = await civicRepository.updateIncident(incidentId, body);
    if (!updated) {
      return handleApiError(new NotFoundError("Incident not found"));
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return handleApiError(error);
  }
}
