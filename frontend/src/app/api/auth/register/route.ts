import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { RegisterSchema } from "@/lib/validation/schemas";
import { handleApiError, ConflictError } from "@/lib/errors/AppError";
import { hashPassword, createSessionToken, getSessionCookieOptions, sanitizeUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // 1. Zod input validation
    const validation = RegisterSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on registration payload",
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { name, email, password, role, phone } = validation.data;

    // 2. Prevent duplicate email accounts
    const existing = await civicRepository.getUserByEmail(email);
    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // 3. Hash password securely
    const passwordHash = await hashPassword(password);

    // 4. Create user via repository — ALWAYS enforce role = 'citizen' for public registration
    const newUser = await civicRepository.createUser({
      name,
      email,
      passwordHash,
      role: "citizen",
      phone
    });

    const safeUser = sanitizeUser(newUser);

    // 5. Create authenticated session token
    const token = createSessionToken(safeUser);

    // 6. Set HTTP-only session cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: safeUser
        }
      },
      { status: 201 }
    );

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
