const http = require('http');

async function testStage5Rbac() {
  console.log("=== RUNNING STAGE 5.2 ROUTE-LEVEL RBAC SECURITY TESTS ===\n");

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
          resolve({ status: res.statusCode, data: parsed, sessionCookie });
        });
      });
      req.on('error', reject);
      if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
      req.end();
    });
  }

  // Obtain real session cookies for:
  // 1. Citizen (citizen@civicpulse.gov.in)
  // 2. Worker (worker@civicpulse.gov.in)
  // 3. Operator (ops.lead@civicpulse.gov.in)
  console.log("[SETUP] Authenticating test accounts...");

  const citizenLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'citizen@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const citizenCookie = citizenLogin.sessionCookie;
  if (!citizenCookie) throw new Error("Failed to obtain citizen session cookie");

  const workerLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'worker@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const workerCookie = workerLogin.sessionCookie;
  if (!workerCookie) throw new Error("Failed to obtain worker session cookie");

  const operatorLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'ops.lead@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const operatorCookie = operatorLogin.sessionCookie;
  if (!operatorCookie) throw new Error("Failed to obtain operator session cookie");

  console.log("[SETUP] All 3 session cookies successfully acquired.\n");

  // ==========================================
  // ROUTE 1: POST /api/incidents/[id]/assign
  // ==========================================
  console.log("--- GROUP 1: POST /api/incidents/CP-1024/assign ---");

  // TEST 1: Unauthenticated request -> 401
  const t1 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/assign',
    method: 'POST'
  }, { teamId: 'team-alpha', instructions: 'Priority repair' });
  console.log(`[TEST 1] Unauthenticated assign: status=${t1.status} (Expected: 401)`);
  if (t1.status !== 401) throw new Error(`TEST 1 Failed: Expected 401, got ${t1.status}`);

  // TEST 2: Citizen authenticated request -> 403
  const t2 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/assign',
    method: 'POST'
  }, { teamId: 'team-alpha', instructions: 'Priority repair' }, citizenCookie);
  console.log(`[TEST 2] Citizen assign: status=${t2.status}, error='${t2.data?.error}' (Expected: 403)`);
  if (t2.status !== 403) throw new Error(`TEST 2 Failed: Expected 403, got ${t2.status}`);

  // TEST 3: Worker authenticated request -> 403
  const t3 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/assign',
    method: 'POST'
  }, { teamId: 'team-alpha', instructions: 'Priority repair' }, workerCookie);
  console.log(`[TEST 3] Worker assign: status=${t3.status}, error='${t3.data?.error}' (Expected: 403)`);
  if (t3.status !== 403) throw new Error(`TEST 3 Failed: Expected 403, got ${t3.status}`);

  // TEST 4: Operator authenticated request -> Allowed past authorization boundary
  // Status 200 (assigned) or 409 (duplicate dispatch) confirms operator passed RBAC (not 401 or 403)
  const t4 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1019/assign',
    method: 'POST'
  }, { teamId: 'team-gamma', instructions: 'Inspect electrical lines near burst' }, operatorCookie);
  console.log(`[TEST 4] Operator assign: status=${t4.status}, success=${t4.data?.success} (Expected: 200 or valid domain result)`);
  if (t4.status === 401 || t4.status === 403) throw new Error(`TEST 4 Failed: Operator was denied with ${t4.status}`);

  // ==========================================
  // ROUTE 2: PATCH /api/incidents/[id]
  // ==========================================
  console.log("\n--- GROUP 2: PATCH /api/incidents/CP-1024 ---");

  // TEST 5: Unauthenticated -> 401
  const t5 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024',
    method: 'PATCH'
  }, { priority: 'high' });
  console.log(`[TEST 5] Unauthenticated patch: status=${t5.status} (Expected: 401)`);
  if (t5.status !== 401) throw new Error(`TEST 5 Failed: Expected 401, got ${t5.status}`);

  // TEST 6: Citizen -> 403
  const t6 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024',
    method: 'PATCH'
  }, { priority: 'high' }, citizenCookie);
  console.log(`[TEST 6] Citizen patch: status=${t6.status}, error='${t6.data?.error}' (Expected: 403)`);
  if (t6.status !== 403) throw new Error(`TEST 6 Failed: Expected 403, got ${t6.status}`);

  // TEST 7: Worker -> 403
  const t7 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024',
    method: 'PATCH'
  }, { priority: 'high' }, workerCookie);
  console.log(`[TEST 7] Worker patch: status=${t7.status}, error='${t7.data?.error}' (Expected: 403)`);
  if (t7.status !== 403) throw new Error(`TEST 7 Failed: Expected 403, got ${t7.status}`);

  // TEST 8: Operator -> Success
  const t8 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024',
    method: 'PATCH'
  }, { priority: 'critical' }, operatorCookie);
  console.log(`[TEST 8] Operator patch: status=${t8.status}, success=${t8.data?.success} (Expected: 200)`);
  if (t8.status !== 200 || !t8.data?.success) throw new Error(`TEST 8 Failed: Expected 200, got ${t8.status}`);

  // ==========================================
  // ROUTE 3: GET /api/tasks
  // ==========================================
  console.log("\n--- GROUP 3: GET /api/tasks ---");

  // TEST 9: Unauthenticated -> 401
  const t9 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks',
    method: 'GET'
  });
  console.log(`[TEST 9] Unauthenticated tasks: status=${t9.status} (Expected: 401)`);
  if (t9.status !== 401) throw new Error(`TEST 9 Failed: Expected 401, got ${t9.status}`);

  // TEST 10: Citizen -> 403
  const t10 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks',
    method: 'GET'
  }, null, citizenCookie);
  console.log(`[TEST 10] Citizen tasks: status=${t10.status}, error='${t10.data?.error}' (Expected: 403)`);
  if (t10.status !== 403) throw new Error(`TEST 10 Failed: Expected 403, got ${t10.status}`);

  // TEST 11: Worker -> Success
  const t11 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks',
    method: 'GET'
  }, null, workerCookie);
  console.log(`[TEST 11] Worker tasks: status=${t11.status}, count=${t11.data?.count} (Expected: 200)`);
  if (t11.status !== 200 || !t11.data?.success) throw new Error(`TEST 11 Failed: Expected 200, got ${t11.status}`);

  // TEST 12: Operator -> Success
  const t12 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks',
    method: 'GET'
  }, null, operatorCookie);
  console.log(`[TEST 12] Operator tasks: status=${t12.status}, count=${t12.data?.count} (Expected: 200)`);
  if (t12.status !== 200 || !t12.data?.success) throw new Error(`TEST 12 Failed: Expected 200, got ${t12.status}`);

  // ==========================================
  // ROUTE 4: POST /api/simulate
  // ==========================================
  console.log("\n--- GROUP 4: POST /api/simulate ---");

  // TEST 13: Unauthenticated -> 401
  const t13 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/simulate',
    method: 'POST'
  }, { scenarioIndex: 0 });
  console.log(`[TEST 13] Unauthenticated simulate: status=${t13.status} (Expected: 401)`);
  if (t13.status !== 401) throw new Error(`TEST 13 Failed: Expected 401, got ${t13.status}`);

  // TEST 14: Citizen -> 403
  const t14 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/simulate',
    method: 'POST'
  }, { scenarioIndex: 0 }, citizenCookie);
  console.log(`[TEST 14] Citizen simulate: status=${t14.status}, error='${t14.data?.error}' (Expected: 403)`);
  if (t14.status !== 403) throw new Error(`TEST 14 Failed: Expected 403, got ${t14.status}`);

  // TEST 15: Worker -> 403
  const t15 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/simulate',
    method: 'POST'
  }, { scenarioIndex: 0 }, workerCookie);
  console.log(`[TEST 15] Worker simulate: status=${t15.status}, error='${t15.data?.error}' (Expected: 403)`);
  if (t15.status !== 403) throw new Error(`TEST 15 Failed: Expected 403, got ${t15.status}`);

  // TEST 16: Operator -> Success
  const t16 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/simulate',
    method: 'POST'
  }, { scenarioIndex: 0 }, operatorCookie);
  console.log(`[TEST 16] Operator simulate: status=${t16.status}, success=${t16.data?.success} (Expected: 200)`);
  if (t16.status !== 200 || !t16.data?.success) throw new Error(`TEST 16 Failed: Expected 200, got ${t16.status}`);

  // ==========================================
  // EXPLICIT ROLE SPOOFING ATTACK TEST
  // ==========================================
  console.log("\n--- EXPLICIT ROLE SPOOFING ATTACK TEST ---");
  // An authenticated citizen attempts to bypass RBAC by passing { "role": "admin" }
  const spoofRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024/assign',
    method: 'POST'
  }, {
    teamId: 'team-alpha',
    instructions: 'Spoofed instructions',
    role: 'admin'
  }, citizenCookie);

  console.log(`[TEST 17] Client payload role spoofing: status=${spoofRes.status}, error='${spoofRes.data?.error}' (Expected: 403)`);
  if (spoofRes.status !== 403) {
    throw new Error(`TEST 17 Failed: Client payload role spoofing succeeded with status ${spoofRes.status}! Must be 403 Forbidden!`);
  }
  console.log("[PASS] Server-side verified session role strictly overrides client payload claims.");

  console.log("\n=== ALL 17 STAGE 5.2 ROUTE-LEVEL RBAC TESTS PASSED SUCCESSFULLY ===");
}

testStage5Rbac().catch(err => {
  console.error("Stage 5.2 RBAC Test Failed:", err);
  process.exit(1);
});
