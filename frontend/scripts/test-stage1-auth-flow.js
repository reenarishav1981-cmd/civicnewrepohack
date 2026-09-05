const http = require('http');

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

async function runStage1Tests() {
  console.log("==================================================");
  console.log("STAGE 1 — AUTHENTICATION & SESSION VERIFICATION");
  console.log("==================================================");

  const base = { hostname: 'localhost', port: 3000 };

  // TEST 1: Unauthenticated /api/auth/me returns 401
  console.log("\n[TEST 1] Unauthenticated GET /api/auth/me...");
  const unauthRes = await request({ ...base, path: '/api/auth/me', method: 'GET' });
  console.log(`Status: ${unauthRes.status}, Error: ${unauthRes.data?.error}`);
  if (unauthRes.status !== 401) throw new Error("Test 1 Failed: Expected 401 Unauthorized");
  console.log("PASS: Unauthenticated user is rejected with 401.");

  // TEST 2: Public registration role escalation prevention
  console.log("\n[TEST 2] Public Registration Role Escalation Prevention...");
  const testEmail = `attacker.${Date.now()}@civicpulse.gov.in`;
  const regRes = await request({ ...base, path: '/api/auth/register', method: 'POST' }, {
    name: "Malicious Actor",
    email: testEmail,
    password: "Password123!",
    role: "admin" // Attempting to register as admin!
  });
  console.log(`Status: ${regRes.status}, Registered Role: ${regRes.data?.data?.user?.role}`);
  if (regRes.status !== 201) throw new Error("Registration failed");
  if (regRes.data?.data?.user?.role !== "citizen") {
    throw new Error(`Test 2 Failed: Role escalation succeeded! Role was ${regRes.data?.data?.user?.role}`);
  }
  console.log("PASS: Server forced role = 'citizen' despite client requesting 'admin'.");

  // TEST 3: Login as Citizen (Aarav Sharma)
  console.log("\n[TEST 3] Login as Citizen (citizen@civicpulse.gov.in)...");
  const citLogin = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "citizen@civicpulse.gov.in",
    password: "CivicPulse2026!"
  });
  console.log(`Status: ${citLogin.status}, Role: ${citLogin.data?.data?.user?.role}, Cookie: ${!!citLogin.sessionCookie}`);
  if (citLogin.status !== 200 || citLogin.data?.data?.user?.role !== "citizen") throw new Error("Test 3 Failed");
  if (!citLogin.sessionCookie) throw new Error("Test 3 Failed: Missing session cookie");
  console.log("PASS: Citizen login successful, session cookie issued.");

  // TEST 4: /api/auth/me with Citizen Cookie
  console.log("\n[TEST 4] Verify GET /api/auth/me with Citizen Session...");
  const citMe = await request({ ...base, path: '/api/auth/me', method: 'GET' }, null, citLogin.sessionCookie);
  console.log(`Status: ${citMe.status}, Name: ${citMe.data?.data?.user?.name}, Role: ${citMe.data?.data?.user?.role}`);
  if (citMe.status !== 200 || citMe.data?.data?.user?.email !== "citizen@civicpulse.gov.in") throw new Error("Test 4 Failed");
  console.log("PASS: Session cookie successfully verified by server.");

  // TEST 5: Login as Operator (Vikram Mehta)
  console.log("\n[TEST 5] Login as Operator (ops.lead@civicpulse.gov.in)...");
  const opsLogin = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "ops.lead@civicpulse.gov.in",
    password: "CivicPulse2026!"
  });
  console.log(`Status: ${opsLogin.status}, Role: ${opsLogin.data?.data?.user?.role}`);
  if (opsLogin.status !== 200 || opsLogin.data?.data?.user?.role !== "operator") throw new Error("Test 5 Failed");
  console.log("PASS: Operator login verified.");

  // TEST 6: Login as Field Worker (Rajesh Kumar)
  console.log("\n[TEST 6] Login as Field Worker (worker@civicpulse.gov.in)...");
  const wrkLogin = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "worker@civicpulse.gov.in",
    password: "CivicPulse2026!"
  });
  console.log(`Status: ${wrkLogin.status}, Role: ${wrkLogin.data?.data?.user?.role}, ID: ${wrkLogin.data?.data?.user?.id}`);
  if (wrkLogin.status !== 200 || wrkLogin.data?.data?.user?.role !== "worker") throw new Error("Test 6 Failed");
  if (wrkLogin.data?.data?.user?.id !== "usr-4") throw new Error("Test 6 Failed: Worker user ID mismatch");
  console.log("PASS: Worker login verified with immutable ID usr-4.");

  // TEST 7: Login as Admin (Dr. Anita Desai)
  console.log("\n[TEST 7] Login as Admin (admin@civicpulse.gov.in)...");
  const admLogin = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "admin@civicpulse.gov.in",
    password: "CivicPulse2026!"
  });
  console.log(`Status: ${admLogin.status}, Role: ${admLogin.data?.data?.user?.role}`);
  if (admLogin.status !== 200 || admLogin.data?.data?.user?.role !== "admin") throw new Error("Test 7 Failed");
  console.log("PASS: Admin login verified.");

  // TEST 8: Logout clears session
  console.log("\n[TEST 8] Logout (POST /api/auth/logout)...");
  const logoutRes = await request({ ...base, path: '/api/auth/logout', method: 'POST' }, null, admLogin.sessionCookie);
  console.log(`Status: ${logoutRes.status}`);
  const setCookie = logoutRes.headers['set-cookie']?.[0] || '';
  if (!setCookie.includes('Max-Age=0') && !setCookie.includes('expires=')) {
    throw new Error("Test 8 Failed: Session cookie not cleared in logout response");
  }
  console.log("PASS: Session cookie cleared on logout.");

  // TEST 9: Verify /login page serves HTML with 200
  console.log("\n[TEST 9] Verify /login route renders 200 OK...");
  const loginPageRes = await request({ ...base, path: '/login', method: 'GET' });
  console.log(`Status: ${loginPageRes.status}`);
  if (loginPageRes.status !== 200) throw new Error("Test 9 Failed: /login page did not return 200");
  console.log("PASS: /login page is live and accessible.");

  console.log("\n==================================================");
  console.log("ALL STAGE 1 TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runStage1Tests().catch(err => {
  console.error("\nTEST RUN FAILED:", err);
  process.exit(1);
});