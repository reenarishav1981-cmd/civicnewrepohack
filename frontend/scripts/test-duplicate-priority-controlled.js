/**
 * scripts/test-duplicate-priority-controlled.js
 * Controlled tests for Duplicate Detection & Priority Score Consistency.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEXT_BASE = 'http://localhost:3000';

async function main() {
  console.log('================================================================================');
  console.log('CIVICPULSE — CONTROLLED DUPLICATE DETECTION & PRIORITY CONSISTENCY TEST SUITE');
  console.log('================================================================================\n');

  // Fresh Location X for clean test run
  const LOC_X = {
    lat: 26.315500,
    lng: 78.152200,
    address: 'Location X, Sector 15 Civic Corridor'
  };

  // -------------------------------------------------------------------------
  // TEST A: Pothole report at Location X
  // Expected: New incident formed
  // -------------------------------------------------------------------------
  console.log('[TEST A] Submitting Pothole Report at Location X...');
  const resA = await fetch(`${NEXT_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Dangerous deep pothole on the main road in front of school gate. Vehicles are skidding.',
      latitude: LOC_X.lat,
      longitude: LOC_X.lng,
      address: LOC_X.address,
      forceNewIncident: false
    })
  });

  if (!resA.ok) throw new Error(`TEST A HTTP failed: ${resA.status}`);
  const dataA = await resA.json();
  const repA = dataA.data.report;
  const incA = dataA.data.incident;

  console.log(` -> Report A ID: ${repA.id}`);
  console.log(` -> Incident A ID: ${incA.id} (isNewIncident: ${dataA.data.isNewIncident})`);
  console.log(` -> Category: ${incA.category}`);
  console.log(` -> Priority Score: ${incA.priorityScore}/100, Level: ${incA.priority}`);
  console.log(` -> Priority Reason: "${incA.priorityReason}"`);

  if (!dataA.data.isNewIncident) {
    throw new Error(`TEST A FAILED: Expected new incident, but merged into ${incA.id}`);
  }
  console.log('✅ PASS: TEST A formed New Incident successfully.\n');

  // Verify Priority Consistency on Incident A
  const incADb = await prisma.incident.findUnique({ where: { id: incA.id } });
  if (incADb.priorityReason.includes('/100)')) {
    const match = incADb.priorityReason.match(/\((\d+)\/100\)/);
    if (match && parseInt(match[1], 10) !== incADb.priorityScore) {
      throw new Error(`TEST A SCORE MISMATCH: Score is ${incADb.priorityScore} but reason says ${match[1]}`);
    }
  }
  console.log('✅ PASS: Incident A priority score and textual explanation are 100% consistent.\n');

  // -------------------------------------------------------------------------
  // TEST B: Same pothole with different wording at Location X
  // Expected: Merge into Test A incident
  // -------------------------------------------------------------------------
  console.log('[TEST B] Submitting same pothole with different wording (Hinglish) at Location X...');
  const resB = await fetch(`${NEXT_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Sadak par bahut bada gaddha hai school ke paas, do-wheelers phans rahe hain accident ka darr hai.',
      latitude: LOC_X.lat + 0.00005, // ~5 meters away
      longitude: LOC_X.lng + 0.00005,
      address: LOC_X.address,
      forceNewIncident: false
    })
  });

  if (!resB.ok) throw new Error(`TEST B HTTP failed: ${resB.status}`);
  const dataB = await resB.json();
  const repB = dataB.data.report;
  const incB = dataB.data.incident;

  console.log(` -> Report B ID: ${repB.id}`);
  console.log(` -> Connected Incident: ${incB.id} (isNewIncident: ${dataB.data.isNewIncident})`);
  console.log(` -> Correlation factors:`, dataB.data.matchReasons);
  console.log(` -> Main Priority Score: ${incB.priorityScore}/100`);
  console.log(` -> Incident Priority Reason: "${incB.priorityReason}"`);

  if (dataB.data.isNewIncident || incB.id !== incA.id) {
    throw new Error(`TEST B FAILED: Expected merge into ${incA.id}, got new incident ${incB.id}`);
  }
  console.log('✅ PASS: TEST B successfully merged into Test A incident.\n');

  // CRITICAL CHECK: Issue 1 Priority Score Inconsistency Verification
  const incBDb = await prisma.incident.findUnique({ where: { id: incB.id } });
  console.log(`[PRIORITY SCORE CONSISTENCY CHECK]`);
  console.log(`Main Priority Score: ${incBDb.priorityScore} / 100`);
  console.log(`Stored Priority Reason: "${incBDb.priorityReason}"`);

  if (incBDb.priorityReason.includes('/100)')) {
    const match = incBDb.priorityReason.match(/\((\d+)\/100\)/);
    if (match) {
      const scoreInReason = parseInt(match[1], 10);
      if (scoreInReason !== incBDb.priorityScore) {
        throw new Error(`ISSUE 1 REGRESSION: Main Priority Score is ${incBDb.priorityScore}/100 but reason says (${scoreInReason}/100)!`);
      }
      console.log(`✅ VERIFIED: Textual reason score (${scoreInReason}/100) EXACTLY MATCHES Main Priority Score (${incBDb.priorityScore}/100)!`);
    }
  } else {
    console.log(`✅ VERIFIED: Reason is a descriptive hazard string without conflicting numbers.`);
  }
  console.log('✅ PASS: Issue 1 (Priority Score Inconsistency) is 100% FIXED!\n');

  // -------------------------------------------------------------------------
  // TEST C: Broken streetlight at exactly Location X
  // Expected: New incident, NOT merged with pothole
  // -------------------------------------------------------------------------
  console.log('[TEST C] Submitting broken streetlight report at EXACTLY Location X...');
  const resC = await fetch(`${NEXT_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Streetlight pole 12 is completely broken and dark at night, no electricity.',
      latitude: LOC_X.lat,
      longitude: LOC_X.lng,
      address: LOC_X.address,
      forceNewIncident: false
    })
  });

  if (!resC.ok) throw new Error(`TEST C HTTP failed: ${resC.status}`);
  const dataC = await resC.json();
  const incC = dataC.data.incident;

  console.log(` -> Report C ID: ${dataC.data.report.id}`);
  console.log(` -> Incident C ID: ${incC.id} (isNewIncident: ${dataC.data.isNewIncident})`);
  console.log(` -> Category: ${incC.category}`);

  if (!dataC.data.isNewIncident || incC.id === incA.id) {
    throw new Error(`TEST C FAILED: Broken streetlight incorrectly merged with pothole incident ${incA.id}!`);
  }
  console.log('✅ PASS: TEST C created a separate new incident (Incompatible category gate prevented incorrect merge).\n');

  // -------------------------------------------------------------------------
  // TEST D: Similar pothole description but sufficiently far away (3500m away)
  // Expected: New incident
  // -------------------------------------------------------------------------
  console.log('[TEST D] Submitting similar pothole 3.5km away...');
  const resD = await fetch(`${NEXT_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Dangerous deep pothole on the main road in front of school gate. Vehicles are skidding.',
      latitude: LOC_X.lat + 0.035, // ~3.5 km away
      longitude: LOC_X.lng + 0.035,
      address: 'North Highway Sector 28',
      forceNewIncident: false
    })
  });

  if (!resD.ok) throw new Error(`TEST D HTTP failed: ${resD.status}`);
  const dataD = await resD.json();
  const incD = dataD.data.incident;

  console.log(` -> Report D ID: ${dataD.data.report.id}`);
  console.log(` -> Incident D ID: ${incD.id} (isNewIncident: ${dataD.data.isNewIncident})`);

  if (!dataD.data.isNewIncident || incD.id === incA.id) {
    throw new Error(`TEST D FAILED: Pothole 3.5km away incorrectly merged with incident ${incA.id}!`);
  }
  console.log('✅ PASS: TEST D created a new incident (Spatial distance threshold prevented incorrect merge).\n');

  // -------------------------------------------------------------------------
  // TEST E: Completely unrelated civic issue near Location X (Garbage dump 15m away)
  // Expected: No incorrect merge
  // -------------------------------------------------------------------------
  console.log('[TEST E] Submitting unrelated civic issue (Garbage dump) 15m from Location X...');
  const resE = await fetch(`${NEXT_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Huge rotting garbage dump overflowing with trash and plastic waste on sidewalk.',
      latitude: LOC_X.lat + 0.0001,
      longitude: LOC_X.lng + 0.0001,
      address: LOC_X.address,
      forceNewIncident: false
    })
  });

  if (!resE.ok) throw new Error(`TEST E HTTP failed: ${resE.status}`);
  const dataE = await resE.json();
  const incE = dataE.data.incident;

  console.log(` -> Report E ID: ${dataE.data.report.id}`);
  console.log(` -> Incident E ID: ${incE.id} (isNewIncident: ${dataE.data.isNewIncident})`);
  console.log(` -> Category: ${incE.category}`);

  if (!dataE.data.isNewIncident || incE.id === incA.id) {
    throw new Error(`TEST E FAILED: Garbage issue incorrectly merged with pothole incident ${incA.id}!`);
  }
  console.log('✅ PASS: TEST E created a separate incident (Unrelated issue not incorrectly merged).\n');

  console.log('================================================================================');
  console.log('🎉 ALL 5 CONTROLLED TESTS (TEST A, B, C, D, E) PASSED WITH 100% SUCCESS!');
  console.log('================================================================================\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Controlled test suite failed:', err);
  process.exit(1);
});
