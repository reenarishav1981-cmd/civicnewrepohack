import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { realtimeEventBus } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const events = realtimeEventBus.getRecentEvents(since, limit);

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
