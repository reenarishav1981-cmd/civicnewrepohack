import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict or invalid state transition") {
    super(message, 409);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required or invalid credentials") {
    super(message, 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied: insufficient permissions") {
    super(message, 403);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Invalid request payload", details?: any) {
    super(message, 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = "Validation failed: unprocessable entity", details?: any) {
    super(message, 422, details);
    this.name = "UnprocessableEntityError";
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * Normalizes all API route errors into consistent JSON responses.
 * Never leaks raw database connection strings, file paths, or internal stack traces.
 */
export function handleApiError(error: any) {
  // 1. AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(typeof error.details === "object" && error.details !== null ? error.details : {}),
        ...(error.details ? { details: error.details } : {})
      },
      { status: error.statusCode }
    );
  }

  // 2. Zod Validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed on request payload",
        details: error.format()
      },
      { status: 400 }
    );
  }

  // 3. Prisma or Database errors
  if (error?.code && typeof error.code === "string" && error.code.startsWith("P")) {
    console.error(`[DatabaseError] Prisma code ${error.code}:`, error.message);
    return NextResponse.json(
      {
        success: false,
        error: "A database persistence error occurred. Please verify your request parameters."
      },
      { status: 409 }
    );
  }

  // 4. Fallback internal server error
  console.error("[InternalServerError]:", error);
  const safeMessage = error?.message && typeof error.message === "string" && !error.message.includes("file:") && !error.message.includes("prisma")
    ? error.message
    : "An unexpected internal server error occurred.";

  return NextResponse.json(
    {
      success: false,
      error: safeMessage
    },
    { status: 500 }
  );
}
