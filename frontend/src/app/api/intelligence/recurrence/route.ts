import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { analyzeRecurrencePatterns } from "@/lib/predictive";
import { detectRecurrencePatterns } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const incidents = await civicRepository.getIncidents();
    const patterns = analyzeRecurrencePatterns(incidents);
    const recurrenceAlerts = detectRecurrencePatterns(incidents);

    return NextResponse.json({
      success: true,
      data: {
        patterns,
        recurrenceAlerts,
        count: recurrenceAlerts.length,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
