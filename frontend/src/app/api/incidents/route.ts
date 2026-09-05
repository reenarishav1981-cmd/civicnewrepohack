import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const source = searchParams.get("source") || undefined;

    const incidents = await civicRepository.getIncidents({ status, priority, source });

    return NextResponse.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
