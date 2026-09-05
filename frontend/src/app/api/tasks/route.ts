import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { requireRole, normalizeRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { FieldTask } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Enforce Role-Based Access Control: Worker, Operator, or Admin only
    const user = await requireRole(request, ["worker", "operator", "admin"]);
    const userRole = normalizeRole(user.role);

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId") || undefined;
    const myTasks = searchParams.get("myTasks") === "true";

    // 2. Data Isolation Enforcement:
    // If authenticated user is a WORKER: ALWAYS scope exclusively to their own tasks
    // If OPERATOR or ADMIN: can view all tasks, filter by teamId, or scope to their own tasks
    let tasks: FieldTask[];
    if (userRole === "worker" || myTasks) {
      tasks = await civicRepository.getTasks({ assignedWorkerId: user.id });
    } else {
      tasks = await civicRepository.getTasks(teamId ? { teamId } : undefined);
    }

    return NextResponse.json({ success: true, count: tasks.length, data: tasks });
  } catch (error: any) {
    return handleApiError(error);
  }
}
