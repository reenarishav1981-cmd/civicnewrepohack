const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function request(options, data, cookie) {
  return new Promise((resolve, reject) => {
    const headers = { ...(options.headers || {}) };
    if (cookie) headers['Cookie'] = cookie;
    if (data) headers['Content-Type'] = 'application/json';

    const req = http.request({ ...options, headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        const setCookieHeader = res.headers['set-cookie'];
        let sessionCookie = null;
        if (setCookieHeader) {
          for (const c of setCookieHeader) {
            if (c.startsWith('civicpulse_session=')) {
              sessionCookie = c.split(';')[0];
              break;
            }
          }
        }
        resolve({ status: res.statusCode, data: parsed, sessionCookie, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runComprehensiveAuditTests() {
  console.log("================================================================================");
  console.log("CIVICPULSE — COMPREHENSIVE 16-POINT ARCHITECTURAL AUDIT & VERIFICATION SUITE");
  console.log("================================================================================");

  const base = { hostname: 'localhost', port: 3000 };
  const password = "CivicPulse2026!";
  const hash = await bcrypt.hash(password, 10);

  // Setup unique test personas
  const timestamp = Date.now().toString().slice(-5);
  const workerAPhone = `+91 97111 ${timestamp}`;
  const workerBPhone = `+91 97222 ${timestamp}`;

  const workerA = await prisma.user.create({
    data: {
      name: `Audit Worker Alpha ${timestamp}`,
      email: `worker.alpha.${Date.now()}@civicpulse.gov.in`,
      phone: workerAPhone,
      role: "worker",
      passwordHash: hash
    }
  });

  const workerB = await prisma.user.create({
    data: {
      name: `Audit Worker Beta ${timestamp}`,
      email: `worker.beta.${Date.now()}@civicpulse.gov.in`,
      phone: workerBPhone,
      role: "worker",
      passwordHash: hash
    }
  });

  // Setup Field Team
  const teamAlphaId = `team-audit-a-${timestamp}`;
  await prisma.fieldTeam.create({
    data: {
      id: teamAlphaId,
      name: `Specialist Pavement Squad ${timestamp}`,
      department: "Road Maintenance",
      leaderName: `Audit Worker Alpha ${timestamp}`,
      phone: workerAPhone,
      specialization: "Asphalt & Foundations",
      status: "available",
      currentLatitude: 21.1702,
      currentLongitude: 72.8311
    }
  });

  // Setup Test Incident
  const incId = `CP-AUDIT-${timestamp}`;
  await prisma.incident.create({
    data: {
      id: incId,
      title: "Sinkhole Formation Threatening Transit Corridor",
      category: "Road Hazard",
      priority: "critical",
      priorityScore: 92,
      priorityReason: "Structural undermining of arterial road",
      status: "under_review",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Gateway Junction, Sector 1",
      zone: "Sector 1",
      aiConfidence: 0.99
    }
  });

  // Authenticate
  const opsAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "ops.lead@civicpulse.gov.in",
    password
  });
  const workerAAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: workerA.email,
    password
  });
  const workerBAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: workerB.email,
    password
  });

  console.log("✓ Personas authenticated: Operator, Assigned Worker A, Unrelated Worker B.");

  // TEST 1: Unauthenticated request (Expected 401)
  console.log("\n[TEST 1] Unauthenticated request to /api/tasks (Expected 401)");
  const t1 = await request({ ...base, path: '/api/tasks', method: 'GET' });
  console.log(`Status: ${t1.status} | PASS: ${t1.status === 401}`);
  if (t1.status !== 401) throw new Error("TEST 1 Failed: Expected 401");

  // TEST 3: Valid assignment (Operator assigns available team)
  console.log("\n[TEST 3] Valid assignment: Operator assigns Team Alpha to Incident");
  const assignRes = await request({ ...base, path: `/api/incidents/${incId}/assign`, method: 'POST' }, {
    teamId: teamAlphaId,
    instructions: "Excavate cavity, backfill stone aggregate, hot asphalt seal."
  }, opsAuth.sessionCookie);
  console.log(`Status: ${assignRes.status} | Task: ${assignRes.data?.data?.task?.id} | PASS: ${assignRes.status === 200}`);
  if (assignRes.status !== 200) throw new Error("TEST 3 Failed");
  const taskId = assignRes.data?.data?.task?.id;

  // TEST 2: Unauthorized worker attempts task update (Expected 403)
  console.log("\n[TEST 2] Unauthorized worker attempts task update (Expected 403)");
  const t2 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "en_route"
  }, workerBAuth.sessionCookie);
  console.log(`Status: ${t2.status} | Error: '${t2.data?.error}' | PASS: ${t2.status === 403}`);
  if (t2.status !== 403) throw new Error("TEST 2 Failed: Expected 403");

  // TEST 4: Valid: assigned -> en_route
  console.log("\n[TEST 4] Valid: assigned -> en_route");
  const t4 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "en_route",
    workerNotes: "Dispatched from central garage with bitumen rollers."
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t4.status} | Task Status: ${t4.data?.data?.task?.status} | PASS: ${t4.status === 200 && t4.data?.data?.task?.status === 'en_route'}`);
  if (t4.status !== 200 || t4.data?.data?.task?.status !== 'en_route') throw new Error("TEST 4 Failed");

  // TEST 5: Invalid transition (en_route -> completed) (Expected 409)
  console.log("\n[TEST 5] Invalid transition: en_route -> completed (Expected 409)");
  const t5 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: "https://example.com/photo.jpg",
    workerNotes: "Attempting to skip to completed prematurely"
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t5.status} | Error: '${t5.data?.error}' | PASS: ${t5.status === 409}`);
  if (t5.status !== 409) throw new Error("TEST 5 Failed: Expected 409");

  // TEST 6: en_route -> arrived
  console.log("\n[TEST 6] Valid: en_route -> arrived");
  const t6 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "arrived",
    workerNotes: "On-site at Gateway Junction. Safety cones placed."
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t6.status} | Task Status: ${t6.data?.data?.task?.status} | PASS: ${t6.status === 200 && t6.data?.data?.task?.status === 'arrived'}`);
  if (t6.status !== 200 || t6.data?.data?.task?.status !== 'arrived') throw new Error("TEST 6 Failed");

  // TEST 7: arrived -> in_progress
  console.log("\n[TEST 7] Valid: arrived -> in_progress");
  const t7 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "in_progress",
    workerNotes: "Excavating sinkhole cavity and leveling subgrade."
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t7.status} | Task Status: ${t7.data?.data?.task?.status} | Incident Status: ${t7.data?.data?.incidentStatus} | PASS: ${t7.status === 200}`);
  if (t7.status !== 200 || t7.data?.data?.task?.status !== 'in_progress') throw new Error("TEST 7 Failed");

  // TEST 8: Completion without evidence (Expected 422)
  console.log("\n[TEST 8] Completion without evidence (Expected 422)");
  const t8 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed"
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t8.status} | Missing: ${JSON.stringify(t8.data?.missingRequirements)} | PASS: ${t8.status === 422}`);
  if (t8.status !== 422) throw new Error("TEST 8 Failed: Expected 422");

  // TEST 9: Completion with valid evidence
  console.log("\n[TEST 9] Completion with valid evidence: in_progress -> completed");
  const proofUrl = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop";
  const t9 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: proofUrl,
    workerNotes: "Subgrade backfilled with crushed stone, aggregate compacted, hot mix bitumen rolled flush with grade."
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t9.status} | Task Status: ${t9.data?.data?.task?.status} | Incident Status: ${t9.data?.data?.incidentStatus} | PASS: ${t9.status === 200}`);
  if (t9.status !== 200 || t9.data?.data?.task?.status !== 'completed') throw new Error("TEST 9 Failed");

  // Check that incident is awaiting_verification and team is STILL dispatched
  const dbIncT9 = await prisma.incident.findUnique({ where: { id: incId } });
  const dbTeamT9 = await prisma.fieldTeam.findUnique({ where: { id: teamAlphaId } });
  console.log(`Incident in awaiting_verification: ${dbIncT9.status === 'awaiting_verification'} | Team remains dispatched: ${dbTeamT9.status === 'dispatched'}`);
  if (dbIncT9.status !== 'awaiting_verification' || dbTeamT9.status !== 'dispatched') throw new Error("TEST 9 Verification Failed");

  // TEST 10: Multi-task synchronization
  console.log("\n[TEST 10] Multi-task synchronization test");
  const multiIncId = `CP-MULTI-${timestamp}`;
  await prisma.incident.create({
    data: {
      id: multiIncId,
      title: "Dual-Team Complex Utility Failure",
      category: "Water Leakage",
      priority: "critical",
      priorityScore: 88,
      priorityReason: "Water flooding electrical vault",
      status: "in_progress",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Crossroad 4, Sector 1",
      zone: "Sector 1"
    }
  });

  const task1 = await prisma.fieldTask.create({
    data: {
      id: `TSK-M1-${timestamp}`,
      incidentId: multiIncId,
      teamId: teamAlphaId,
      workerName: workerA.name,
      assignedWorkerId: workerA.id,
      status: "in_progress",
      instructions: "Repair high pressure water line",
      siteAddress: "Crossroad 4",
      latitude: 21.1702,
      longitude: 72.8311
    }
  });

  const task2 = await prisma.fieldTask.create({
    data: {
      id: `TSK-M2-${timestamp}`,
      incidentId: multiIncId,
      teamId: teamAlphaId,
      workerName: workerA.name,
      assignedWorkerId: workerA.id,
      status: "in_progress",
      instructions: "Inspect and seal electrical vault conduit",
      siteAddress: "Crossroad 4",
      latitude: 21.1702,
      longitude: 72.8311
    }
  });

  // Complete Task 1 only
  const mRes1 = await request({ ...base, path: `/api/tasks/${task1.id}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: proofUrl,
    workerNotes: "Water line valve replaced and leak sealed."
  }, workerAAuth.sessionCookie);

  const multiIncAfterTask1 = await prisma.incident.findUnique({ where: { id: multiIncId } });
  console.log(`After Task 1 completed (Task 2 still in_progress): Incident Status = '${multiIncAfterTask1.status}' (Must NOT be awaiting_verification) | PASS: ${multiIncAfterTask1.status === 'in_progress'}`);
  if (multiIncAfterTask1.status !== "in_progress") throw new Error("TEST 10 Scenario A Failed: Incident moved to awaiting_verification prematurely!");

  // Now complete Task 2
  const mRes2 = await request({ ...base, path: `/api/tasks/${task2.id}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: proofUrl,
    workerNotes: "Electrical vault conduit drained, dried, and hermetically sealed."
  }, workerAAuth.sessionCookie);

  const multiIncAfterTask2 = await prisma.incident.findUnique({ where: { id: multiIncId } });
  console.log(`After BOTH Task 1 & Task 2 completed: Incident Status = '${multiIncAfterTask2.status}' (Must be awaiting_verification) | PASS: ${multiIncAfterTask2.status === 'awaiting_verification'}`);
  if (multiIncAfterTask2.status !== "awaiting_verification") throw new Error("TEST 10 Scenario B Failed: Incident did not move to awaiting_verification!");

  // TEST 11: Worker attempts verification (Expected 403)
  console.log("\n[TEST 11] Worker attempts verification on CP-AUDIT (Expected 403)");
  const t11 = await request({ ...base, path: `/api/incidents/${incId}/verify`, method: 'POST' }, {
    decision: "approve",
    notes: "Worker trying to verify self"
  }, workerAAuth.sessionCookie);
  console.log(`Status: ${t11.status} | Error: '${t11.data?.error}' | PASS: ${t11.status === 403}`);
  if (t11.status !== 403) throw new Error("TEST 11 Failed: Expected 403");

  // TEST 12: Operator approves verification
  console.log("\n[TEST 12] Operator approves verification");
  const t12 = await request({ ...base, path: `/api/incidents/${incId}/verify`, method: 'POST' }, {
    decision: "approve",
    notes: "Photographic inspection satisfactory. Pavement compaction density and asphalt grade meet municipal specifications."
  }, opsAuth.sessionCookie);
  console.log(`Status: ${t12.status} | Incident Status: ${t12.data?.data?.incident?.status} | Team Status: ${t12.data?.data?.team?.status} | PASS: ${t12.status === 200}`);
  if (t12.status !== 200) throw new Error("TEST 12 Failed");

  // TEST 13: Incident resolved
  console.log("\n[TEST 13] Verify Incident status in Database");
  const finalInc = await prisma.incident.findUnique({ where: { id: incId }, include: { timelineEvents: true, evidence: true } });
  console.log(`DB Incident Status: ${finalInc.status} (Expected: resolved) | PASS: ${finalInc.status === 'resolved'}`);
  if (finalInc.status !== 'resolved') throw new Error("TEST 13 Failed");

  // TEST 14: Team released
  console.log("\n[TEST 14] Verify Field Team released in Database");
  const finalTeam = await prisma.fieldTeam.findUnique({ where: { id: teamAlphaId } });
  console.log(`DB Team Status: ${finalTeam.status} | Active Incident: ${finalTeam.activeIncidentId} | PASS: ${finalTeam.status === 'available' && finalTeam.activeIncidentId === null}`);
  if (finalTeam.status !== 'available' || finalTeam.activeIncidentId !== null) throw new Error("TEST 14 Failed");

  // TEST 15: Timeline integrity
  console.log("\n[TEST 15] Timeline integrity verification");
  console.log(`Total Timeline Events: ${finalInc.timelineEvents.length}`);
  const eventTypes = finalInc.timelineEvents.map(e => e.type);
  console.log("Timeline Event Sequence in DB:", eventTypes);
  const requiredTypes = ["team_assigned", "task_en_route", "worker_arrived", "work_started", "evidence_uploaded", "pending_verification", "resolved"];
  const allFound = requiredTypes.every(t => eventTypes.includes(t));
  console.log(`All 7 lifecycle milestone events present: ${allFound} | PASS: ${allFound}`);
  if (!allFound) throw new Error("TEST 15 Failed: Missing lifecycle events");

  // TEST 16: Concurrency double request
  console.log("\n[TEST 16] Concurrency double request safety");
  const concIncId = `CP-CONC-${timestamp}`;
  await prisma.incident.create({
    data: {
      id: concIncId,
      title: "Concurrency Verification Incident",
      category: "Road Hazard",
      priority: "high",
      priorityScore: 70,
      priorityReason: "Concurrency testing",
      status: "under_review",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Concurrency Ave, Sector 1",
      zone: "Sector 1"
    }
  });

  const concAssign = await request({ ...base, path: `/api/incidents/${concIncId}/assign`, method: 'POST' }, {
    teamId: teamAlphaId,
    instructions: "Double-click test task"
  }, opsAuth.sessionCookie);
  const concTaskId = concAssign.data?.data?.task?.id;

  console.log(`Sending rapid double requests for task ${concTaskId}...`);
  const p1 = request({ ...base, path: `/api/tasks/${concTaskId}/status`, method: 'PATCH' }, { status: "en_route" }, workerAAuth.sessionCookie);
  await new Promise(r => setTimeout(r, 40));
  const p2 = request({ ...base, path: `/api/tasks/${concTaskId}/status`, method: 'PATCH' }, { status: "en_route" }, workerAAuth.sessionCookie);

  const [res1, res2] = await Promise.all([p1, p2]);
  console.log(`Req 1: ${res1.status}, Req 2: ${res2.status}`);
  const concStatuses = [res1.status, res2.status];
  const passedConcurrency = concStatuses.includes(200) && concStatuses.includes(409);
  console.log(`Exactly one 200 and one 409: ${passedConcurrency}`);

  const concIncInDb = await prisma.incident.findUnique({ where: { id: concIncId }, include: { timelineEvents: true } });
  const enRouteEvents = concIncInDb.timelineEvents.filter(e => e.type === "task_en_route");
  console.log(`'task_en_route' timeline events in DB: ${enRouteEvents.length} (Expected: exactly 1) | PASS: ${enRouteEvents.length === 1}`);
  if (!passedConcurrency || enRouteEvents.length !== 1) throw new Error("TEST 16 Failed");

  console.log("\n================================================================================");
  console.log("ALL 16 ARCHITECTURAL AUDIT & WORKFLOW TESTS PASSED 100%!");
  console.log("================================================================================");
}

runComprehensiveAuditTests().catch(err => {
  console.error("\nAUDIT TEST FAILED:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});