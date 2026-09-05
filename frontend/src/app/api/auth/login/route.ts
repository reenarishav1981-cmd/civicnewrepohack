import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { LoginSchema } from "@/lib/validation/schemas";
import { handleApiError, UnauthorizedError } from "@/lib/errors/AppError";
import { verifyPassword, createSessionToken, getSessionCookieOptions, sanitizeUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // 1. Zod input validation
    const validation = LoginSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on login payload",
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 2. Find user by email
    const userWithAuth = await civicRepository.getUserByEmail(email);
    if (!userWithAuth || !userWithAuth.passwordHash) {
      // Generic error response to prevent user enumeration
      throw new UnauthorizedError("Invalid email or password.");
    }

    // 3. Verify password securely
    const isValid = await verifyPassword(password, userWithAuth.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const safeUser = sanitizeUser(userWithAuth);

    // 4. Create authenticated session token
    const token = createSessionToken(safeUser);

    // 5. Set secure HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: safeUser
      }
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set({
      name: cookieOpts.name,
      value: token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge
    });

    return response;
  } catch (error: any) {
    return handleApiError(error);
  }
}
