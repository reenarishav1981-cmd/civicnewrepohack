import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config";
import { User, FieldTask } from "../../types";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "../errors/AppError";

export interface SessionPayload {
  sub: string; // User ID
  email?: string;
  name: string;
  role: string;
  exp: number; // Expiration timestamp in seconds
}

export const SESSION_COOKIE_NAME = "civicpulse_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Hash password securely using bcryptjs (salt rounds: 10)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify plaintext password against stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a session payload using HMAC-SHA256 with AUTH_SECRET
 */
export function createSessionToken(user: User): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 signed session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", env.AUTH_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    // Timing-safe signature check
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);

    // Expiration check
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Helper to extract session token from Request or Header string
 */
export function extractTokenFromRequest(request?: Request): string | null {
  if (!request) return null;

  // 1. Check Cookie header
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map(c => c.trim());
    for (const c of cookies) {
      const [name, ...rest] = c.split("=");
      if (name === SESSION_COOKIE_NAME) {
        return rest.join("=");
      }
    }
  }

  // 2. Check Authorization Bearer header as optional API alternative
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Get authenticated user from request without throwing
 */
export async function getAuthenticatedUser(request?: Request): Promise<User | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || !payload.sub) return null;

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: (payload.role ? payload.role.toLowerCase() : "citizen") as any
  };
}

/**
 * Require authenticated user from request; throws UnauthorizedError if invalid
 */
export async function requireAuthenticatedUser(request?: Request): Promise<User> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new UnauthorizedError("Authentication required. Please log in.");
  }
  return user;
}

/**
 * Return safe user object (strips passwordHash or sensitive internal fields)
 */
export function sanitizeUser(user: any): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email || undefined,
    role: (user.role ? user.role.toLowerCase() : "citizen") as any,
    phone: user.phone || undefined,
    avatarUrl: user.avatarUrl || undefined
  };
}

/**
 * Cookie options helper for Next.js responses
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  };
}

/**
 * Supported normalized role type for Stage 5 authorization
 */
export type NormalizedRole = "citizen" | "operator" | "worker" | "admin";

const VALID_ROLES = new Set<NormalizedRole>(["citizen", "operator", "worker", "admin"]);

/**
 * Canonically and defensively normalizes any role string.
 * Trims whitespace, converts to lowercase, and validates against the known role set.
 * Undefined, empty, or unrecognized values safely default to "citizen".
 * SECURITY GUARANTEE: An invalid or unrecognized role will NEVER be granted elevated privileges.
 */
export function normalizeRole(role?: string): NormalizedRole {
  if (!role || typeof role !== "string") {
    return "citizen";
  }
  const clean = role.trim().toLowerCase() as NormalizedRole;
  if (VALID_ROLES.has(clean)) {
    return clean;
  }
  return "citizen";
}

/**
 * Central role-based authorization guard.
 * 1. Authenticates user via requireAuthenticatedUser(request). Throws 401 if unauthenticated.
 * 2. Normalizes user's server-verified role.
 * 3. Compares against normalized allowed roles.
 * 4. Returns authenticated user if authorized, otherwise throws 403 ForbiddenError.
 */
export async function requireRole(
  request: Request,
  allowedRoles: NormalizedRole[]
): Promise<User> {
  const user = await requireAuthenticatedUser(request);
  const userRole = normalizeRole(user.role);
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

  if (!normalizedAllowed.includes(userRole)) {
    throw new ForbiddenError(
      `Access denied: role '${userRole}' does not have sufficient permissions for this operation.`
    );
  }

  return user;
}

/**
 * Task Ownership Authorization Guard.
 * 1. Authenticates user via requireAuthenticatedUser(request). Throws 401 if unauthenticated.
 * 2. Normalizes user role.
 * 3. Rejects citizen users immediately with 403 ForbiddenError.
 * 4. Loads task from trusted repository. Throws 404 NotFoundError if missing.
 * 5. If operator or admin: grants access (supervisory privilege).
 * 6. If worker: verifies task.assignedWorkerId matches authenticated user's immutable ID.
 *    - If task.assignedWorkerId is null/undefined: throws 403 ForbiddenError (fail-closed).
 *    - If task.assignedWorkerId !== user.id: throws 403 ForbiddenError.
 * 7. Returns { user, task }.
 */
export async function requireTaskOwnership(
  request: Request,
  taskId: string,
  repo: { getTaskById: (id: string) => Promise<FieldTask | null> }
): Promise<{ user: User; task: FieldTask }> {
  const user = await requireAuthenticatedUser(request);
  const role = normalizeRole(user.role);

  if (role === "citizen") {
    throw new ForbiddenError("Access denied: citizens cannot modify field tasks.");
  }

  const task = await repo.getTaskById(taskId);
  if (!task) {
    throw new NotFoundError("Task not found");
  }

  if (role === "operator" || role === "admin") {
    return { user, task };
  }

  if (role === "worker") {
    // Strict identity-based ownership: must match immutable assignedWorkerId
    // Fails closed if assignedWorkerId is null or mismatch
    if (!task.assignedWorkerId || task.assignedWorkerId !== user.id) {
      throw new ForbiddenError("Access denied: you are not assigned to this field task.");
    }

    return { user, task };
  }

  throw new ForbiddenError("Access denied: insufficient permissions to modify field task.");
}

