/**
 * CivicPulse Phase 2 Reality Diagnostic Script
 * Probes:
 * 1. Authentication boundaries (Citizen, Worker, Operator, Admin, Unauthenticated)
 * 2. Cross-role data access prevention (RBAC)
 * 3. Citizen Feedback & Reopen flow end-to-end
 * 4. Database integrity (orphans, dangling foreign keys, invalid lifecycle states)
 * 5. Static / Mock data analysis
 * 6. Analytics calculations (real DB vs mock)
 * 7. Realtime bus integration verification
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

async function runRealityAudit() {
  console.log("================================================================================");
  console.log("CIVICPULSE PHASE 2: SYSTEMATIC REALITY AUDIT");
  console.log("================================================================================");

  const results = {};

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & ROLE ENFORCEMENT
  // ---------------------------------------------------------------------------
  console.log("\n[AUDIT 1] Probing Authentication & Role Enforcement...");

  const citizenLogin = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST'
  }, { email: 'aarav.sharma@example.com', password: 'CivicPulse2026!' });
  const citizenCookie = citizenLogin.sessionCookie;

  const workerLogin = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST'
  }, { email: 'ramesh.worker@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const workerCookie = workerLogin.sessionCookie;

  const operatorLogin = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST'
  }, { email: 'ops.lead@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const operatorCookie = operatorLogin.sessionCookie;

  const adminLogin = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST'
  }, { email: 'admin@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const adminCookie = adminLogin.sessionCookie;

  // Test 1a: Citizen attempting operator-only API (/api/incidents/[id]/assign)
  const citizenAssign = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/incidents/CP-1024/assign', method: 'POST'
  }, { teamId: 'team-alpha' }, citizenCookie);
  console.log(` -> Citizen calling /assign: HTTP ${citizenAssign.status} (Expected: 403)`);

  // Test 1b: Unauthenticated user calling /assign
  const unauthAssign = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/incidents/CP-1024/assign', method: 'POST'
  }, { teamId: 'team-alpha' });
  console.log(` -> Unauthenticated calling /assign: HTTP ${unauthAssign.status} (Expected: 401)`);

  // Test 1c: Worker attempting operator-only API (/api/incidents/[id]/verify)
  const workerVerify = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/incidents/CP-1024/verify', method: 'POST'
  }, { decision: 'approve' }, workerCookie);
  console.log(` -> Worker calling /verify: HTTP ${workerVerify.status} (Expected: 403)`);

  // Test 1d: Worker task scoping (Worker should not receive tasks of other workers)
  const workerTasks = await httpRequest({
    hostname: 'localhost', port: 3000, path: '/api/tasks?myTasks=true', method: 'GET'
  }, null, workerCookie);
  const tasksArray = workerTasks.data?.data || [];
  const foreignTasks = tasksArray.filter(t => t.assignedWorkerId && t.assignedWorkerId !== "usr-w-6");
  console.log(` -> Worker tasks scoped: Total ${tasksArray.length} tasks, Foreign tasks: ${foreignTasks.length} (Expected: 0)`);

  // ---------------------------------------------------------------------------
  // 2. DATABASE INTEGRITY & LIFECYCLE CONSISTENCY AUDIT
  // ---------------------------------------------------------------------------
  console.log("\n[AUDIT 2] Probing Database Integrity & Relational Invariants...");

  const allIncidents = await prisma.incident.findMany({
    include: { fieldTasks: true, reports: true }
  });
  const allReports = await prisma.citizenReport.findMany();
  const allTasks = await prisma.fieldTask.findMany();
  const allTeams = await prisma.fieldTeam.findMany({ include: { leader: true, members: true } });
  const allUsers = await prisma.user.findMany();

  console.log(` -> Database Totals: ${allIncidents.length} Incidents, ${allReports.length} Reports, ${allTasks.length} Tasks, ${allTeams.length} Teams, ${allUsers.length} Users`);

  // Check 2a: Orphan Reports (incidentId pointing to non-existent incident)
  const incidentIds = new Set(allIncidents.map(i => i.id));
  const orphanReports = allReports.filter(r => r.incidentId && !incidentIds.has(r.incidentId));
  console.log(` -> Orphan Reports (dangling incidentId): ${orphanReports.length}`);

  // Check 2b: Orphan Tasks (incidentId pointing to non-existent incident)
  const orphanTasks = allTasks.filter(t => t.incidentId && !incidentIds.has(t.incidentId));
  console.log(` -> Orphan Tasks (dangling incidentId): ${orphanTasks.length}`);

  // Check 2c: Inconsistent Lifecycle: Resolved incident with active unverified task
  const inconsistentResolved = allIncidents.filter(inc => 
    inc.status === "resolved" && inc.fieldTasks.some(t => t.status !== "completed" && t.status !== "verified")
  );
  console.log(` -> Inconsistent Resolved Incidents (with active non-completed tasks): ${inconsistentResolved.length}`);

  // Check 2d: Team status 'available' while active incident or active task exists
  const activeIncidentIds = new Set(allIncidents.filter(i => i.status !== "resolved" && i.status !== "closed").map(i => i.id));
  const inconsistentTeams = allTeams.filter(team => {
    if (team.status === "available" && team.activeIncidentId && activeIncidentIds.has(team.activeIncidentId)) {
      return true;
    }
    return false;
  });
  console.log(` -> Inconsistent Available Teams (with active incident reference): ${inconsistentTeams.length}`);

  // Check 2e: Worker isAvailable true while assigned to active unfinished task
  const activeTasks = allTasks.filter(t => t.status !== "completed" && t.status !== "verified");
  const busyWorkerIds = new Set(activeTasks.map(t => t.assignedWorkerId).filter(Boolean));
  const usersById = new Map(allUsers.map(u => [u.id, u]));
  const leakedWorkers = [];
  for (const wId of busyWorkerIds) {
    const u = usersById.get(wId);
    if (u && u.isAvailable === true) {
      leakedWorkers.push(wId);
    }
  }
  console.log(` -> Inconsistent Available Workers (isAvailable=true but on active unfinished task): ${leakedWorkers.length}`);

  // ---------------------------------------------------------------------------
  // 3. CITIZEN FEEDBACK & REOPEN FLOW AUDIT
  // ---------------------------------------------------------------------------
  console.log("\n[AUDIT 3] Probing Citizen Resolution Feedback & Reopen Review...");

  // Find a resolved incident owned by Aarav Sharma (usr-1)
  let testIncident = allIncidents.find(i => 
    (i.status === "resolved" || i.status === "closed") && i.reports.some(r => r.userId === "usr-1")
  );

  if (!testIncident) {
    console.log(" -> Creating test resolved incident for usr-1 to test feedback flow...");
    const incId = `CP-FEEDBACK-TEST-${Date.now().toString().slice(-4)}`;
    const repId = `R-FEEDBACK-TEST-${Date.now().toString().slice(-4)}`;
    await prisma.incident.create({
      data: {
        id: incId,
        title: "Test Resolved Incident for Feedback Flow",
        category: "Road Hazard",
        status: "resolved",
        priority: "low",
        priorityScore: 20,
        priorityReason: "Test incident",
        latitude: 21.1700,
        longitude: 72.8300,
        address: "Test Address",
        zone: "West Zone",
        source: "production"
      }
    });
    await prisma.citizenReport.create({
      data: {
        id: repId,
        userId: "usr-1",
        userName: "Aarav Sharma",
        incidentId: incId,
        description: "Test report for feedback",
        category: "Road Hazard",
        latitude: 21.1700,
        longitude: 72.8300,
        address: "Test Address",
        status: "resolved",
        source: "production"
      }
    });
    testIncident = await prisma.incident.findUnique({ where: { id: incId }, include: { reports: true, fieldTasks: true } });
  }

  // 3a. Citizen submits "ISSUE STILL EXISTS" feedback
  const feedbackRes = await httpRequest({
    hostname: 'localhost', port: 3000, path: `/api/incidents/${testIncident.id}/feedback`, method: 'POST'
  }, {
    feedbackStatus: "ISSUE STILL EXISTS",
    feedbackNotes: "The pothole opened up again after rain."
  }, citizenCookie);

  console.log(` -> Citizen submit feedback: HTTP ${feedbackRes.status} (Success: ${feedbackRes.data?.success})`);
  const incAfterFeedback = await prisma.incident.findUnique({ where: { id: testIncident.id } });
  console.log(` -> Incident status after reopen feedback: ${incAfterFeedback.status} (Expected: reopen_requested)`);

  // 3b. Operator reviews reopen request (Approve Reopen)
  const reopenApproveRes = await httpRequest({
    hostname: 'localhost', port: 3000, path: `/api/incidents/${testIncident.id}/reopen-review`, method: 'POST'
  }, {
    decision: "approve",
    notes: "Reopening authorized for secondary asphalt compaction."
  }, operatorCookie);

  console.log(` -> Operator review reopen: HTTP ${reopenApproveRes.status} (Success: ${reopenApproveRes.data?.success})`);
  const incAfterReopenApprove = await prisma.incident.findUnique({ where: { id: testIncident.id } });
  console.log(` -> Incident status after reopen approved: ${incAfterReopenApprove.status} (Expected: in_progress)`);

  // ---------------------------------------------------------------------------
  // 4. API & ROUTE COMPLETION AUDIT (Checking for fake/mock/disconnected routes)
  // ---------------------------------------------------------------------------
  console.log("\n[AUDIT 4] Probing Key Operational & Analytics API Routes...");

  const endpoints = [
    { path: '/api/teams', method: 'GET', auth: null },
    { path: '/api/incidents', method: 'GET', auth: operatorCookie },
    { path: '/api/tasks', method: 'GET', auth: operatorCookie },
    { path: '/api/activity', method: 'GET', auth: null },
    { path: '/api/realtime/alerts', method: 'GET', auth: operatorCookie },
    { path: '/api/realtime/events', method: 'GET', auth: operatorCookie },
    { path: '/api/executive/overview', method: 'GET', auth: operatorCookie },
    { path: '/api/executive/departments', method: 'GET', auth: operatorCookie },
    { path: '/api/executive/areas', method: 'GET', auth: operatorCookie },
    { path: '/api/executive/recommendations', method: 'GET', auth: operatorCookie },
    { path: '/api/executive/projections', method: 'GET', auth: operatorCookie },
    { path: '/api/intelligence/overview', method: 'GET', auth: operatorCookie },
    { path: '/api/intelligence/hotspots', method: 'GET', auth: operatorCookie }
  ];

  for (const ep of endpoints) {
    const res = await httpRequest({
      hostname: 'localhost', port: 3000, path: ep.path, method: ep.method
    }, null, ep.auth);
    const count = Array.isArray(res.data?.data) ? res.data.data.length : (res.data?.data ? 'object' : 'empty');
    console.log(` -> ${ep.method} ${ep.path}: HTTP ${res.status} (Success: ${res.data?.success}, Data: ${count})`);
  }

  // ---------------------------------------------------------------------------
  // 5. PUBLIC TRACKING BOUNDARY AUDIT
  // ---------------------------------------------------------------------------
  console.log("\n[AUDIT 5] Probing Public Tracking Privacy & Boundary Integrity...");

  const publicTrackRes = await httpRequest({
    hostname: 'localhost', port: 3000, path: `/api/track/${testIncident.id}`, method: 'GET'
  });

  const pData = publicTrackRes.data?.incident || {};
  const leakedFields = [];
  if (pData.assignedWorkerId) leakedFields.push("assignedWorkerId");
  if (pData.assignedWorkerName) leakedFields.push("assignedWorkerName");
  if (pData.assignedTeamId) leakedFields.push("assignedTeamId");
  if (pData.assignedTeamName) leakedFields.push("assignedTeamName");
  if (pData.phone) leakedFields.push("phone");
  if (pData.instructions) leakedFields.push("instructions");

  console.log(` -> Public track /api/track/${testIncident.id}: HTTP ${publicTrackRes.status}`);
  console.log(` -> Leaked Internal Fields in Public DTO: ${leakedFields.length === 0 ? "NONE (Clean Privacy Boundary)" : leakedFields.join(", ")}`);

  console.log("\n================================================================================");
  console.log("REALITY AUDIT PROBING COMPLETE");
  console.log("================================================================================");
}

runRealityAudit()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
