import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { civicRepository } from "@/lib/repositories";
import { projectOperationalTrajectory, generateAllImpactProjections } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const incidents = await civicRepository.getIncidents();

    if (department) {
      const projection = projectOperationalTrajectory(department, incidents);
      return NextResponse.json({
        success: true,
        data: projection,
      });
    }

    const allProjections = generateAllImpactProjections(incidents);

    return NextResponse.json({
      success: true,
      data: allProjections,
      count: allProjections.length,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
