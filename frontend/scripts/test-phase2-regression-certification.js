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
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runCertificationSuite() {
  console.log('='.repeat(80));
  console.log('CIVICPULSE — PHASE 2.1 FINAL REGRESSION CERTIFICATION SUITE');
  console.log('='.repeat(80));

  const runId = Math.floor(1000 + Math.random() * 9000);

  // SCENARIO 4: AUTHORIZATION ATTACKS
  console.log('\n[TEST SCENARIO 4] Probing Authorization Attacks & RBAC Boundaries...');

  const unauthDispatch = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/assign',
    method: 'POST'
  }, { teamId: 'team-alpha', workerId: 'usr-4' });
  assert(unauthDispatch.status === 401, `Unauthenticated dispatch returns HTTP 401 (Got: ${unauthDispatch.status})`);

  const citizenLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'citizen@civicpulse.gov.in', password: 'CivicPulse2026!' });
  assert(citizenLogin.status === 200, `Citizen login succeeded (usr-1)`);
  const citizenCookie = citizenLogin.sessionCookie;

  const citizenDispatch = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/assign',
    method: 'POST'
  }, { teamId: 'team-alpha', workerId: 'usr-4' }, citizenCookie);
  assert(citizenDispatch.status === 401 || citizenDispatch.status === 403, `Citizen dispatch rejected with 401/403 (Got: ${citizenDispatch.status})`);

  const workerLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'manoj.worker@civicpulse.gov.in', password: 'CivicPulse2026!' });
  assert(workerLogin.status === 200, `Worker login succeeded (usr-w-5)`);
  const workerCookie = workerLogin.sessionCookie;

  const workerVerify = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/verify',
    method: 'POST'
  }, { decision: 'approve', notes: 'Unauthorized worker verification' }, workerCookie);
  assert(workerVerify.status === 403, `Worker verify rejected with HTTP 403 (Got: ${workerVerify.status})`);

  const workerTaskList = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks',
    method: 'GET'
  }, null, workerCookie);
  assert(workerTaskList.status === 200, `Worker fetched task list with HTTP 200`);
  const foreignTasks = (workerTaskList.data.data || []).filter(t => t.assignedWorkerId && t.assignedWorkerId !== 'usr-w-5');
  assert(foreignTasks.length === 0, `Worker task scoping strictly isolated: 0 foreign tasks exposed`);

  // SCENARIO 1 & 3: COMPLETE CIVIC JOURNEY + CAMERA BASE64 EVIDENCE
  console.log('\n[TEST SCENARIO 1 & 3] Complete Civic Journey + Real Base64 Camera Evidence...');

  const testBase64Photo = 'data:image/jpeg;base64,' + Buffer.from(`REAL_CAMERA_IMAGE_PAYLOAD_${runId}`).toString('base64');
  const reportPayload = {
    description: `Hazardous collapsed culvert and street crater on Ring Road [Run-${runId}]`,
    category: 'Road Hazard',
    latitude: 21.1850,
    longitude: 72.8450,
    address: `Ring Road Section ${runId}, Near Flyover Pillar 14`,
    mediaUrl: testBase64Photo,
    forceNewIncident: true
  };

  const createReportRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST'
  }, reportPayload, citizenCookie);

  assert(createReportRes.status === 200, `Report submission accepted (HTTP 200)`);
  const createdReport = createReportRes.data.data.report;
  const createdIncident = createReportRes.data.data.incident;
  assert(createdReport.id.startsWith('R-'), `Generated Citizen Report Tracking ID: ${createdReport.id}`);
  assert(createdIncident.id.startsWith('CP-'), `Bound to Canonical Incident: ${createdIncident.id}`);
  assert(createdReport.userId === 'usr-1', `Report userId bound to citizen usr-1`);

  const dbReport = await prisma.citizenReport.findUnique({ where: { id: createdReport.id } });
  assert(dbReport.mediaUrl === testBase64Photo, `Citizen evidence persisted as full Base64 Data URL in database`);

  const operatorLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'ops.lead@civicpulse.gov.in', password: 'CivicPulse2026!' });
  assert(operatorLogin.status === 200, `Operator authenticated (usr-3)`);
  const operatorCookie = operatorLogin.sessionCookie;

  await prisma.user.update({ where: { id: 'usr-w-1' }, data: { isAvailable: true } });
  await prisma.fieldTeam.update({ where: { id: 'team-alpha' }, data: { status: 'available' } });

  const dispatchRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${createdIncident.id}/assign`,
    method: 'POST'
  }, {
    teamId: 'team-alpha',
    workerId: 'usr-w-1',
    instructions: 'High priority culvert restoration. Secure perimeter immediately.'
  }, operatorCookie);

  assert(dispatchRes.status === 200, `Dispatch squad transaction succeeded (HTTP 200)`);
  const dispatchedTask = dispatchRes.data.data.task;

  const dbWorkerLocked = await prisma.user.findUnique({ where: { id: 'usr-w-1' } });
  assert(dbWorkerLocked.isAvailable === false, `Worker usr-w-1 availability LOCKED in DB (isAvailable: false)`);

  const workerAmitLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'amit.worker@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const workerAmitCookie = workerAmitLogin.sessionCookie;

  // Progression: assigned -> en_route -> arrived -> in_progress -> completed
  const enRouteRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${dispatchedTask.id}/status`,
    method: 'PATCH'
  }, { status: 'en_route' }, workerAmitCookie);
  assert(enRouteRes.status === 200, `Worker advanced to EN_ROUTE`);

  const arrivedRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${dispatchedTask.id}/status`,
    method: 'PATCH'
  }, { status: 'arrived' }, workerAmitCookie);
  assert(arrivedRes.status === 200, `Worker advanced to ARRIVED`);

  const inProgRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${dispatchedTask.id}/status`,
    method: 'PATCH'
  }, { status: 'in_progress', workerNotes: 'Excavation and culvert reinforcement initiated.' }, workerAmitCookie);
  assert(inProgRes.status === 200, `Worker started repairs (IN_PROGRESS)`);

  const workerCameraProof = 'data:image/jpeg;base64,' + Buffer.from(`WORKER_RESTORED_SITE_PROOF_${runId}`).toString('base64');
  const compRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${dispatchedTask.id}/status`,
    method: 'PATCH'
  }, {
    status: 'completed',
    afterPhotoUrl: workerCameraProof,
    workerNotes: 'Culvert structurally reinforced, high-grade asphalt compacted, perimeter barriers cleared.'
  }, workerAmitCookie);
  assert(compRes.status === 200, `Worker submitted Base64 camera proof and completed task (HTTP 200)`);

  const dbTaskReload = await prisma.fieldTask.findUnique({ where: { id: dispatchedTask.id } });
  assert(dbTaskReload.afterPhotoUrl === workerCameraProof, `Worker Base64 proof persisted in FieldTask.afterPhotoUrl`);

  const verifyRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${createdIncident.id}/verify`,
    method: 'POST'
  }, {
    decision: 'approve',
    notes: 'Supervisory inspection approved. Photographic proof verifies high-quality restoration.'
  }, operatorCookie);
  assert(verifyRes.status === 200, `Operator verified and approved incident closure (HTTP 200)`);

  const dbWorkerReleased = await prisma.user.findUnique({ where: { id: 'usr-w-1' } });
  assert(dbWorkerReleased.isAvailable === true, `Worker usr-w-1 released back to pool (isAvailable: true)`);

  const publicTrack = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/track/${createdReport.id}`,
    method: 'GET'
  });
  assert(publicTrack.status === 200, `Public tracking by Report ID ${createdReport.id} succeeded`);
  assert(publicTrack.data.incident.isResolved === true, `Public tracking indicates isResolved: true`);
  assert(publicTrack.data.incident.evidence.afterPhotoUrl === workerCameraProof, `Public tracking displays verified after-work camera proof`);

  const feedbackRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${createdIncident.id}/feedback`,
    method: 'POST'
  }, {
    feedbackStatus: 'RESOLVED SUCCESSFULLY',
    feedbackNotes: 'Verified in person. Excellent and prompt repair work by municipal crew!'
  }, citizenCookie);
  assert(feedbackRes.status === 200, `Citizen confirmed satisfactory resolution (HTTP 200)`);

  // SCENARIO 2: REOPENING WORKFLOW
  console.log('\n[TEST SCENARIO 2] Citizen Reopening Workflow & Operator Decision...');

  const reopenReportPayload = {
    description: `Leaking drainage junction flooding crossroad [Run-${runId}-Reopen]`,
    category: 'Water Leakage',
    latitude: 21.1780,
    longitude: 72.8350,
    address: `Drainage Crossing Sector ${runId}`,
    forceNewIncident: true
  };

  const reopenReportRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST'
  }, reopenReportPayload, citizenCookie);

  const reopenIncidentId = reopenReportRes.data.data.incident.id;
  await prisma.incident.update({ where: { id: reopenIncidentId }, data: { status: 'resolved' } });

  const reopenFeedbackRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${reopenIncidentId}/feedback`,
    method: 'POST'
  }, {
    feedbackStatus: 'ISSUE STILL EXISTS',
    feedbackNotes: 'Water is still accumulating on corner pavement.'
  }, citizenCookie);
  assert(reopenFeedbackRes.status === 200, `Citizen submitted reopen request feedback (HTTP 200)`);
  assert(reopenFeedbackRes.data.data.incident.status === 'reopen_requested', `Incident status moved to 'reopen_requested'`);

  const reopenApproveRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${reopenIncidentId}/reopen-review`,
    method: 'POST'
  }, { decision: 'approve', notes: 'Reopening approved for remediation.' }, operatorCookie);
  assert(reopenApproveRes.status === 200, `Operator approved reopening request (HTTP 200)`);
  assert(reopenApproveRes.data.data.incident.status === 'in_progress', `Incident returned to 'in_progress'`);

  await prisma.incident.update({ where: { id: reopenIncidentId }, data: { status: 'reopen_requested' } });
  const reopenRejectRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/incidents/${reopenIncidentId}/reopen-review`,
    method: 'POST'
  }, { decision: 'reject', notes: 'Residual surface ponding within tolerance.' }, operatorCookie);
  assert(reopenRejectRes.status === 200, `Operator rejected reopening request (HTTP 200)`);
  assert(reopenRejectRes.data.data.incident.status === 'resolved', `Incident returned to 'resolved'`);

  // SCENARIO 5: DATABASE CONSISTENCY
  console.log('\n[TEST SCENARIO 5] Probing Database Consistency & Relational Invariants...');

  const allReports = await prisma.citizenReport.findMany();
  const allIncidents = await prisma.incident.findMany();
  const allTasks = await prisma.fieldTask.findMany();
  const allUsers = await prisma.user.findMany();
  const incIdSet = new Set(allIncidents.map(i => i.id));

  const orphanReports = allReports.filter(r => r.incidentId && !incIdSet.has(r.incidentId));
  assert(orphanReports.length === 0, `Zero orphan CitizenReports`);

  const orphanTasks = allTasks.filter(t => !incIdSet.has(t.incidentId));
  assert(orphanTasks.length === 0, `Zero orphan FieldTasks`);

  const activeTasks = allTasks.filter(t => ['assigned', 'en_route', 'arrived', 'in_progress'].includes(t.status));
  const workerTaskCounts = {};
  for (const t of activeTasks) {
    if (t.assignedWorkerId) {
      workerTaskCounts[t.assignedWorkerId] = (workerTaskCounts[t.assignedWorkerId] || 0) + 1;
    }
  }
  const multiAssignedWorkers = Object.entries(workerTaskCounts).filter(([wId, count]) => count > 1);
  assert(multiAssignedWorkers.length === 0, `Zero worker concurrency conflicts`);

  const activeWorkerIds = new Set(activeTasks.map(t => t.assignedWorkerId).filter(Boolean));
  const availableWorkersOnActiveTask = allUsers.filter(u => u.isAvailable === true && activeWorkerIds.has(u.id));
  assert(availableWorkersOnActiveTask.length === 0, `Zero available workers on active task`);

  console.log('\n' + '='.repeat(80));
  console.log('🎉 PHASE 2.1 FINAL REGRESSION CERTIFICATION SUITE: 100% PASSED');
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

runCertificationSuite().catch(err => {
  console.error('Certification failed:', err);
  process.exit(1);
});
