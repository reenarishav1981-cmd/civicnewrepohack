import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireAuthenticatedUser } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Enforce Authentication Guard
    const user = await requireAuthenticatedUser(request);

    // 2. Fetch reports strictly scoped to authenticated user ID
    const userReports = await civicRepository.getReports({ userId: user.id });

    // 3. Enrich with current incident public status if connected
    const allIncidents = await civicRepository.getIncidents();
    const incidentMap = new Map(allIncidents.map(i => [i.id, i]));

    const enriched = userReports.map(rep => {
      const inc = rep.incidentId ? incidentMap.get(rep.incidentId) : undefined;
      return {
        id: rep.id,
        description: rep.description,
        category: rep.category,
        address: rep.address,
        mediaUrl: rep.mediaUrl,
        status: rep.status,
        incidentId: rep.incidentId || null,
        incidentStatus: inc ? inc.status : null,
        incidentTitle: inc ? inc.title : null,
        createdAt: rep.createdAt,
        trackingUrl: rep.incidentId ? `/track/${rep.incidentId}` : null
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}