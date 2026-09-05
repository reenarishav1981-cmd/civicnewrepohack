import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";

export async function GET() {
  try {
    const activity = await civicRepository.getActivityLogs(30);
    return NextResponse.json({ success: true, count: activity.length, data: activity });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
