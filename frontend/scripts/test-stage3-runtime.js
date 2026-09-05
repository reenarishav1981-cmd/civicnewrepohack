const http = require('http');

async function testStage3Runtime() {
  console.log("=== RUNNING STAGE 3.1 RUNTIME INTEGRATION & ATOMICITY TESTS ===");

  let operatorCookie = null;

  function request(options, data) {
    return new Promise((resolve, reject) => {
      const headers = { ...(options.headers || {}) };
      if (operatorCookie) headers['Cookie'] = operatorCookie;
      const req = http.request({ ...options, headers }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const setCookieHeader = res.headers['set-cookie'];
          if (setCookieHeader) {
            for (const c of setCookieHeader) {
              if (c.startsWith('civicpulse_session=')) {
                operatorCookie = c.split(';')[0];
                break;
              }
            }
          }
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      });
      req.on('error', reject);
      if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
      req.end();
    });
  }

  // Authenticate as Operator to execute operational assignments
  await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'ops.lead@civicpulse.gov.in', password: 'CivicPulse2026!' });

  // 1. Test 404 on Invalid Incident ID
  console.log("\n[TEST 1] Testing 404 on non-existent Incident ID...");
  const notFoundRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-INVALID-999',
    method: 'GET'
  });
  console.log(`Status: ${notFoundRes.status}, Error: ${notFoundRes.data?.error}`);
  if (notFoundRes.status !== 404 || notFoundRes.data?.success !== false) {
    throw new Error(`Expected 404 for invalid incident, received ${notFoundRes.status}`);
  }

  // 2. Test Invalid Status Transition Rejection on Seed Task TSK-501 (Status is 'in_progress')
  // Valid next transition for 'in_progress' is 'completed'. Attempting 'assigned' or 'en_route' is an ILLEGAL backward transition!
  console.log("\n[TEST 2] Testing Invalid Status Transition Rejection on TSK-501 (in_progress -> assigned)...");
  const invalidBackwardRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks/TSK-501/status',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "assigned" });
  console.log(`Status: ${invalidBackwardRes.status}, Error: ${invalidBackwardRes.data?.error}`);
  if (invalidBackwardRes.status !== 409 || invalidBackwardRes.data?.success !== false) {
    throw new Error(`Expected 409 Conflict for invalid transition on TSK-501, received ${invalidBackwardRes.status}`);
  }

  // 3. Test Assignment Atomic Workflow
  console.log("\n[TEST 3] Testing Atomic Team Assignment for CP-1033 with team-delta...");
  const assignRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1033/assign',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { teamId: "team-delta", instructions: "Urgent power line diagnosis on flyover." });
  console.log(`Status: ${assignRes.status}, Success: ${assignRes.data?.success}`);
  console.log(`Assigned Incident Status: ${assignRes.data?.data?.incident?.status}, Created Task: ${assignRes.data?.data?.task?.id}`);
  if (assignRes.status !== 200 || !assignRes.data?.success) throw new Error("Atomic team assignment failed");

  const newTaskId = assignRes.data?.data?.task?.id;

  // 4. Test Duplicate Assignment Request on Same Incident & Team (Must Reject or Guard)
  console.log(`\n[TEST 4] Testing Duplicate Assignment Request (CP-1033 with team-delta)...`);
  const duplicateAssignRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1033/assign',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { teamId: "team-delta", instructions: "Duplicate dispatch attempt." });
  console.log(`Status: ${duplicateAssignRes.status}, Error: ${duplicateAssignRes.data?.error}`);
  if (duplicateAssignRes.status !== 400 && duplicateAssignRes.status !== 409) {
    throw new Error(`Expected 400 or 409 for duplicate team dispatch, received ${duplicateAssignRes.status}`);
  }

  // 5. Test Invalid Transition on New Assigned Task: assigned -> completed (MUST FAIL with 409)
  console.log(`\n[TEST 5] Testing Invalid Transition on ${newTaskId}: assigned -> completed (Must be rejected with 409)...`);
  const illegalJumpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${newTaskId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "completed" });
  console.log(`Status: ${illegalJumpRes.status}, Error: ${illegalJumpRes.data?.error}`);
  if (illegalJumpRes.status !== 409 || illegalJumpRes.data?.success !== false) {
    throw new Error(`Expected 409 Conflict for illegal jump, got ${illegalJumpRes.status}`);
  }

  // 6. Test Step-by-Step Valid Progression: assigned -> en_route
  console.log(`\n[TEST 6] Testing Valid Step 1: assigned -> en_route...`);
  const step1Res = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${newTaskId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "en_route" });
  console.log(`Status: ${step1Res.status}, New Status: ${step1Res.data?.data?.task?.status}`);
  if (step1Res.status !== 200 || step1Res.data?.data?.task?.status !== 'en_route') throw new Error("Step 1 failed");

  // 7. Test Step-by-Step Valid Progression: en_route -> arrived
  console.log(`\n[TEST 7] Testing Valid Step 2: en_route -> arrived...`);
  const step2Res = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${newTaskId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "arrived" });
  console.log(`Status: ${step2Res.status}, New Status: ${step2Res.data?.data?.task?.status}`);
  if (step2Res.status !== 200 || step2Res.data?.data?.task?.status !== 'arrived') throw new Error("Step 2 failed");

  // 8. Test Step-by-Step Valid Progression: arrived -> in_progress
  console.log(`\n[TEST 8] Testing Valid Step 3: arrived -> in_progress...`);
  const step3Res = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${newTaskId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "in_progress", workerNotes: "Safety cordon established, starting repair." });
  console.log(`Status: ${step3Res.status}, New Status: ${step3Res.data?.data?.task?.status}`);
  if (step3Res.status !== 200 || step3Res.data?.data?.task?.status !== 'in_progress') throw new Error("Step 3 failed");

  // 9. Test Step-by-Step Valid Progression: in_progress -> completed
  console.log(`\n[TEST 9] Testing Valid Step 4: in_progress -> completed...`);
  const step4Res = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${newTaskId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "completed", workerNotes: "Repair fully executed and tested." });
  console.log(`Status: ${step4Res.status}, New Status: ${step4Res.data?.data?.task?.status}`);
  if (step4Res.status !== 200 || step4Res.data?.data?.task?.status !== 'completed') throw new Error("Step 4 failed");

  // 10. Test Atomic Report Intake Submission
  console.log("\n[TEST 10] Testing Atomic Report Intake via POST /api/reports...");
  const reportRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    description: "Massive sinkhole opened near Ring Road bridge junction. Cars avoiding it.",
    category: "Road Hazard",
    latitude: 21.1820,
    longitude: 72.8210,
    address: "Ring Road Bridge, Sector 5",
    userName: "Vivek Sharma",
    userPhone: "+91 99887 76655"
  });
  console.log(`Status: ${reportRes.status}, Success: ${reportRes.data?.success}`);
  console.log(`Report ID: ${reportRes.data?.data?.report?.id}, Connected Incident: ${reportRes.data?.data?.connectedIncidentId}`);
  if (reportRes.status !== 200 || !reportRes.data?.success) throw new Error("Report intake failed");

  console.log("\n=== ALL STAGE 3.1 RUNTIME INTEGRATION & ATOMICITY TESTS PASSED ===");
}

testStage3Runtime().catch(err => {
  console.error("Stage 3.1 runtime test failed:", err);
  process.exit(1);
});
