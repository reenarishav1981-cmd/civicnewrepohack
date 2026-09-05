import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { civicRepository } from "@/lib/repositories";
import { analyzeDepartmentPerformance } from "@/lib/executive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const incidents = await civicRepository.getIncidents();
    const departments = analyzeDepartmentPerformance(incidents);

    return NextResponse.json({
      success: true,
      data: departments,
      count: departments.length,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
