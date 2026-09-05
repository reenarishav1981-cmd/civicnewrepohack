import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { getPublicIncidentStatus } from "@/lib/domain/publicIncidentStatus";
import { mapTimelineEventToPublicEvent } from "@/lib/domain/publicTimeline";
import { getAuthenticatedUser } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;
    if (!incidentId) {
      throw new NotFoundError("Missing tracking ID");
    }

    // 1. Fetch incident from repository (supports both Incident ID and Report ID)
    let incident = await civicRepository.getIncidentById(incidentId);
    if (!incident) {
      const report = await civicRepository.getReportById(incidentId);
      if (report && report.incidentId) {
        incident = await civicRepository.getIncidentById(report.incidentId);
      }
    }

    if (!incident) {
      return NextResponse.json(
        { success: false, error: `No incident found matching tracking ID '${incidentId}'.` },
        { status: 404 }
      );
    }

    // 2. Fetch associated tasks (to check active field progress safely)
    const allTasks = await civicRepository.getTasks();
    const tasks = allTasks.filter(t => t.incidentId === incidentId);
    const activeTask = tasks.find(t => t.status !== "completed") || tasks[tasks.length - 1];

    // 3. Optional authenticated caller inspection for ownership detection
    const authUser = await getAuthenticatedUser(request);
    let isReportOwner = false;
    if (authUser) {
      const allReports = await civicRepository.getReports();
      isReportOwner = allReports.some(r => r.incidentId === incidentId && r.userId === authUser.id);
    }

    // 4. Derive Public-Safe Status & Lifecycle
    const statusInfo = getPublicIncidentStatus(incident.status, activeTask?.status);

    // 5. Clean, Sanitize, and Map Timeline Events
    const publicTimeline = (incident.timeline || []).map(mapTimelineEventToPublicEvent);

    // 6. Assemble Strict, Public-Safe DTO (Zero Internal Leakage)
    const publicData = {
      trackingId: incident.id,
      title: incident.title,
      category: incident.category,
      location: incident.zone || "Municipal Operational Sector",
      address: incident.address,
      status: statusInfo.publicStatus,
      statusCode: statusInfo.statusCode,
      stageKey: statusInfo.stageKey,
      description: statusInfo.description,
      progressPercentage: statusInfo.progressPercentage,
      isResolved: statusInfo.isResolved,
      reportedAt: incident.createdAt,
      lastUpdatedAt: incident.updatedAt,
      citizenFeedbackStatus: incident.citizenFeedbackStatus || null,
      canProvideFeedback: (incident.status === "resolved" || incident.status === "closed") && isReportOwner && !incident.citizenFeedbackStatus,
      isReportOwner,
      evidence: (incident.status === "resolved" || incident.status === "closed") ? {
        beforePhotoUrl: incident.beforeEvidenceUrl || null,
        afterPhotoUrl: incident.afterEvidenceUrl || null,
      } : null
    };

    return NextResponse.json({
      success: true,
      incident: publicData,
      timeline: publicTimeline
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}