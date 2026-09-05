import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { UpdateTaskStatusSchema } from "@/lib/validation/schemas";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/errors/AppError";
import { requireTaskOwnership } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    // 1. Enforce Worker Ownership & Role Authorization
    await requireTaskOwnership(request, taskId, civicRepository);

    const rawBody = await request.json();

    // 2. Zod schema validation
    const validation = UpdateTaskStatusSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed on task update payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { status, beforePhotoUrl, afterPhotoUrl, workerNotes } = validation.data;

    // 2. Execute Atomic Domain Workflow Transaction with Status Transition Guard
    const result = await civicRepository.advanceTaskStatus(taskId, status, {
      workerNotes,
      afterPhotoUrl,
      beforePhotoUrl
    });

    // 3. Return exact existing contract
    return NextResponse.json({
      success: true,
      data: {
        task: result.task,
        incidentStatus: result.incidentStatus
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
