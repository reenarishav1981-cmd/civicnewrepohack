import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";

export async function GET() {
  try {
    const teams = await civicRepository.getTeams();
    return NextResponse.json({ success: true, count: teams.length, data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
