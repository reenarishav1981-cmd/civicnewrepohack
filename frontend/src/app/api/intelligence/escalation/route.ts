import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { rankIncidentsByEscalationRisk } from "@/lib/predictive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const incidents = await civicRepository.getIncidents();
    const watchlist = rankIncidentsByEscalationRisk(incidents);

    return NextResponse.json({
      success: true,
      data: {
        watchlist,
        count: watchlist.length
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
