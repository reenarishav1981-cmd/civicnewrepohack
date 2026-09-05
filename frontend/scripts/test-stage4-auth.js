const http = require('http');

async function testStage4Auth() {
  console.log("=== RUNNING STAGE 4 AUTHENTICATION & IDENTITY BINDING TESTS ===");

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

  const uniqueEmail = `test.user.${Date.now()}@civicpulse.gov.in`;

  // TEST 1: Register valid user
  console.log("\n[TEST 1] Register valid user (POST /api/auth/register)...");
  const regRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST'
  }, {
    name: "Dr. Ananya Roy",
    email: uniqueEmail,
    password: "SecurePassword123!",
    phone: "+91 99887 66554",
    role: "citizen"
  });
  console.log(`Status: ${regRes.status}, Success: ${regRes.data?.success}, User: ${regRes.data?.data?.user?.email}`);
  if (regRes.status !== 201 || !regRes.data?.success) throw new Error("Test 1 Failed: Registration failed");
  if (!regRes.sessionCookie) throw new Error("Test 1 Failed: Session cookie missing in registration response");
  
  // TEST 2: Duplicate registration rejection
  console.log("\n[TEST 2] Duplicate registration rejection (POST /api/auth/register)...");
  const dupRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST'
  }, {
    name: "Dr. Ananya Roy Duplicate",
    email: uniqueEmail,
    password: "SecurePassword123!"
  });
  console.log(`Status: ${dupRes.status}, Error: ${dupRes.data?.error}`);
  if (dupRes.status !== 409 || dupRes.data?.success !== false) throw new Error("Test 2 Failed: Duplicate registration was not rejected with 409");

  // TEST 3: Login valid credentials
  console.log("\n[TEST 3] Login valid credentials (POST /api/auth/login)...");
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, {
    email: uniqueEmail,
    password: "SecurePassword123!"
  });
  console.log(`Status: ${loginRes.status}, Success: ${loginRes.data?.success}, User: ${loginRes.data?.data?.user?.name}`);
  if (loginRes.status !== 200 || !loginRes.data?.success) throw new Error("Test 3 Failed: Login failed");
  const validCookie = loginRes.sessionCookie;
  if (!validCookie) throw new Error("Test 3 Failed: Missing session cookie on login");

  // TEST 4: Login wrong password rejection
  console.log("\n[TEST 4] Login wrong password rejection (POST /api/auth/login)...");
  const wrongPassRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, {
    email: uniqueEmail,
    password: "IncorrectPassword999!"
  });
  console.log(`Status: ${wrongPassRes.status}, Error: ${wrongPassRes.data?.error}`);
  if (wrongPassRes.status !== 401 || wrongPassRes.data?.success !== false) throw new Error("Test 4 Failed: Wrong password did not return 401");

  // TEST 5: GET /api/auth/me without session (Must return 401)
  console.log("\n[TEST 5] GET /api/auth/me without session...");
  const noSessionRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET'
  });
  console.log(`Status: ${noSessionRes.status}, Error: ${noSessionRes.data?.error}`);
  if (noSessionRes.status !== 401) throw new Error("Test 5 Failed: Expected 401 for unauthenticated request");

  // TEST 6: GET /api/auth/me with valid session
  console.log("\n[TEST 6] GET /api/auth/me with valid session...");
  const meRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET'
  }, null, validCookie);
  console.log(`Status: ${meRes.status}, User ID: ${meRes.data?.data?.user?.id}, Name: ${meRes.data?.data?.user?.name}`);
  if (meRes.status !== 200 || meRes.data?.data?.user?.email !== uniqueEmail) throw new Error("Test 6 Failed: Failed to retrieve user with valid session");
  const currentUserId = meRes.data?.data?.user?.id;

  // TEST 7: Logout (POST /api/auth/logout)
  console.log("\n[TEST 7] Logout (POST /api/auth/logout)...");
  const logoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/logout',
    method: 'POST'
  }, null, validCookie);
  console.log(`Status: ${logoutRes.status}, Success: ${logoutRes.data?.success}`);
  if (logoutRes.status !== 200) throw new Error("Test 7 Failed: Logout endpoint failed");
  const clearedCookie = logoutRes.sessionCookie;

  // TEST 8: GET /api/auth/me after logout (Must return 401)
  console.log("\n[TEST 8] GET /api/auth/me after logout with cleared cookie...");
  const afterLogoutRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET'
  }, null, clearedCookie);
  console.log(`Status: ${afterLogoutRes.status}, Error: ${afterLogoutRes.data?.error}`);
  if (afterLogoutRes.status !== 401) throw new Error("Test 8 Failed: Expected 401 after logout");

  // TEST 9: Verify password and passwordHash are NEVER leaked in any API response
  console.log("\n[TEST 9] Verify password / passwordHash never leak in responses...");
  const serialized = JSON.stringify({
    regData: regRes.data,
    loginData: loginRes.data,
    meData: meRes.data
  });
  if (serialized.includes("passwordHash") || serialized.includes("SecurePassword123!")) {
    throw new Error("Test 9 Failed: Sensitive password/hash leaked in API responses!");
  }
  console.log("[PASS] Neither plaintext password nor passwordHash appears anywhere in responses.");

  // TEST 10: Malformed authentication token rejected with 401
  console.log("\n[TEST 10] Malformed authentication session rejected with 401...");
  const malformedRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET'
  }, null, "civicpulse_session=malformed.tampered.token");
  console.log(`Status: ${malformedRes.status}, Error: ${malformedRes.data?.error}`);
  if (malformedRes.status !== 401) throw new Error("Test 10 Failed: Expected 401 for malformed token");

  // TEST 11: User Identity Binding (POST /api/reports binds to authenticated user)
  console.log("\n[TEST 11] User Identity Binding: POST /api/reports with authenticated session...");
  const reportRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST'
  }, {
    description: "Deep pothole outside Sector 4 hospital emergency entrance. Ambulances slowing down.",
    category: "Road Hazard",
    latitude: 21.1780,
    longitude: 72.8290,
    address: "Hospital Emergency Lane, Sector 4",
    // Attacker or client tries to claim another user ID
    userId: "attacker-spoofed-user-id",
    userName: "Spoofed Name"
  }, validCookie);

  console.log(`Status: ${reportRes.status}, Success: ${reportRes.data?.success}`);
  const reportData = reportRes.data?.data?.report;
  console.log(`Bound Report User ID: ${reportData?.userId} (Expected: ${currentUserId})`);
  console.log(`Bound Report User Name: ${reportData?.userName} (Expected: Dr. Ananya Roy)`);
  if (reportData?.userId !== currentUserId) {
    throw new Error(`Test 11 Failed: Report userId (${reportData?.userId}) was not bound to authenticated user (${currentUserId})!`);
  }
  if (reportData?.userName !== "Dr. Ananya Roy") {
    throw new Error(`Test 11 Failed: Report userName was spoofed by client payload!`);
  }

  // TEST 12: Password Security in Database (passwordHash != plaintext)
  console.log("\n[TEST 12] Password Security in SQLite (passwordHash != plaintext password)...");
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const dbUser = await prisma.user.findUnique({ where: { email: uniqueEmail } });
  await prisma.$disconnect();

  if (!dbUser || !dbUser.passwordHash) throw new Error("Test 12 Failed: User or passwordHash not found in DB");
  if (dbUser.passwordHash === "SecurePassword123!") {
    throw new Error("Test 12 Failed: CRITICAL SECURITY VULNERABILITY! Password stored in plain text!");
  }
  if (!dbUser.passwordHash.startsWith("$2b$") && !dbUser.passwordHash.startsWith("$2a$")) {
    throw new Error("Test 12 Failed: Stored passwordHash is not a valid bcrypt hash!");
  }
  console.log(`[PASS] DB stored passwordHash format: ${dbUser.passwordHash.substring(0, 15)}... (bcrypt verified)`);

  console.log("\n=== ALL STAGE 4 AUTHENTICATION & IDENTITY BINDING TESTS PASSED ===");
}

testStage4Auth().catch(err => {
  console.error("Stage 4 Auth Test Failed:", err);
  process.exit(1);
});
