import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { reportService } from "@/lib/services/ReportService";
import { CreateReportSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/errors/AppError";

export async function GET() {
  try {
    const reports = await civicRepository.getReports();
    return NextResponse.json({ success: true, count: reports.length, data: reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extract authenticated user if available
    const authUser = await getAuthenticatedUser(request);

    // 2. Zod validation
    const validation = CreateReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing or invalid required fields (description, latitude, longitude)",
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { 
      description, 
      category, 
      latitude, 
      longitude, 
      address, 
      mediaUrl, 
      userName, 
      userPhone,
      forceNewIncident,
      connectToIncidentId,
      source 
    } = validation.data;

    // 3. User Identity Binding:
    // If authenticated, server-side identity takes strict precedence over untrusted client payload.
    // If unauthenticated, fallback to client-supplied or default name to preserve demo compatibility.
    const resolvedUserId = authUser ? authUser.id : "usr-1";
    const resolvedUserName = authUser ? authUser.name : (userName || "Verified Citizen");

    // Execute through ReportService (orchestrates AI correlation & persistence)
    const result = await reportService.submitReport({
      description,
      category,
      latitude,
      longitude,
      address,
      mediaUrl,
      userName: resolvedUserName,
      userPhone,
      userId: resolvedUserId,
      forceNewIncident,
      connectToIncidentId,
      source
    });

    return NextResponse.json({
      success: true,
      data: {
        report: result.report,
        incident: result.incident,
        correlation: result.correlation,
        connectedIncidentId: result.incident.id,
        isNewIncident: result.isNewIncident,
        matchReasons: result.matchReasons,
        historicalResponseActive: result.historicalResponseActive
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
