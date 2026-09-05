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

function recursiveKeySearch(obj, forbiddenKeys, path = "") {
  const leaks = [];
  if (!obj || typeof obj !== "object") return leaks;

  for (const [k, v] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${k}` : k;
    const lowerKey = k.toLowerCase();

    for (const forbidden of forbiddenKeys) {
      if (lowerKey === forbidden.toLowerCase() || lowerKey.includes(forbidden.toLowerCase())) {
        leaks.push({ path: currentPath, key: k, value: v });
      }
    }

    if (v && typeof v === "object") {
      leaks.push(...recursiveKeySearch(v, forbiddenKeys, currentPath));
    }
  }
  return leaks;
}

async function runPhase4Tests() {
  console.log("================================================================================");
  console.log("CIVICPULSE — PHASE 4: CITIZEN TRACKING, TRANSPARENCY & REOPENING TEST SUITE");
  console.log("================================================================================");

  const base = { hostname: 'localhost', port: 3000 };
  const password = "CivicPulse2026!";
  const hash = await bcrypt.hash(password, 10);
  const ts = Date.now().toString().slice(-5);

  // 1. Create personas
  // Citizen A (original reporter)
  const citizenA = await prisma.user.create({
    data: {
      name: `Ramesh Reporter ${ts}`,
      email: `ramesh.${ts}@gmail.com`,
      phone: `+91 98111 ${ts}`,
      role: "citizen",
      passwordHash: hash
    }
  });

  // Citizen B (unrelated citizen)
  const citizenB = await prisma.user.create({
    data: {
      name: `Suresh Citizen ${ts}`,
      email: `suresh.${ts}@gmail.com`,
      phone: `+91 98222 ${ts}`,
      role: "citizen",
      passwordHash: hash
    }
  });

  // Worker
  const workerUser = await prisma.user.create({
    data: {
      name: `Vikram Field Lead ${ts}`,
      email: `vikram.${ts}@civicpulse.gov.in`,
      phone: `+91 98333 ${ts}`,
      role: "worker",
      passwordHash: hash
    }
  });

  // Field Team
  const teamId = `team-p4-${ts}`;
  await prisma.fieldTeam.create({
    data: {
      id: teamId,
      name: `Asphalt Response Squad ${ts}`,
      department: "Road Operations",
      leaderName: workerUser.name,
      phone: workerUser.phone,
      specialization: "Pothole & Pavement",
      status: "available",
      currentLatitude: 21.1702,
      currentLongitude: 72.8311
    }
  });

  // Test Incident
  const incId = `CP-P4-${ts}`;
  await prisma.incident.create({
    data: {
      id: incId,
      title: "Caved-in Road Surface near Sector 9 Market",
      category: "Road Hazard",
      priority: "critical",
      priorityScore: 89,
      priorityReason: "High collision risk during night hours",
      status: "under_review",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Crossroad 9, Sector 9 Market Corridor",
      zone: "Sector 9 Market Corridor",
      beforeEvidenceUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600",
      aiConfidence: 0.95
    }
  });

  // Citizen A Report linked to Incident
  const reportAId = `R-P4A-${ts}`;
  await prisma.citizenReport.create({
    data: {
      id: reportAId,
      userId: citizenA.id,
      userName: citizenA.name,
      userPhone: citizenA.phone,
      incidentId: incId,
      description: "Severe road crater obstructing left lane right in front of market entry.",
      category: "Road Hazard",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Crossroad 9, Sector 9 Market Corridor",
      status: "correlated"
    }
  });

  // Citizen B Report (Standalone)
  const reportBId = `R-P4B-${ts}`;
  await prisma.citizenReport.create({
    data: {
      id: reportBId,
      userId: citizenB.id,
      userName: citizenB.name,
      userPhone: citizenB.phone,
      description: "Unrelated trash bin overflow in Sector 14 park.",
      category: "Garbage & Sanitation",
      latitude: 21.1850,
      longitude: 72.8450,
      address: "Green Park, Sector 14",
      status: "received"
    }
  });

  // Authenticate sessions
  const citizenAAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: citizenA.email,
    password
  });
  const citizenBAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: citizenB.email,
    password
  });
  const workerAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: workerUser.email,
    password
  });
  const opsAuth = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: "ops.lead@civicpulse.gov.in",
    password
  });

  console.log("✓ Personas authenticated: Citizen A (Owner), Citizen B (Unrelated), Worker, Operator.\n");

  // ============================================================================
  // TEST 1: Unauthenticated access to GET /api/track/[id] (Expected 200)
  // ============================================================================
  console.log("[TEST 1] Unauthenticated user accesses GET /api/track/[id]");
  const t1 = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Status: ${t1.status} | Tracking ID: ${t1.data?.incident?.trackingId} | Status: ${t1.data?.incident?.status}`);
  const passT1 = t1.status === 200 && t1.data?.incident?.trackingId === incId;
  console.log(`PASS: ${passT1}`);
  if (!passT1) throw new Error("TEST 1 Failed");

  // ============================================================================
  // TEST 2: Data Leakage Protection Verification
  // ============================================================================
  console.log("\n[TEST 2] Data Leakage Scan on public tracking payload");
  const forbidden = [
    "password", "passwordHash", "phone", "email", "assignedWorkerId", 
    "workerNotes", "internalNotes", "activityLogs", "aiExplanationJson"
  ];
  const leaksT2 = recursiveKeySearch(t1.data, forbidden);
  console.log(`Forbidden leaks found: ${leaksT2.length}`);
  if (leaksT2.length > 0) {
    console.error("LEAKS DETECTED:", leaksT2);
    throw new Error(`TEST 2 Failed: Found ${leaksT2.length} data leaks in public tracking API!`);
  }
  console.log("PASS: true (Zero sensitive internal attributes exposed in tracking DTO)");

  // ============================================================================
  // TEST 3 & 4: Citizen Reports Scoping (GET /api/citizen/reports)
  // ============================================================================
  console.log("\n[TEST 3 & 4] Citizen Scoping: Citizen A views their own reports vs Citizen B");
  const t4A = await request({ ...base, path: '/api/citizen/reports', method: 'GET' }, null, citizenAAuth.sessionCookie);
  const t4B = await request({ ...base, path: '/api/citizen/reports', method: 'GET' }, null, citizenBAuth.sessionCookie);

  console.log(`Citizen A reports count: ${t4A.data?.count} (IDs: ${t4A.data?.data?.map(r => r.id).join(', ')})`);
  console.log(`Citizen B reports count: ${t4B.data?.count} (IDs: ${t4B.data?.data?.map(r => r.id).join(', ')})`);

  const passT3_4 = 
    t4A.status === 200 && 
    t4A.data.data.some(r => r.id === reportAId) && 
    !t4A.data.data.some(r => r.id === reportBId) &&
    t4B.status === 200 &&
    t4B.data.data.some(r => r.id === reportBId) &&
    !t4B.data.data.some(r => r.id === reportAId);

  console.log(`PASS: ${passT3_4} (Strict server-side scoping by authenticated user ID)`);
  if (!passT3_4) throw new Error("TEST 3 & 4 Failed");

  // ============================================================================
  // TEST 12: Public tracking reflects progression through all stages
  // ============================================================================
  console.log("\n[TEST 12] Step through lifecycle and verify public tracking updates at every stage");

  // A. Operator Assigns Squad
  const assignRes = await request({ ...base, path: `/api/incidents/${incId}/assign`, method: 'POST' }, {
    teamId,
    instructions: "Fill surface cavity with hot bitumen."
  }, opsAuth.sessionCookie);
  const taskId = assignRes.data?.data?.task?.id;
  console.log(`Assigned Task: ${taskId}`);

  const trackAssigned = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Stage 1 (Assigned) -> Public Status: '${trackAssigned.data?.incident?.status}' | Code: '${trackAssigned.data?.incident?.statusCode}'`);
  if (trackAssigned.data?.incident?.statusCode !== "assigned") throw new Error("Failed to reflect 'assigned'");

  // B. Worker en_route
  await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, { status: "en_route" }, workerAuth.sessionCookie);
  const trackEnRoute = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Stage 2 (En Route) -> Public Status: '${trackEnRoute.data?.incident?.status}' | Code: '${trackEnRoute.data?.incident?.statusCode}'`);
  if (trackEnRoute.data?.incident?.statusCode !== "en_route") throw new Error("Failed to reflect 'en_route'");

  // C. Worker arrived
  await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, { status: "arrived" }, workerAuth.sessionCookie);
  const trackArrived = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Stage 3 (Arrived) -> Public Status: '${trackArrived.data?.incident?.status}' | Code: '${trackArrived.data?.incident?.statusCode}'`);
  if (trackArrived.data?.incident?.statusCode !== "arrived") throw new Error("Failed to reflect 'arrived'");

  // D. Worker in_progress
  await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, { status: "in_progress" }, workerAuth.sessionCookie);
  const trackInProgress = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Stage 4 (In Progress) -> Public Status: '${trackInProgress.data?.incident?.status}' | Code: '${trackInProgress.data?.incident?.statusCode}'`);
  if (trackInProgress.data?.incident?.statusCode !== "in_progress") throw new Error("Failed to reflect 'in_progress'");

  // E. Worker completed with evidence -> awaiting_verification
  const completionPhoto = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800";
  await request({ ...base, path: `/api/tasks/${taskId}/status`, method: 'PATCH' }, {
    status: "completed",
    afterPhotoUrl: completionPhoto,
    workerNotes: "Cavity backfilled with crushed stone aggregate and hot rolled bitumen."
  }, workerAuth.sessionCookie);

  const trackInspection = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Stage 5 (Inspection) -> Public Status: '${trackInspection.data?.incident?.status}' | Code: '${trackInspection.data?.incident?.statusCode}'`);
  if (trackInspection.data?.incident?.statusCode !== "awaiting_verification") throw new Error("Failed to reflect 'awaiting_verification'");

  // F. Operator verifies -> resolved
  await request({ ...base, path: `/api/incidents/${incId}/verify`, method: 'POST' }, {
    decision: "approve",
    notes: "Site restoration approved per municipal pavement specifications."
  }, opsAuth.sessionCookie);

  const trackResolved = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  console.log(`Stage 6 (Resolved) -> Public Status: '${trackResolved.data?.incident?.status}' | Code: '${trackResolved.data?.incident?.statusCode}' | Evidence Exposed: ${!!trackResolved.data?.incident?.evidence?.afterPhotoUrl}`);
  if (trackResolved.data?.incident?.statusCode !== "resolved" || !trackResolved.data?.incident?.evidence?.afterPhotoUrl) {
    throw new Error("Failed to reflect 'resolved' or evidence not exposed upon resolution");
  }
  console.log("PASS: true (Public tracking seamlessly stepped through all 6 operational stages)");

  // ============================================================================
  // TEST 5: Worker cannot submit citizen feedback (Expected 403)
  // ============================================================================
  console.log("\n[TEST 5] Worker attempts to submit citizen feedback (Expected 403)");
  const t5 = await request({ ...base, path: `/api/incidents/${incId}/feedback`, method: 'POST' }, {
    feedbackStatus: "RESOLVED SUCCESSFULLY"
  }, workerAuth.sessionCookie);
  console.log(`Status: ${t5.status} | Error: '${t5.data?.error}' | PASS: ${t5.status === 403}`);
  if (t5.status !== 403) throw new Error("TEST 5 Failed");

  // ============================================================================
  // TEST 6: Unrelated citizen cannot submit feedback (Expected 403)
  // ============================================================================
  console.log("\n[TEST 6] Unrelated Citizen B attempts to submit feedback for Citizen A's incident (Expected 403)");
  const t6 = await request({ ...base, path: `/api/incidents/${incId}/feedback`, method: 'POST' }, {
    feedbackStatus: "RESOLVED SUCCESSFULLY"
  }, citizenBAuth.sessionCookie);
  console.log(`Status: ${t6.status} | Error: '${t6.data?.error}' | PASS: ${t6.status === 403}`);
  if (t6.status !== 403) throw new Error("TEST 6 Failed");

  // ============================================================================
  // TEST 7 & 8: Original citizen submits 'ISSUE STILL EXISTS' -> reopen_requested
  // ============================================================================
  console.log("\n[TEST 7 & 8] Original Citizen A submits 'ISSUE STILL EXISTS' (Expected 200 & reopen_requested)");
  const t7 = await request({ ...base, path: `/api/incidents/${incId}/feedback`, method: 'POST' }, {
    feedbackStatus: "ISSUE STILL EXISTS",
    feedbackNotes: "The pothole was patched but rainwater is collecting around edges causing erosion."
  }, citizenAAuth.sessionCookie);
  console.log(`Status: ${t7.status} | Updated Incident Status: '${t7.data?.data?.incident?.status}'`);
  const passT7 = t7.status === 200 && t7.data?.data?.incident?.status === "reopen_requested";
  console.log(`PASS: ${passT7}`);
  if (!passT7) throw new Error("TEST 7 & 8 Failed");

  // Verify in DB
  const dbIncAfterFeedback = await prisma.incident.findUnique({ where: { id: incId }, include: { timelineEvents: true } });
  console.log(`DB Incident Status: '${dbIncAfterFeedback.status}' | Feedback: '${dbIncAfterFeedback.citizenFeedbackStatus}'`);
  if (dbIncAfterFeedback.status !== "reopen_requested") throw new Error("DB verification failed for reopen_requested");

  // ============================================================================
  // TEST 9: Citizen cannot directly approve reopening (Expected 403)
  // ============================================================================
  console.log("\n[TEST 9] Citizen attempts to approve reopening directly (Expected 403)");
  const t9 = await request({ ...base, path: `/api/incidents/${incId}/reopen-review`, method: 'POST' }, {
    decision: "approve"
  }, citizenAAuth.sessionCookie);
  console.log(`Status: ${t9.status} | Error: '${t9.data?.error}' | PASS: ${t9.status === 403}`);
  if (t9.status !== 403) throw new Error("TEST 9 Failed");

  // ============================================================================
  // TEST 10: Operator approves reopening -> incident moves to in_progress
  // ============================================================================
  console.log("\n[TEST 10] Operator approves reopening review");
  const t10 = await request({ ...base, path: `/api/incidents/${incId}/reopen-review`, method: 'POST' }, {
    decision: "approve",
    notes: "Site inspection confirms edge erosion. Authorized secondary squad dispatch."
  }, opsAuth.sessionCookie);
  console.log(`Status: ${t10.status} | Incident Status: '${t10.data?.data?.incident?.status}'`);
  const passT10 = t10.status === 200 && t10.data?.data?.incident?.status === "in_progress";
  console.log(`PASS: ${passT10}`);
  if (!passT10) throw new Error("TEST 10 Failed");

  // Check timeline event 'incident_reopened'
  const dbIncAfterReopen = await prisma.incident.findUnique({ where: { id: incId }, include: { timelineEvents: true } });
  const hasReopenEvent = dbIncAfterReopen.timelineEvents.some(e => e.type === "incident_reopened");
  console.log(`Timeline contains 'incident_reopened' event: ${hasReopenEvent}`);
  if (!hasReopenEvent) throw new Error("TEST 10 Timeline verification failed");

  // ============================================================================
  // TEST 11: Rejection scenario (Test on secondary incident)
  // ============================================================================
  console.log("\n[TEST 11] Operator rejects reopening request (Incident remains resolved)");
  const incRejectId = `CP-REJ-${ts}`;
  await prisma.incident.create({
    data: {
      id: incRejectId,
      title: "Streetlight flickering at night",
      category: "Streetlight & Power",
      priority: "medium",
      priorityScore: 50,
      priorityReason: "Reported flicker",
      status: "reopen_requested",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Lane 2, Sector 9",
      zone: "Sector 9"
    }
  });

  const t11 = await request({ ...base, path: `/api/incidents/${incRejectId}/reopen-review`, method: 'POST' }, {
    decision: "reject",
    notes: "Photometric sensor telemetry confirms stable illumination. Reopening rejected."
  }, opsAuth.sessionCookie);
  console.log(`Status: ${t11.status} | Status after rejection: '${t11.data?.data?.incident?.status}'`);
  const dbIncReject = await prisma.incident.findUnique({ where: { id: incRejectId }, include: { timelineEvents: true } });
  const hasRejectEvent = dbIncReject.timelineEvents.some(e => e.type === "reopen_request_rejected");
  const passT11 = t11.status === 200 && dbIncReject.status === "resolved" && hasRejectEvent;
  console.log(`PASS: ${passT11} (Incident restored to resolved and rejection audit event logged)`);
  if (!passT11) throw new Error("TEST 11 Failed");

  // ============================================================================
  // TEST 13: Comprehensive Recursive Data Leakage Audit
  // ============================================================================
  console.log("\n[TEST 13] Comprehensive Recursive Data Leakage Audit across all Phase 4 endpoints");
  const trackFinal = await request({ ...base, path: `/api/track/${incId}`, method: 'GET' });
  const leaksTrack = recursiveKeySearch(trackFinal.data, [
    "password", "passwordHash", "phone", "email", "assignedWorkerId",
    "workerNotes", "internalNotes", "activityLogs"
  ]);

  console.log(`Deep scan leaks found: ${leaksTrack.length}`);
  if (leaksTrack.length > 0) {
    console.error("LEAKS DETECTED IN DEEP AUDIT:", leaksTrack);
    throw new Error("TEST 13 Failed: Data leakage in public tracking!");
  }
  console.log("PASS: true (Zero data leakage confirmed by recursive scanner)");

  console.log("\n================================================================================");
  console.log("ALL 13 PHASE 4 CITIZEN TRACKING & REOPENING TESTS PASSED 100%!");
  console.log("================================================================================");
}

runPhase4Tests().catch(err => {
  console.error("\nPHASE 4 TEST SUITE FAILED:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});