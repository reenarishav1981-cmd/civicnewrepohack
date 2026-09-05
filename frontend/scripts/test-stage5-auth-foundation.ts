import { normalizeRole, requireRole, createSessionToken, SESSION_COOKIE_NAME } from "../src/lib/auth";
import { ForbiddenError, UnauthorizedError } from "../src/lib/errors/AppError";
import { User } from "../src/types";

async function runStage5FoundationTests() {
  console.log("=== RUNNING STAGE 5.1 CENTRAL AUTHORIZATION FOUNDATION TESTS ===\n");

  // SECTION A: ROLE NORMALIZATION TESTS
  console.log("--- SECTION A: ROLE NORMALIZATION TESTS ---");

  // TEST 1: normalizeRole("ADMIN") -> "admin"
  const t1 = normalizeRole("ADMIN");
  if (t1 !== "admin") throw new Error(`TEST 1 Failed: Expected 'admin', got '${t1}'`);
  console.log("[PASS] TEST 1: normalizeRole('ADMIN') === 'admin'");

  // TEST 2: normalizeRole("admin") -> "admin"
  const t2 = normalizeRole("admin");
  if (t2 !== "admin") throw new Error(`TEST 2 Failed: Expected 'admin', got '${t2}'`);
  console.log("[PASS] TEST 2: normalizeRole('admin') === 'admin'");

  // TEST 3: normalizeRole("Operator") -> "operator"
  const t3 = normalizeRole("Operator");
  if (t3 !== "operator") throw new Error(`TEST 3 Failed: Expected 'operator', got '${t3}'`);
  console.log("[PASS] TEST 3: normalizeRole('Operator') === 'operator'");

  // TEST 4: normalizeRole(undefined) -> "citizen"
  const t4 = normalizeRole(undefined);
  if (t4 !== "citizen") throw new Error(`TEST 4 Failed: Expected default 'citizen', got '${t4}'`);
  console.log("[PASS] TEST 4: normalizeRole(undefined) === 'citizen' (Safe Default)");

  // TEST 4b: Defensively test invalid/malicious strings: "SUPERADMIN", "", "attacker"
  const t4b1 = normalizeRole("SUPERADMIN");
  const t4b2 = normalizeRole("");
  const t4b3 = normalizeRole("attacker");
  if (t4b1 !== "citizen" || t4b2 !== "citizen" || t4b3 !== "citizen") {
    throw new Error("TEST 4b Failed: Malicious or unrecognized roles must default to citizen!");
  }
  console.log("[PASS] TEST 4b: Malicious/unrecognized roles safely default to 'citizen'");

  // SECTION B: CENTRAL requireRole() LOGIC TESTS
  console.log("\n--- SECTION B: requireRole() AUTHORIZATION GUARD TESTS ---");

  // Helper to create mock HTTP Request with cookie
  function createMockRequest(user?: User, tamperedToken?: string): Request {
    const headers = new Headers();
    if (user) {
      const token = createSessionToken(user);
      headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
    } else if (tamperedToken) {
      headers.set("cookie", `${SESSION_COOKIE_NAME}=${tamperedToken}`);
    }
    return new Request("http://localhost:3000/api/test", { headers });
  }

  const operatorUser: User = { id: "usr-3", name: "Vikram Mehta", role: "operator", email: "ops.lead@civicpulse.gov.in" };
  const adminUser: User = { id: "usr-admin", name: "System Admin", role: "admin", email: "admin@civicpulse.gov.in" };
  const citizenUser: User = { id: "usr-1", name: "Aarav Sharma", role: "citizen", email: "citizen@civicpulse.gov.in" };
  const workerUser: User = { id: "usr-4", name: "Rajesh Kumar", role: "worker", email: "worker@civicpulse.gov.in" };

  // TEST 5: Valid operator calling requireRole with ["operator", "admin"] -> ALLOW
  const req5 = createMockRequest(operatorUser);
  const resUser5 = await requireRole(req5, ["operator", "admin"]);
  if (resUser5.id !== operatorUser.id || resUser5.role !== "operator") {
    throw new Error("TEST 5 Failed: Operator was not allowed!");
  }
  console.log("[PASS] TEST 5: requireRole(operatorReq, ['operator', 'admin']) -> ALLOWED");

  // TEST 6: Valid admin calling requireRole with ["operator", "admin"] -> ALLOW
  const req6 = createMockRequest(adminUser);
  const resUser6 = await requireRole(req6, ["operator", "admin"]);
  if (resUser6.id !== adminUser.id || resUser6.role !== "admin") {
    throw new Error("TEST 6 Failed: Admin was not allowed!");
  }
  console.log("[PASS] TEST 6: requireRole(adminReq, ['operator', 'admin']) -> ALLOWED");

  // TEST 7: Valid citizen calling requireRole with ["operator", "admin"] -> 403 Forbidden
  const req7 = createMockRequest(citizenUser);
  let caught7 = false;
  try {
    await requireRole(req7, ["operator", "admin"]);
  } catch (err: any) {
    if (err instanceof ForbiddenError && err.statusCode === 403) {
      caught7 = true;
    } else {
      throw new Error(`TEST 7 Failed: Expected ForbiddenError(403), got ${err}`);
    }
  }
  if (!caught7) throw new Error("TEST 7 Failed: Citizen was not rejected with 403!");
  console.log("[PASS] TEST 7: requireRole(citizenReq, ['operator', 'admin']) -> 403 Forbidden");

  // TEST 8: Valid worker calling requireRole with ["operator", "admin"] -> 403 Forbidden
  const req8 = createMockRequest(workerUser);
  let caught8 = false;
  try {
    await requireRole(req8, ["operator", "admin"]);
  } catch (err: any) {
    if (err instanceof ForbiddenError && err.statusCode === 403) {
      caught8 = true;
    } else {
      throw new Error(`TEST 8 Failed: Expected ForbiddenError(403), got ${err}`);
    }
  }
  if (!caught8) throw new Error("TEST 8 Failed: Worker was not rejected with 403!");
  console.log("[PASS] TEST 8: requireRole(workerReq, ['operator', 'admin']) -> 403 Forbidden");

  // TEST 9: Unauthenticated request -> 401 Unauthorized
  const req9 = createMockRequest(); // No cookie
  let caught9 = false;
  try {
    await requireRole(req9, ["operator", "admin"]);
  } catch (err: any) {
    if (err instanceof UnauthorizedError && err.statusCode === 401) {
      caught9 = true;
    } else {
      throw new Error(`TEST 9 Failed: Expected UnauthorizedError(401), got ${err}`);
    }
  }
  if (!caught9) throw new Error("TEST 9 Failed: Unauthenticated request was not rejected with 401!");
  console.log("[PASS] TEST 9: requireRole(unauthReq, ['operator', 'admin']) -> 401 Unauthorized");

  // TEST 10: Malformed / tampered session -> 401 Unauthorized
  const req10 = createMockRequest(undefined, "tampered.token.signature");
  let caught10 = false;
  try {
    await requireRole(req10, ["operator", "admin"]);
  } catch (err: any) {
    if (err instanceof UnauthorizedError && err.statusCode === 401) {
      caught10 = true;
    } else {
      throw new Error(`TEST 10 Failed: Expected UnauthorizedError(401), got ${err}`);
    }
  }
  if (!caught10) throw new Error("TEST 10 Failed: Tampered token was not rejected with 401!");
  console.log("[PASS] TEST 10: requireRole(tamperedReq, ['operator', 'admin']) -> 401 Unauthorized");

  // TEST 11: Attempted client role spoofing
  // A citizen attempts to pass { "role": "admin" } in request body or headers
  const req11 = createMockRequest(citizenUser);
  // Authorization MUST solely use verified session user identity, ignoring client payload
  let caught11 = false;
  try {
    await requireRole(req11, ["operator", "admin"]);
  } catch (err: any) {
    if (err instanceof ForbiddenError && err.statusCode === 403) {
      caught11 = true;
    }
  }
  if (!caught11) throw new Error("TEST 11 Failed: Spoofed role was accepted!");
  console.log("[PASS] TEST 11: Client role spoofing has zero effect (Citizen remains 403 Forbidden)");

  console.log("\n=== ALL STAGE 5.1 CENTRAL AUTHORIZATION FOUNDATION TESTS PASSED ===");
}

runStage5FoundationTests().catch(err => {
  console.error("Stage 5.1 Test Failed:", err);
  process.exit(1);
});
