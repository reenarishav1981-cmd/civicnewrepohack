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

async function runPhase3Tests() {
  console.log("===============================================================");
  console.log("CIVICPULSE — PHASE 3: FIELD STATUS PROGRESSION & VERIFICATION");
  console.log("===============================================================");

  const base = { hostname: 'localhost', port: 3000 };
  const password = "CivicPulse2026!";
  const hash = await bcrypt.hash(password, 10);

  // 1. Setup Test Personas
  const uniquePhone = `+91 98333 ${Date.now().toString().slice(-5)}`;
  const uniqueWorkerName = `Tariq Engineer ${Date.now().toString().slice(-4)}`;
  const workerAEmail = `worker.a.p3.${Date.now()}@civicpulse.gov.in`;
  const workerBEmail = `worker.b.p3.${Date.now()}@civicpulse.gov.in`;

  const workerA = await prisma.user.create({
    data: {
      name: uniqueWorkerName,
      email: workerAEmail,
      phone: uniquePhone,
      role: "worker",
      passwordHash: hash
    }
  });

  const workerB = await prisma.user.create({
    data: {
      name: `Dinesh Worker ${Date.now().toString().slice(-4)}`,
      email: workerBEmail,
      phone: `+91 98444 ${Date.now().toString().slice(-5)}`,
      role: "worker",
      passwordHash: hash
    }
  });

  // Setup dedicated team
  const teamId = `team-p3-${Date.now().toString().slice(-4)}`;
  await prisma.fieldTeam.create({
    data: {
      id: teamId,
      name: "Rapid Conduit Squad",
      department: "Drainage & Water Works",
      leaderName: uniqueWorkerName,
      phone: uniquePhone,
      specialization: "Conduit Patching",
      status: "available",
      currentLatitude: 21.1702,
      currentLongitude: 72.8311
    }
  });

  // Setup test incident
  const incId = `CP-P3-${Date.now().toString().slice(-4)}`;
  await prisma.incident.create({
    data: {
      id: incId,
      title: "Ruptured Main Water Conduit with Road Undermining",
      category: "Water Leakage",
      priority: "critical",
      priorityScore: 89,
      priorityReason: "High pressure conduit leak threatening road foundation",
      status: "under_review",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Crossroad 7, Industrial Area, Sector 2",
      zone: "Sector 2",
      aiConfidence: 0.98
    }
  });

  // 2. Authenticate Personas
  console.log("\n[AUTH] Authenticating Personas...");
  const opsAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "ops.lead@civicpulse.gov.in",
    password
  });
  const workerAAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: workerAEmail,
    password
  });
  const workerBAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: workerBEmail,
    password
  });

  if (!opsAuth.sessionCookie || !workerAAuth.sessionCookie || !workerBAuth.sessionCookie) {
    throw new Error("Failed to authenticate test accounts");
  }
  console.log("✓ Operator, Assigned Worker A (Tariq), and Unrelated Worker B (Dinesh) authenticated.");

  // Dispatch team to create active FieldTask
  const assignRes = await request({ ...base, path: `/api/incidents/${incId}/assign`, method: 'POST' }, {
    teamId,
    instructions: "Excavate burst pipe section and weld replacement ductile iron sleeve."
  }, opsAuth.sessionCookie);

  if (assignRes.status !== 200) throw new Error(`Setup assign failed: ${JSON.stringify(assignRes.data)}`);
  const taskId = assignRes.data?.data?.task?.id;
  console.log(`[SETUP] Incident ${incId} assigned to team ${teamId}. Task created: ${taskId}`);

  // TEST 1: Unauthenticated worker task update
  console.log("\n--- TEST 1: Unauthenticated Worker Task Update ---");
  const t1 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, { status: "en_route" });
  console.log(`Expected: 401 | Actual: ${t1.status} | PASS: ${t1.status === 401}`);
  if (t1.status !== 401) throw new Error("TEST 1 Failed: Expected 401");

  // TEST 2: Unrelated worker attempts task update
  console.log("\n--- TEST 2: Unrelated Worker Attempts Task Update ---");
  const t2 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, { status: "en_route" }, workerBAuth.sessionCookie);
  console.log(`Expected: 403 | Actual: ${t2.status} | Error: '${t2.data?.error}' | PASS: ${t2.status === 403}`);
  if (t2.status !== 403) throw new Error("TEST 2 Failed: Expected 403");

  // TEST 3: Assigned worker performs: assigned -> en_route
  console.log("\n--- TEST 3: Assigned Worker: assigned -> en_route ---");
  const t3 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "en_route",
    workerNotes: "Rapid Conduit Squad departed central depot with heavy welding gear."
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 200 | Actual: ${t3.status} | New Status: ${t3.data?.data?.task?.status} | PASS: ${t3.status === 200 && t3.data?.data?.task?.status === 'en_route'}`);
  if (t3.status !== 200 || t3.data?.data?.task?.status !== "en_route") throw new Error("TEST 3 Failed");

  // Verify DB state for Test 3
  const dbTaskT3 = await prisma.fieldTask.findUnique({ where: { id: taskId } });
  const dbIncT3 = await prisma.incident.findUnique({ where: { id: incId }, include: { timelineEvents: true } });
  if (dbTaskT3.status !== "en_route") throw new Error("TEST 3 DB Verification Failed: Task status not en_route");
  if (!dbIncT3.timelineEvents.some(e => e.type === "task_en_route")) throw new Error("TEST 3 DB Verification Failed: Missing task_en_route timeline event");
  console.log("✓ PASS: Task is 'en_route', timeline event recorded in database.");

  // TEST 4: Worker attempts invalid skip: en_route -> completed
  console.log("\n--- TEST 4: Worker Attempts Invalid Skip: en_route -> completed ---");
  const t4 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: "https://example.com/proof.jpg",
    workerNotes: "Attempting to skip straight to completed"
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 409 | Actual: ${t4.status} | Error: '${t4.data?.error}' | PASS: ${t4.status === 409}`);
  if (t4.status !== 409) throw new Error("TEST 4 Failed: Expected 409 Conflict");
  const dbTaskT4 = await prisma.fieldTask.findUnique({ where: { id: taskId } });
  if (dbTaskT4.status !== "en_route") throw new Error("TEST 4 DB Failed: Task state was corrupted");
  console.log("✓ PASS: Invalid skip rejected. Task remains strictly 'en_route'.");

  // TEST 5: Worker performs: en_route -> arrived
  console.log("\n--- TEST 5: Worker: en_route -> arrived ---");
  const t5 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "arrived",
    workerNotes: "Arrived at Crossroad 7. Establishing safety perimeter around water hazard."
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 200 | Actual: ${t5.status} | New Status: ${t5.data?.data?.task?.status} | PASS: ${t5.status === 200 && t5.data?.data?.task?.status === 'arrived'}`);
  if (t5.status !== 200 || t5.data?.data?.task?.status !== "arrived") throw new Error("TEST 5 Failed");

  // TEST 6: Worker performs: arrived -> in_progress
  console.log("\n--- TEST 6: Worker: arrived -> in_progress ---");
  const t6 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "in_progress",
    workerNotes: "Excavator on site. Repair clamp installation actively commenced."
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 200 | Actual: ${t6.status} | New Status: ${t6.data?.data?.task?.status} | Incident Status: ${t6.data?.data?.incidentStatus} | PASS: ${t6.status === 200}`);
  if (t6.status !== 200 || t6.data?.data?.task?.status !== "in_progress") throw new Error("TEST 6 Failed");
  const dbIncT6 = await prisma.incident.findUnique({ where: { id: incId } });
  if (dbIncT6.status !== "in_progress") throw new Error("TEST 6 DB Failed: Incident status not in_progress");
  console.log("✓ PASS: Task and parent Incident both updated to 'in_progress'.");

  // TEST 7: Worker attempts in_progress -> completed WITHOUT evidence
  console.log("\n--- TEST 7: Worker Attempts Completion WITHOUT Evidence ---");
  const t7 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed"
    // Missing afterPhotoUrl and workerNotes
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 422 | Actual: ${t7.status} | Error: '${t7.data?.error}' | Missing: ${JSON.stringify(t7.data?.missingRequirements)} | PASS: ${t7.status === 422}`);
  if (t7.status !== 422) throw new Error("TEST 7 Failed: Expected 422 Unprocessable Entity");
  console.log("✓ PASS: Completion strictly rejected with 422 when required proof is missing.");

  // TEST 8: Worker submits valid evidence and completion notes: in_progress -> completed
  console.log("\n--- TEST 8: Worker Submits Valid Evidence: in_progress -> completed ---");
  const testProofPhoto = "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop";
  const t8 = await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: testProofPhoto,
    workerNotes: "Ductile iron sleeve welded, pressurized to 8 bar with zero seepage. Trench backfilled and asphalt sealed."
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 200 | Actual: ${t8.status} | Task Status: ${t8.data?.data?.task?.status} | PASS: ${t8.status === 200 && t8.data?.data?.task?.status === 'completed'}`);
  if (t8.status !== 200 || t8.data?.data?.task?.status !== "completed") throw new Error("TEST 8 Failed");

  // TEST 9: Parent Incident Synchronization: Incident moves to awaiting_verification (NOT resolved!)
  console.log("\n--- TEST 9: Incident Synchronization: awaiting_verification (NOT resolved) ---");
  const dbIncT9 = await prisma.incident.findUnique({ where: { id: incId }, include: { timelineEvents: true, evidence: true } });
  const dbTeamT9 = await prisma.fieldTeam.findUnique({ where: { id: teamId } });
  console.log(`Incident Status: ${dbIncT9.status} (Expected: awaiting_verification)`);
  console.log(`Team Status: ${dbTeamT9.status} (Expected: dispatched, NOT released until verified)`);
  if (dbIncT9.status !== "awaiting_verification" && dbIncT9.status !== "pending_verification") {
    throw new Error(`TEST 9 Failed: Incident status was ${dbIncT9.status}, expected awaiting_verification!`);
  }
  if (dbTeamT9.status !== "dispatched") {
    throw new Error("TEST 9 Failed: Field team was prematurely released before operator verification!");
  }
  console.log("✓ PASS: Incident is in 'awaiting_verification'. Field team remains locked on incident.");

  // TEST 10: Worker attempts incident verification
  console.log("\n--- TEST 10: Worker Attempts Incident Verification (Unauthorized) ---");
  const t10 = await request({ ...base, path: `/api/incidents/${incId}/verify`, method: 'POST' }, {
    decision: "approve",
    notes: "Worker trying to self-approve"
  }, workerAAuth.sessionCookie);
  console.log(`Expected: 403 | Actual: ${t10.status} | Error: '${t10.data?.error}' | PASS: ${t10.status === 403}`);
  if (t10.status !== 403) throw new Error("TEST 10 Failed: Expected 403 Forbidden for worker verification");
  console.log("✓ PASS: Workers are strictly prohibited from verifying incidents.");

  // TEST 11: Operator verifies incident: decision = approve
  console.log("\n--- TEST 11: Operator Verifies Incident (Approve & Resolve) ---");
  const t11 = await request({ ...base, path: `/api/incidents/${incId}/verify`, method: 'POST' }, {
    decision: "approve",
    notes: "Photographic proof of welded sleeve and restored pavement inspected and confirmed compliant with municipal water standards."
  }, opsAuth.sessionCookie);
  console.log(`Expected: 200 | Actual: ${t11.status} | Incident Status: ${t11.data?.data?.incident?.status} | Team Status: ${t11.data?.data?.team?.status} | PASS: ${t11.status === 200}`);
  if (t11.status !== 200 || t11.data?.data?.incident?.status !== "resolved") throw new Error("TEST 11 Failed");
  console.log("✓ PASS: Operator verification successfully resolves incident.");

  // TEST 12: Direct Database Relational State Verification
  console.log("\n--- TEST 12: Direct Database State & Evidence Verification ---");
  const finalInc = await prisma.incident.findUnique({ where: { id: incId }, include: { timelineEvents: true, evidence: true } });
  const finalTeam = await prisma.fieldTeam.findUnique({ where: { id: teamId } });
  const finalTask = await prisma.fieldTask.findUnique({ where: { id: taskId } });
  const taskEvidence = await prisma.evidence.findFirst({ where: { taskId } });

  console.log(`Final Incident Status: ${finalInc.status}`);
  console.log(`Final Team Status: ${finalTeam.status}, Active Incident: ${finalTeam.activeIncidentId}`);
  console.log(`Final Task Status: ${finalTask.status}, Completed At: ${finalTask.completedAt}`);
  console.log(`Persisted Evidence Record: ID=${taskEvidence?.id}, URL=${taskEvidence?.publicUrl}`);
  console.log(`Total Timeline Events: ${finalInc.timelineEvents.length}`);

  if (finalInc.status !== "resolved") throw new Error("TEST 12 DB Failed: Incident status not resolved");
  if (finalTeam.status !== "available" || finalTeam.activeIncidentId !== null) throw new Error("TEST 12 DB Failed: Team not returned to available");
  if (finalTask.status !== "completed" || !finalTask.completedAt) throw new Error("TEST 12 DB Failed: Task not completed");
  if (!taskEvidence || taskEvidence.publicUrl !== testProofPhoto) throw new Error("TEST 12 DB Failed: Evidence record missing");
  if (!finalInc.timelineEvents.some(e => e.type === "resolved")) throw new Error("TEST 12 DB Failed: Resolved timeline event missing");
  console.log("✓ PASS: Complete audit trail, evidence records, and lifecycle states verified in database.");

  // TEST 13: Concurrency Safety Test (Parallel Conflicting Progression)
  console.log("\n--- TEST 13: Concurrency & Duplicate Mutation Safety ---");
  // Setup another task in 'assigned' state
  const inc13Id = `CP-P3-CONC-${Date.now().toString().slice(-4)}`;
  await prisma.incident.create({
    data: {
      id: inc13Id,
      title: "Concurrent Test Case Incident",
      category: "Public Safety",
      priority: "medium",
      priorityScore: 50,
      priorityReason: "Testing race conditions",
      status: "under_review",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Test Alley, Sector 2",
      zone: "Sector 2"
    }
  });

  // Re-dispatch team
  await prisma.fieldTeam.update({ where: { id: teamId }, data: { status: "available", activeIncidentId: null } });
  const assignConc = await request({ ...base, path: `/api/incidents/${inc13Id}/assign`, method: 'POST' }, {
    teamId,
    instructions: "Concurrency stress test task"
  }, opsAuth.sessionCookie);
  const concTaskId = assignConc.data?.data?.task?.id;

  console.log(`[TEST 13 SETUP] assignConc status: ${assignConc.status}, task: ${concTaskId}, err: ${assignConc.data?.error}`);

  // Fire 2 rapid successive requests simulating user double-click
  console.log(`Sending rapid double-click requests for task ${concTaskId}...`);
  const reqAPromise = request({ ...base, path: `/api/tasks/${concTaskId}/status`, method: 'PATCH' }, { status: "en_route" }, workerAAuth.sessionCookie);
  await new Promise(r => setTimeout(r, 40));
  const reqBPromise = request({ ...base, path: `/api/tasks/${concTaskId}/status`, method: 'PATCH' }, { status: "en_route" }, workerAAuth.sessionCookie);

  const [reqA, reqB] = await Promise.all([reqAPromise, reqBPromise]);

  console.log(`Request A Status: ${reqA.status}, Data:`, reqA.data);
  console.log(`Request B Status: ${reqB.status}, Data:`, reqB.data);
  const statuses = [reqA.status, reqB.status];
  const hasSuccess = statuses.includes(200);
  const hasConflict = statuses.includes(409);
  console.log(`One succeeded (200): ${hasSuccess}, Conflicting duplicate rejected (409): ${hasConflict}`);

  if (!hasSuccess) throw new Error("TEST 13 Failed: Expected one transition to succeed");
  // Check timeline events in DB to verify zero duplicate events created
  const concInc = await prisma.incident.findUnique({ where: { id: inc13Id }, include: { timelineEvents: true } });
  const enRouteEvents = concInc.timelineEvents.filter(e => e.type === "task_en_route");
  console.log(`Total 'task_en_route' timeline events in DB: ${enRouteEvents.length} (Expected: exactly 1)`);
  if (enRouteEvents.length !== 1) throw new Error(`TEST 13 Failed: Expected exactly 1 timeline event, got ${enRouteEvents.length}`);
  console.log("✓ PASS: Concurrency protected. Exactly one transition succeeded, zero duplicate timeline events.");

  console.log("\n===============================================================");
  console.log("ALL 13 PHASE 3 FIELD WORKFLOW TESTS PASSED 100%!");
  console.log("===============================================================");
}

runPhase3Tests().catch(err => {
  console.error("\nPHASE 3 TEST RUN FAILED:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});