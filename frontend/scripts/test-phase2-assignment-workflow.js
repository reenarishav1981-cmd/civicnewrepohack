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

async function runPhase2Tests() {
  console.log("===============================================================");
  console.log("CIVICPULSE — PHASE 2: REAL OPERATIONS -> FIELD WORKFLOW TESTS");
  console.log("===============================================================");

  const base = { hostname: 'localhost', port: 3000 };
  const password = "CivicPulse2026!";
  const hash = await bcrypt.hash(password, 10);

  // 1. Ensure test personas exist in DB
  const workerBEmail = `worker.b.phase2.${Date.now()}@civicpulse.gov.in`;
  const workerB = await prisma.user.create({
    data: {
      name: "Suresh Unassigned",
      email: workerBEmail,
      role: "worker",
      passwordHash: hash
    }
  });

  // Ensure Manoj Verma (leader of team-gamma) exists as a worker so assignedWorkerId resolves
  let manoj = await prisma.user.findFirst({ where: { name: "Manoj Verma", role: "worker" } });
  if (!manoj) {
    manoj = await prisma.user.create({
      data: {
        name: "Manoj Verma",
        email: "manoj.verma@civicpulse.gov.in",
        phone: "+91 98110 55443",
        role: "worker",
        passwordHash: hash
      }
    });
  }

  // Reset team-gamma to available for deterministic testing
  await prisma.fieldTeam.update({
    where: { id: "team-gamma" },
    data: { status: "available", activeIncidentId: null }
  });

  // Create a clean test incident
  const testIncId = `CP-P2-${Date.now().toString().slice(-4)}`;
  const testIncident = await prisma.incident.create({
    data: {
      id: testIncId,
      title: "Broken Main Transformer & Street Grid Outage",
      category: "Streetlight & Power",
      priority: "high",
      priorityScore: 78,
      priorityReason: "High priority power grid rupture in Sector 1",
      status: "under_review",
      latitude: 21.1825,
      longitude: 72.8395,
      address: "Substation 4, Power Grid Lane, Sector 1",
      zone: "Sector 1",
      aiConfidence: 0.95
    }
  });
  console.log(`[SETUP] Created test incident ${testIncId}`);

  // 2. Authenticate Personas
  console.log("\n[AUTH] Authenticating Personas...");
  const opsAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "ops.lead@civicpulse.gov.in",
    password
  });
  const manojAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "manoj.verma@civicpulse.gov.in",
    password
  });
  const workerBAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: workerBEmail,
    password
  });
  const citAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "citizen@civicpulse.gov.in",
    password
  });

  if (!opsAuth.sessionCookie) throw new Error("Failed to auth Operator");
  if (!manojAuth.sessionCookie) throw new Error("Failed to auth Manoj Verma");
  if (!workerBAuth.sessionCookie) throw new Error("Failed to auth Worker B");
  if (!citAuth.sessionCookie) throw new Error("Failed to auth Citizen");
  console.log("✓ Operator, Manoj Verma (Team Gamma Lead), Worker B, and Citizen authenticated.");

  // TEST 1: Unauthorized Dispatch Rejection
  console.log("\n--- TEST 1: Unauthorized Dispatch Protection ---");
  const unauthDispatch = await request({ ...base, path: `/api/incidents/${testIncId}/assign`, method: 'POST' }, { teamId: "team-gamma" });
  console.log(`[TEST 1A] Unauthenticated: status=${unauthDispatch.status} (Expected: 401)`);
  if (unauthDispatch.status !== 401) throw new Error("Expected 401");

  const citDispatch = await request({ ...base, path: `/api/incidents/${testIncId}/assign`, method: 'POST' }, { teamId: "team-gamma" }, citAuth.sessionCookie);
  console.log(`[TEST 1B] Citizen: status=${citDispatch.status}, error='${citDispatch.data?.error}' (Expected: 403)`);
  if (citDispatch.status !== 403) throw new Error("Expected 403");

  const wrkDispatch = await request({ ...base, path: `/api/incidents/${testIncId}/assign`, method: 'POST' }, { teamId: "team-gamma" }, workerBAuth.sessionCookie);
  console.log(`[TEST 1C] Worker: status=${wrkDispatch.status}, error='${wrkDispatch.data?.error}' (Expected: 403)`);
  if (wrkDispatch.status !== 403) throw new Error("Expected 403");
  console.log("✓ PASS: Non-operators strictly blocked from dispatching.");

  // TEST 2: Operator Real Atomic Assignment
  console.log("\n--- TEST 2: Operator Dispatches Available Team (Atomic Transaction) ---");
  const dispatchRes = await request({ ...base, path: `/api/incidents/${testIncId}/assign`, method: 'POST' }, {
    teamId: "team-gamma",
    instructions: "Isolate damaged high-voltage transformer and replace burnt fuses."
  }, opsAuth.sessionCookie);

  console.log(`Status: ${dispatchRes.status}, Success: ${dispatchRes.data?.success}`);
  if (dispatchRes.status !== 200 || !dispatchRes.data?.success) {
    throw new Error(`Dispatch failed: ${JSON.stringify(dispatchRes.data)}`);
  }

  const createdTask = dispatchRes.data.data?.task;
  console.log(`Created Task ID: ${createdTask?.id}`);
  console.log(`Assigned Worker ID: ${createdTask?.assignedWorkerId}`);
  console.log(`Worker Name: ${createdTask?.workerName}`);
  console.log(`Team ID: ${createdTask?.teamId}`);

  if (!createdTask?.id || !createdTask.id.startsWith("TSK-")) throw new Error("Invalid Task ID");
  if (createdTask.assignedWorkerId !== manoj.id) throw new Error(`Expected assignedWorkerId to be ${manoj.id}, got ${createdTask.assignedWorkerId}`);
  if (createdTask.status !== "assigned") throw new Error("Expected task status 'assigned'");
  console.log("✓ PASS: Task created with immutable assignedWorkerId.");

  // TEST 3: Database State Verification
  console.log("\n--- TEST 3: Direct Database Relational State Verification ---");
  const dbInc = await prisma.incident.findUnique({ where: { id: testIncId }, include: { timelineEvents: true, fieldTasks: true } });
  const dbTeam = await prisma.fieldTeam.findUnique({ where: { id: "team-gamma" } });
  const dbTask = await prisma.fieldTask.findUnique({ where: { id: createdTask.id } });

  console.log(`DB Incident Status: ${dbInc.status}, Assigned Team: ${dbInc.assignedTeamId}`);
  console.log(`DB Team Status: ${dbTeam.status}, Active Incident: ${dbTeam.activeIncidentId}`);
  console.log(`DB Task Status: ${dbTask.status}, Assigned Worker: ${dbTask.assignedWorkerId}`);
  console.log(`DB Timeline Events Count: ${dbInc.timelineEvents.length}`);

  if (dbInc.status !== "assigned" || dbInc.assignedTeamId !== "team-gamma") throw new Error("DB Incident state incorrect");
  if (dbTeam.status !== "dispatched" || dbTeam.activeIncidentId !== testIncId) throw new Error("DB FieldTeam state incorrect");
  if (dbTask.assignedWorkerId !== manoj.id) throw new Error("DB Task assignedWorkerId mismatch");
  if (!dbInc.timelineEvents.some(e => e.type === "team_assigned")) throw new Error("Missing timeline event for assignment");
  console.log("✓ PASS: All database records synchronized atomically.");

  // TEST 4: Duplicate Assignment Rejection
  console.log("\n--- TEST 4: Duplicate Assignment Prevention (Team is Dispatched) ---");
  const dupRes = await request({ ...base, path: `/api/incidents/${testIncId}/assign`, method: 'POST' }, {
    teamId: "team-gamma"
  }, opsAuth.sessionCookie);

  console.log(`Status: ${dupRes.status}, Error: '${dupRes.data?.error}' (Expected: 409)`);
  if (dupRes.status !== 409) throw new Error("Expected 409 Conflict when team is already dispatched");
  console.log("✓ PASS: Duplicate dispatch prevented.");

  // TEST 5: Worker Scoped Task Fetching (Data Isolation)
  console.log("\n--- TEST 5: Worker Task Data Isolation (/api/tasks?myTasks=true) ---");
  const manojTasksRes = await request({ ...base, path: '/api/tasks?myTasks=true', method: 'GET' }, null, manojAuth.sessionCookie);
  const workerBTasksRes = await request({ ...base, path: '/api/tasks?myTasks=true', method: 'GET' }, null, workerBAuth.sessionCookie);

  console.log(`Manoj Tasks Count: ${manojTasksRes.data?.count}`);
  console.log(`Worker B Tasks Count: ${workerBTasksRes.data?.count}`);

  const manojHasTask = (manojTasksRes.data?.data || []).some(t => t.id === createdTask.id);
  const workerBHasTask = (workerBTasksRes.data?.data || []).some(t => t.id === createdTask.id);

  if (!manojHasTask) throw new Error("Manoj should see his assigned task");
  if (workerBHasTask) throw new Error("Worker B must NOT see Manoj's task");
  console.log("✓ PASS: Assigned worker sees their task; unrelated worker sees 0 of those tasks.");

  // TEST 6: Task Ownership Guard on Mutation
  console.log("\n--- TEST 6: Worker Ownership Guard on Status Mutation ---");
  const workerBUpdate = await request({ ...base, path: `/api/tasks/${createdTask.id}/status`, method: 'PATCH' }, {
    status: "en_route"
  }, workerBAuth.sessionCookie);

  console.log(`Worker B Mutation Status: ${workerBUpdate.status}, Error: '${workerBUpdate.data?.error}' (Expected: 403)`);
  if (workerBUpdate.status !== 403) throw new Error("Expected 403 Forbidden for unauthorized worker");

  const manojUpdate = await request({ ...base, path: `/api/tasks/${createdTask.id}/status`, method: 'PATCH' }, {
    status: "en_route"
  }, manojAuth.sessionCookie);

  console.log(`Manoj Mutation Status: ${manojUpdate.status}, New Status: '${manojUpdate.data?.data?.task?.status}' (Expected: 200)`);
  if (manojUpdate.status !== 200 || manojUpdate.data?.data?.task?.status !== "en_route") {
    throw new Error("Expected 200 OK for authorized assigned worker");
  }
  console.log("✓ PASS: Task status transition strictly governed by immutable worker ID.");

  console.log("\n===============================================================");
  console.log("ALL PHASE 2 OPERATIONS -> FIELD ASSIGNMENT TESTS PASSED 100%!");
  console.log("===============================================================");
}

runPhase2Tests().catch(err => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});