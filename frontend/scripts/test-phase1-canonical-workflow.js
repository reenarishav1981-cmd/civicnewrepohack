/**
 * CivicPulse — Phase 1 Operational Workflow Master Verification Suite
 * Tests end-to-end canonical flow through real HTTP API and Database:
 * 1. Report 1 submission -> New Canonical Incident created with status 'new' and isNewIncident: true
 * 2. Report 2 submission nearby -> Fused into existing canonical incident cluster (isNewIncident: false)
 * 3. Priority queue check -> Incident visible in operational queue
 * 4. Operator dispatch -> Explicit team-gamma & worker usr-w-6 assignment
 *    - Worker availability locked (isAvailable: false)
 *    - Reports synchronized to 'assigned'
 * 5. Worker task isolation -> Scoped strictly to assigned worker usr-w-6
 * 6. Worker lifecycle progression -> en_route -> arrived -> in_progress -> completed
 *    - Strict evidence gate enforced on 'completed' (rejects missing photo/notes)
 *    - Reports synchronized to 'in_progress' and 'awaiting_verification'
 * 7. Operator verification gate -> Approve resolves incident, releases team & worker (isAvailable: true)
 *    - Reports synchronized to 'resolved'
 *    - Task marked 'verified'
 * 8. Public tracking check -> Report reflects resolved status
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function httpRequest(options, data, cookie) {
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runPhase1WorkflowTest() {
  console.log("================================================================================");
  console.log("CIVICPULSE — PHASE 1 OPERATIONAL WORKFLOW FULL-STACK VERIFICATION");
  console.log("================================================================================");

  const timestamp = Date.now().toString().slice(-4);
  const randLatOffset = 0.3000 + Math.random() * 0.4000;
  const randLngOffset = 0.3000 + Math.random() * 0.4000;
  const testLat = Math.round((21.0000 + randLatOffset) * 10000) / 10000;
  const testLng = Math.round((72.0000 + randLngOffset) * 10000) / 10000;
  const testAddress = `Sector 11 Power Substation Feeder Pillar [Run-${timestamp}]`;

  // Ensure test team and worker are available before starting
  await prisma.user.update({ where: { id: "usr-w-6" }, data: { isAvailable: true } });
  await prisma.fieldTeam.update({ where: { id: "team-gamma" }, data: { status: "available", activeIncidentId: null } });

  // ---------------------------------------------------------------------------
  // 1. SUBMIT REPORT 1 (Fresh Location -> New Canonical Incident)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 1] Submitting First Citizen Signal...");
  const rep1Res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST'
  }, {
    description: `Multiple streetlight poles flickering violently with heavy sparks near ${testAddress}. Danger to night traffic.`,
    category: "Streetlight & Power",
    latitude: testLat,
    longitude: testLng,
    address: testAddress,
    userName: "Nikhil Joshi",
    userPhone: "+91 98221 11223",
    source: "production"
  });

  assert(rep1Res.status === 200 && rep1Res.data.success, "Signal 1 accepted with HTTP 200");
  const report1 = rep1Res.data.data.report;
  const incident1 = rep1Res.data.data.incident;
  assert(rep1Res.data.data.isNewIncident === true, "Signal 1 formed NEW canonical incident");
  assert(incident1.status === "new", `Canonical incident initialized in 'new' status (got: ${incident1.status})`);
  console.log(` -> Formed Canonical Incident: ${incident1.id}, Report: ${report1.id}`);

  // ---------------------------------------------------------------------------
  // 2. SUBMIT REPORT 2 (Nearby Location -> Correlation Merger)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 2] Submitting Second Citizen Signal (Nearby)...");
  const rep2Res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST'
  }, {
    description: `Feeder box arcing and streetlights completely blacked out outside substation gate on main avenue.`,
    category: "Streetlight & Power",
    latitude: testLat + 0.0002,
    longitude: testLng + 0.0001,
    address: testAddress,
    userName: "Kavita Patel",
    userPhone: "+91 98445 66778",
    source: "production"
  });

  assert(rep2Res.status === 200 && rep2Res.data.success, "Signal 2 accepted with HTTP 200");
  const report2 = rep2Res.data.data.report;
  assert(rep2Res.data.data.isNewIncident === false, "Signal 2 recognized as multi-signal observation (isNewIncident: false)");
  assert(rep2Res.data.data.connectedIncidentId === incident1.id, `Signal 2 merged into canonical incident ${incident1.id}`);
  console.log(` -> Correlated Report: ${report2.id} into Incident: ${incident1.id}`);

  // ---------------------------------------------------------------------------
  // 3. OPERATOR LOGIN & QUEUE INSPECTION
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 3] Operator Authentication & Queue Verification...");
  const opLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'ops.lead@civicpulse.gov.in', password: 'CivicPulse2026!' });

  assert(opLogin.status === 200 && !!opLogin.sessionCookie, "Operator login successful with session cookie");
  const operatorCookie = opLogin.sessionCookie;

  // Verify incident exists in operational queue
  const queueRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents',
    method: 'GET'
  }, null, operatorCookie);

  assert(queueRes.status === 200, "Fetched operational queue with HTTP 200");
  const incidentsList = Array.isArray(queueRes.data.data) ? queueRes.data.data : (queueRes.data.data?.incidents || []);
  const foundInQueue = incidentsList.find(i => i.id === incident1.id);
  assert(!!foundInQueue, `Canonical incident ${incident1.id} present in operational queue`);
  assert(foundInQueue.connectedReportsCount >= 2, `Incident reflects connected signal constellation count (${foundInQueue?.connectedReportsCount})`);

  // ---------------------------------------------------------------------------
  // 4. OPERATOR DISPATCH (Assign Team Gamma + Worker usr-w-6 Ramesh Tiwari)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 4] Operational Response Dispatch with Relational Worker...");
  // Confirm worker usr-w-6 initial state
  const workerBefore = await prisma.user.findUnique({ where: { id: "usr-w-6" } });
  assert(workerBefore.isAvailable === true, "Worker usr-w-6 initially available in roster");

  const assignRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${incident1.id}/assign`,
    method: 'POST'
  }, {
    teamId: 'team-gamma',
    workerId: 'usr-w-6',
    instructions: 'Isolate feeder switchgear and replace burned fuses immediately.'
  }, operatorCookie);

  assert(assignRes.status === 200 && assignRes.data.success, "Squad dispatch executed successfully");
  const assignedInc = assignRes.data.data.incident;
  assert(assignedInc.status === "assigned", `Incident status transitioned to 'assigned' (got: ${assignedInc.status})`);
  assert(assignedInc.assignedWorkerId === "usr-w-6", `Assigned worker ID is 'usr-w-6' (got: ${assignedInc.assignedWorkerId})`);
  assert(assignedInc.assignedWorkerName === "Ramesh Tiwari", `Assigned worker Name is 'Ramesh Tiwari' (got: ${assignedInc.assignedWorkerName})`);

  // DB Verification: Worker availability locked
  const workerAfter = await prisma.user.findUnique({ where: { id: "usr-w-6" } });
  assert(workerAfter.isAvailable === false, "Worker availability locked in database (isAvailable: false)");

  // DB Verification: Connected reports updated to 'assigned'
  const dbReportsAssigned = await prisma.citizenReport.findMany({ where: { incidentId: incident1.id } });
  assert(dbReportsAssigned.every(r => r.status === "assigned"), "All connected reports synchronized to 'assigned' status");
  const createdTaskId = assignRes.data.data.task.id;
  console.log(` -> Created Field Task: ${createdTaskId} for worker Ramesh Tiwari`);

  // ---------------------------------------------------------------------------
  // 5. WORKER AUTHENTICATION & TASK RETRIEVAL
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 5] Worker Authentication & Task Scoping...");
  const workerLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'ramesh.worker@civicpulse.gov.in', password: 'CivicPulse2026!' });

  assert(workerLogin.status === 200 && !!workerLogin.sessionCookie, "Worker Ramesh Tiwari authenticated with session cookie");
  const workerCookie = workerLogin.sessionCookie;

  // Worker task fetch
  const myTasksRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks?myTasks=true',
    method: 'GET'
  }, null, workerCookie);

  assert(myTasksRes.status === 200 && myTasksRes.data.success, "Worker fetched tasks with HTTP 200");
  const myTask = myTasksRes.data.data.find(t => t.id === createdTaskId);
  assert(!!myTask, `Worker received assigned task ${createdTaskId} in personal queue`);
  assert(myTask.assignedWorkerId === "usr-w-6", "Task assignedWorkerId matches worker identity");

  // ---------------------------------------------------------------------------
  // 6. FIELD EXECUTION PROGRESSION & EVIDENCE GATE
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 6] Field Execution Lifecycle & Quality Gate...");

  // 6a. en_route
  const enRouteRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${createdTaskId}/status`,
    method: 'PATCH'
  }, { status: 'en_route' }, workerCookie);
  assert(enRouteRes.status === 200, "Worker advanced to EN_ROUTE");

  // 6b. arrived
  const arrivedRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${createdTaskId}/status`,
    method: 'PATCH'
  }, { status: 'arrived' }, workerCookie);
  assert(arrivedRes.status === 200, "Worker advanced to ARRIVED");

  // 6c. in_progress
  const inProgressRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${createdTaskId}/status`,
    method: 'PATCH'
  }, {
    status: 'in_progress',
    workerNotes: 'Switchgear opened; replacing fried 63A fuses.'
  }, workerCookie);
  assert(inProgressRes.status === 200, "Worker advanced to IN_PROGRESS");

  // Check DB: citizen reports synchronized to in_progress
  const dbReportsInProgress = await prisma.citizenReport.findMany({ where: { incidentId: incident1.id } });
  assert(dbReportsInProgress.every(r => r.status === "in_progress"), "Connected citizen reports synchronized to 'in_progress'");

  // 6d. completed - NEGATIVE TEST: Missing Evidence
  const badCompleteRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${createdTaskId}/status`,
    method: 'PATCH'
  }, {
    status: 'completed',
    workerNotes: '' // missing photo and notes
  }, workerCookie);
  assert(badCompleteRes.status === 422, "Evidence Gate REJECTS completion without photographic proof (HTTP 422)");

  // 6e. completed - POSITIVE TEST: With valid proof
  const goodCompleteRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${createdTaskId}/status`,
    method: 'PATCH'
  }, {
    status: 'completed',
    workerNotes: 'Replaced charred 63A fuses with ceramic link fuses. Streetlights tested and fully operational.',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'
  }, workerCookie);
  assert(goodCompleteRes.status === 200, "Evidence Gate ACCEPTS completion with valid photographic proof");

  // Check DB: incident and reports synchronized to awaiting_verification
  const incAfterComplete = await prisma.incident.findUnique({ where: { id: incident1.id } });
  assert(incAfterComplete.status === "awaiting_verification", "Incident status transitioned to 'awaiting_verification'");
  const dbReportsAwaiting = await prisma.citizenReport.findMany({ where: { incidentId: incident1.id } });
  assert(dbReportsAwaiting.every(r => r.status === "awaiting_verification"), "Connected citizen reports synchronized to 'awaiting_verification'");

  // ---------------------------------------------------------------------------
  // 7. OPERATOR VERIFICATION & SQUAD RELEASE GATE
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 7] Operational Verification & Resource Release Gate...");
  const verifyRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${incident1.id}/verify`,
    method: 'POST'
  }, {
    decision: 'approve',
    notes: 'After-repair photo verified. Streetlight illumination and load stability confirmed.'
  }, operatorCookie);

  assert(verifyRes.status === 200 && verifyRes.data.success, "Operator verification approved successfully");

  // Check DB: Incident status is resolved
  const incResolved = await prisma.incident.findUnique({ where: { id: incident1.id } });
  assert(incResolved.status === "resolved", "Incident status successfully transitioned to 'resolved'");

  // Check DB: Team status is available
  const teamGammaAfter = await prisma.fieldTeam.findUnique({ where: { id: "team-gamma" } });
  assert(teamGammaAfter.status === "available", "Field Team Gamma returned to 'available' pool");

  // Check DB: Worker isAvailable is true (RELEASED!)
  const workerReleased = await prisma.user.findUnique({ where: { id: "usr-w-6" } });
  assert(workerReleased.isAvailable === true, "Designated worker usr-w-6 released back to active pool (isAvailable: true)");

  // Check DB: Field task marked verified
  const taskVerified = await prisma.fieldTask.findUnique({ where: { id: createdTaskId } });
  assert(taskVerified.status === "verified", "Field task order permanently stamped 'verified'");

  // Check DB: Connected reports resolved
  const dbReportsResolved = await prisma.citizenReport.findMany({ where: { incidentId: incident1.id } });
  assert(dbReportsResolved.every(r => r.status === "resolved"), "All connected citizen reports updated to 'resolved'");

  // ---------------------------------------------------------------------------
  // 8. PUBLIC TRACKING ROUTE VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n[TEST STAGE 8] Public Citizen Tracking Integrity...");
  const trackRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/track/${report1.id}`,
    method: 'GET'
  });

  assert(trackRes.status === 200, "Public tracking endpoint returned HTTP 200");
  const trackData = trackRes.data.incident || trackRes.data.data;
  assert(trackData?.isResolved === true || trackData?.statusCode === "resolved", `Public tracking reflects canonical resolution status (publicStatus: ${trackData?.status}, isResolved: ${trackData?.isResolved})`);

  console.log("\n================================================================================");
  console.log("🎉 ALL PHASE 1 OPERATIONAL WORKFLOW VERIFICATION CHECKS PASSED WITH ZERO ERRORS!");
  console.log("================================================================================");
}

runPhase1WorkflowTest()
  .catch((err) => {
    console.error("\n❌ SUITE EXECUTION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
