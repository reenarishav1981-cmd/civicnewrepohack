import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { calculateAIPerformance } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const performance = await calculateAIPerformance();

    return NextResponse.json({
      success: true,
      data: performance,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
