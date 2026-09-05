import { NextResponse } from "next/server";
import { requireAuthenticatedUser, sanitizeUser } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
