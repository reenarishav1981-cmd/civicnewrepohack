/**
 * CivicPulse — Phase 8 Master Automated Verification Suite
 * Tests all 25 Executive Decision & Impact Intelligence requirements:
 * 1. Empty data handling
 * 2. Insufficient data handling (< 3 records)
 * 3. Department performance calculation
 * 4. Area performance calculation
 * 5. Pressure normalization (0 - 100)
 * 6. Pressure boundaries (LOW, MODERATE, HIGH, CRITICAL)
 * 7. Recommendation generation
 * 8. Recommendation explanation & factor attribution
 * 9. humanApprovalRequired always true (immutable safety)
 * 10. Recommendation dismissal with required reason
 * 11. Recommendation deferral
 * 12. Executive decision audit trail in database
 * 13. 48h projection trajectory calculation
 * 14. Projection confidence formula
 * 15. Projection insufficient-data guard
 * 16. No automatic team deployment (Absolute Human Control)
 * 17. Unauthenticated rejection (401)
 * 18. Citizen access rejection (403)
 * 19. Operator access permitted (200)
 * 20. Admin access permitted (200)
 * 21. Demo simulation isolation (zero DB pollution)
 * 22. Phase 7 real-time event bus integration
 * 23. Phase 6 predictive intelligence integration
 * 24. Type safety verification
 * 25. /executive UI route integrity (200 OK)
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
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runPhase8Tests() {
  console.log("================================================================================");
  console.log("CIVICPULSE — PHASE 8 EXECUTIVE DECISION & IMPACT INTELLIGENCE SUITE");
  console.log("================================================================================");

  // Authenticate Personas
  const opLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'ops.lead@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const operatorCookie = opLogin.sessionCookie;

  const adminLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'admin@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const adminCookie = adminLogin.sessionCookie;

  const citizenLogin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST'
  }, { email: 'citizen@civicpulse.gov.in', password: 'CivicPulse2026!' });
  const citizenCookie = citizenLogin.sessionCookie;

  assert(!!operatorCookie, "Municipal Operator persona authenticated");
  assert(!!adminCookie, "Admin persona authenticated");
  assert(!!citizenCookie, "Citizen persona authenticated");

  // ---------------------------------------------------------------------------
  // In-process Unit Engine Verification
  // ---------------------------------------------------------------------------
  const {
    analyzeDepartmentPerformance,
    mapCategoryToDepartment,
    getDepartmentSLAHours,
    evaluateDepartmentStatus
  } = require('../src/lib/executive/departmentPerformanceEngine');

  const {
    analyzeAreaPerformance,
    normalizeIncidentZone,
    evaluateAreaStatus
  } = require('../src/lib/executive/areaPerformanceEngine');

  const {
    calculateResourcePressure,
    evaluatePressureLevel
  } = require('../src/lib/executive/resourcePressureEngine');

  const {
    generateDecisionRecommendations,
    calculateRecommendationConfidence
  } = require('../src/lib/executive/decisionRecommendationEngine');

  const {
    projectOperationalTrajectory
  } = require('../src/lib/executive/impactProjectionEngine');

  const {
    explainDecisionRecommendation
  } = require('../src/lib/executive/executiveExplanationEngine');

  // ---------------------------------------------------------------------------
  // TEST 1: Empty Data Handling
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 1] Empty Data Handling");
  const emptyDepts = analyzeDepartmentPerformance([]);
  assert(Array.isArray(emptyDepts) && emptyDepts.length >= 5, "Handles empty incidents array cleanly");
  assert(emptyDepts.every(d => d.activeBacklog === 0 && d.totalIncidents === 0), "All departments default to 0 backlog");

  const emptyPressure = calculateResourcePressure([], []);
  assert(emptyPressure.score >= 0 && emptyPressure.score <= 100, `Empty pressure score is safe: ${emptyPressure.score}`);

  // ---------------------------------------------------------------------------
  // TEST 2: Insufficient Data Handling (< 3 records)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 2] Insufficient Data Handling in Projections");
  const sparseIncidents = [
    { id: "SP-1", category: "Road Hazard", status: "new", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];
  const sparseProj = projectOperationalTrajectory("Public Works / Road Infrastructure", sparseIncidents);
  assert(sparseProj.status === "INSUFFICIENT_DATA", "Status is strictly INSUFFICIENT_DATA when records < 3");
  assert(sparseProj.confidence === 0.0, "Confidence is strictly 0.0 when records < 3");

  // ---------------------------------------------------------------------------
  // TEST 3: Department Performance Calculation
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 3] Department Performance Calculation");
  const sampleIncidents = [
    { id: "INC-1", category: "Road Hazard", priority: "critical", status: "new", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "INC-2", category: "Pothole", priority: "high", status: "in_progress", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "INC-3", category: "Road Hazard", priority: "medium", status: "resolved", createdAt: new Date(Date.now() - 100000000).toISOString(), updatedAt: new Date().toISOString() },
  ];
  const deptProfiles = analyzeDepartmentPerformance(sampleIncidents);
  const roadDept = deptProfiles.find(d => d.department === "Public Works / Road Infrastructure");
  assert(!!roadDept, "Road Infrastructure department identified");
  assert(roadDept.totalIncidents === 3, `Total incidents calculated: ${roadDept.totalIncidents}`);
  assert(roadDept.activeBacklog === 2, `Active backlog calculated: ${roadDept.activeBacklog}`);
  assert(roadDept.criticalIncidentCount === 1, `Critical incidents calculated: ${roadDept.criticalIncidentCount}`);

  // ---------------------------------------------------------------------------
  // TEST 4: Area Performance Calculation
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 4] Area Performance Calculation (Zero Fake Wards)");
  const areaIncidents = [
    { id: "A-1", zone: "Varachha", category: "Road Hazard", priority: "high", status: "new", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "A-2", zone: "Varachha", category: "Water Leakage", priority: "critical", status: "in_progress", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  const areaProfiles = analyzeAreaPerformance(areaIncidents);
  const varachha = areaProfiles.find(a => a.zone === "Varachha");
  assert(!!varachha, "Real zone 'Varachha' evaluated");
  assert(varachha.activeBacklog === 2, `Varachha active backlog: ${varachha.activeBacklog}`);
  assert(varachha.criticalIncidentPressure === 1, `Varachha critical pressure: ${varachha.criticalIncidentPressure}`);

  // ---------------------------------------------------------------------------
  // TEST 5 & 6: Pressure Normalization & Boundaries
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 5 & 6] Operational Pressure Score Normalization & Boundaries");
  const pressureRes = calculateResourcePressure(sampleIncidents, [{ id: "t1", status: "dispatched" }]);
  assert(pressureRes.score >= 0 && pressureRes.score <= 100, `Score is bounded in [0, 100]: ${pressureRes.score}`);
  assert(["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(pressureRes.level), `Valid pressure level: ${pressureRes.level}`);
  assert(evaluatePressureLevel(15) === "LOW", "Score 15 is LOW");
  assert(evaluatePressureLevel(45) === "MODERATE", "Score 45 is MODERATE");
  assert(evaluatePressureLevel(72) === "HIGH", "Score 72 is HIGH");
  assert(evaluatePressureLevel(90) === "CRITICAL", "Score 90 is CRITICAL");

  // ---------------------------------------------------------------------------
  // TEST 7 & 8: Recommendation Generation & Explanation
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 7 & 8] Recommendation Generation & Factor Attribution");
  const recommendations = generateDecisionRecommendations(deptProfiles, areaProfiles, pressureRes);
  assert(Array.isArray(recommendations) && recommendations.length >= 1, "Recommendations successfully generated");
  const rec = recommendations[0];
  assert(!!rec.actionType && !!rec.title && !!rec.reason, "Recommendation has actionType, title, and reason");
  
  const explanation = explainDecisionRecommendation(rec);
  assert(!!explanation.whatIsHappening, "Explanation answers 'What Is Happening?'");
  assert(!!explanation.whyItMatters, "Explanation answers 'Why Does It Matter?'");
  assert(Array.isArray(explanation.supportingEvidence), "Explanation provides supporting evidence breakdown");

  // ---------------------------------------------------------------------------
  // TEST 9: humanApprovalRequired Always True (Absolute Human Agency)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 9] Immutable Safety: humanApprovalRequired Always True");
  recommendations.forEach(r => {
    assert(r.humanApprovalRequired === true, `Recommendation ${r.id} strictly enforces humanApprovalRequired: true`);
  });

  // ---------------------------------------------------------------------------
  // TEST 10: Recommendation Dismissal with Required Reason
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 10] Recommendation Dismissal API (Reason Required)");
  // Attempt without reason (should fail with 400)
  const failDismiss = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/decisions',
    method: 'POST'
  }, {
    recommendationId: "REC-TEST-DISMISS-1",
    actionType: "DEPLOY_ADDITIONAL_TEAM",
    decision: "DISMISSED",
    reason: ""
  }, operatorCookie);
  assert(failDismiss.status === 400 || failDismiss.status === 422, `Dismissal without reason rejected (actual: ${failDismiss.status})`);

  // Valid dismissal
  const validDismiss = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/decisions',
    method: 'POST'
  }, {
    recommendationId: "REC-TEST-DISMISS-1",
    actionType: "DEPLOY_ADDITIONAL_TEAM",
    decision: "DISMISSED",
    reason: "Internal engineering squad redirected from adjacent ring road sector."
  }, operatorCookie);
  assert(validDismiss.status === 200 && validDismiss.data.success, "Dismissal with valid reason accepted (200 OK)");

  // ---------------------------------------------------------------------------
  // TEST 11: Recommendation Deferral
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 11] Recommendation Deferral API");
  const deferRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/decisions',
    method: 'POST'
  }, {
    recommendationId: "REC-TEST-DEFER-1",
    actionType: "ESCALATE_DEPARTMENT_REVIEW",
    decision: "DEFERRED",
    reason: "Deferred 24h pending afternoon supervisor shift debrief."
  }, operatorCookie);
  assert(deferRes.status === 200 && deferRes.data.success, "Deferral successfully accepted (200 OK)");

  // ---------------------------------------------------------------------------
  // TEST 12: Executive Decision Audit Trail in Database
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 12] Executive Decision Audit Trail in Database");
  const dbDecisions = await prisma.executiveDecision.findMany({
    where: { recommendationId: "REC-TEST-DEFER-1" }
  });
  assert(dbDecisions.length >= 1, "Audit record persisted in ExecutiveDecision table");
  assert(dbDecisions[0].decision === "DEFERRED", "Decision recorded as DEFERRED");
  assert(!!dbDecisions[0].actorId, "Actor ID captured in audit ledger");

  // ---------------------------------------------------------------------------
  // TEST 13, 14 & 15: 48h Trajectory Projections & Confidence
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 13, 14 & 15] 48h Trajectory Projections & Insufficient-Data Guard");
  const richIncidents = [
    { id: "R1", category: "Road Hazard", status: "new", createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: "R2", category: "Road Hazard", status: "new", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: "R3", category: "Road Hazard", status: "resolved", createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: "R4", category: "Road Hazard", status: "resolved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  const richProj = projectOperationalTrajectory("Public Works / Road Infrastructure", richIncidents);
  assert(richProj.status === "AVAILABLE", "Status is AVAILABLE when records >= 3");
  assert(richProj.confidence >= 0.40, `Confidence calculated: ${richProj.confidence}`);
  assert(richProj.currentTrajectory.points.length === 5, "Trajectory modeled across 5 timeline points (0h to 48h)");
  assert(richProj.interventionScenario.points.length === 5, "Intervention modeled across 5 timeline points");
  assert(richProj.disclaimer.includes("Not a predictive guarantee"), "Transparent disclaimer included");

  // ---------------------------------------------------------------------------
  // TEST 16: No Automatic Team Deployment (Strict Safety)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 16] Absolute Safety: Executive Approval Does NOT Autonomously Deploy Teams");
  const teamsBefore = await prisma.fieldTeam.findMany();
  const availableTeamsBefore = teamsBefore.filter(t => t.status === "available").length;

  const approveRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/decisions',
    method: 'POST'
  }, {
    recommendationId: "REC-TEST-APPROVE-SAFETY",
    actionType: "DEPLOY_ADDITIONAL_TEAM",
    decision: "ACCEPTED",
    reason: "Authorized mobilization of secondary asphalt repair crew."
  }, operatorCookie);
  assert(approveRes.status === 200 && approveRes.data.success, "Executive approved recommendation");

  const teamsAfter = await prisma.fieldTeam.findMany();
  const availableTeamsAfter = teamsAfter.filter(t => t.status === "available").length;
  assert(availableTeamsBefore === availableTeamsAfter, "Field team statuses remain completely untouched (Zero Autonomous Execution)");

  // ---------------------------------------------------------------------------
  // TEST 17 & 18: RBAC Rejection (401 & 403)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 17 & 18] RBAC Access Boundaries");
  const unauthRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/overview',
    method: 'GET'
  });
  assert(unauthRes.status === 401, `Unauthenticated rejected with 401 (actual: ${unauthRes.status})`);

  const citizenRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/overview',
    method: 'GET'
  }, null, citizenCookie);
  assert(citizenRes.status === 403, `Citizen rejected with 403 (actual: ${citizenRes.status})`);

  // ---------------------------------------------------------------------------
  // TEST 19 & 20: Operator & Admin Access Permitted
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 19 & 20] Operator & Admin Access Permissions");
  const opOverview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/overview',
    method: 'GET'
  }, null, operatorCookie);
  assert(opOverview.status === 200 && opOverview.data.success, "Operator access permitted (200 OK)");

  const adminOverview = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/executive/overview',
    method: 'GET'
  }, null, adminCookie);
  assert(adminOverview.status === 200 && adminOverview.data.success, "Admin access permitted (200 OK)");

  // ---------------------------------------------------------------------------
  // TEST 21: Demo Simulation Isolation (Zero DB Pollution)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 21] Demo Simulation Isolation");
  const demoDecisionsInDb = await prisma.executiveDecision.findMany({
    where: { recommendationId: { startsWith: "DEMO" } }
  });
  assert(demoDecisionsInDb.length === 0, `Zero demo decisions in DB (actual: ${demoDecisionsInDb.length})`);

  // ---------------------------------------------------------------------------
  // TEST 22: Phase 7 Real-Time Event Bus Integration
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 22] Phase 7 Real-Time Telemetry Integration");
  const recentEvents = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/realtime/events?limit=10',
    method: 'GET'
  }, null, operatorCookie);
  assert(recentEvents.status === 200 && Array.isArray(recentEvents.data.events), "Real-time event stream active and responsive");

  // ---------------------------------------------------------------------------
  // TEST 23: Phase 6 Predictive Intelligence Integration
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 23] Phase 6 Predictive Intelligence Integration");
  assert(!!opOverview.data.data.cityHealth, "Executive snapshot includes Phase 6 City Health Score");
  assert(typeof opOverview.data.data.cityHealth.score === "number", "City Health score is numeric");

  // ---------------------------------------------------------------------------
  // TEST 24: Type Safety Contract Integrity
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 24] Data Contract Integrity");
  const snapshot = opOverview.data.data;
  assert(Array.isArray(snapshot.departments), "Departments returned as array");
  assert(Array.isArray(snapshot.areas), "Areas returned as array");
  assert(Array.isArray(snapshot.recommendations), "Recommendations returned as array");
  assert(Array.isArray(snapshot.projections), "Projections returned as array");

  // ---------------------------------------------------------------------------
  // TEST 25: /executive UI Route Integrity
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 25] /executive UI Route Integrity");
  const execPageRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/executive',
    method: 'GET'
  }, null, operatorCookie);
  assert(execPageRes.status === 200, `/executive cockpit page renders 200 OK (actual: ${execPageRes.status})`);

  console.log("================================================================================");
  console.log("ALL 25 PHASE 8 EXECUTIVE DECISION INTELLIGENCE TESTS PASSED! (100% GREEN)");
  console.log("================================================================================");
}

runPhase8Tests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
