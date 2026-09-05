const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEXT_API_BASE = 'http://localhost:3000';
const FASTAPI_BASE = 'http://127.0.0.1:8000';

async function run() {
  console.log('================================================');
  console.log('CIVICPULSE LIVE AI PIPELINE VERIFICATION');
  console.log('================================================\n');

  let fastApiReachable = false;
  let aiEndpointInvoked = false;
  let providerUsed = 'unknown';
  let fallbackUsed = false;
  let reportSubmissionSuccess = false;
  let aiCategoryPersisted = false;
  let aiSeverityPersisted = false;
  let aiPriorityPersisted = false;
  let aiExplanationPersisted = false;
  let incidentId = null;

  // STEP 1: Check http://127.0.0.1:8000/health
  console.log('[STEP 1] Checking http://127.0.0.1:8000/health...');
  try {
    const healthRes = await fetch(FASTAPI_BASE + '/health');
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      fastApiReachable = healthData.status === 'healthy';
      console.log('[PASS] FastAPI Reachable: YES');
    } else {
      console.log('[FAIL] FastAPI HTTP: ' + healthRes.status);
    }
  } catch (err) {
    console.log('[FAIL] FastAPI Error: ' + err.message);
  }

  // STEP 2: Call the FastAPI AI endpoint directly
  console.log('\n[STEP 2] Calling FastAPI /analyze/full directly...');
  try {
    const directRes = await fetch(FASTAPI_BASE + '/analyze/full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'School ke paas bahut bada pothole hai, accident ka danger hai.',
        latitude: 21.1702,
        longitude: 72.8311,
        existing_incidents: []
      })
    });

    if (directRes.ok) {
      const directData = await directRes.json();
      aiEndpointInvoked = true;
      providerUsed = (directData.meta && directData.meta.provider) || 'unknown';
      fallbackUsed = directData.meta ? directData.meta.fallback : false;
      console.log('[PASS] AI Endpoint Invoked: YES');
      console.log('   Provider: ' + providerUsed);
      console.log('   Model: ' + (directData.meta ? directData.meta.model : 'unknown'));
      console.log('   Fallback: ' + fallbackUsed);
    } else {
      console.log('[FAIL] Direct call failed: ' + directRes.status);
    }
  } catch (err) {
    console.log('[FAIL] Direct call error: ' + err.message);
  }

  // STEP 3: Submit a REAL report through Next.js API
  console.log('\n[STEP 3] Submitting report through Next.js API (POST /api/reports)...');
  try {
    const reportRes = await fetch(NEXT_API_BASE + '/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'School ke paas bahut bada pothole hai, accident ka danger hai. LIVE RUNTIME VERIFICATION RUN.',
        latitude: 21.1702,
        longitude: 72.8311,
        address: 'Near Model School Gate, North Sector',
        forceNewIncident: true
      })
    });

    if (reportRes.ok) {
      const reportJson = await reportRes.json();
      if (reportJson.success) {
        reportSubmissionSuccess = true;
        incidentId = reportJson.data.incident.id;
        console.log('[PASS] Next.js Report Submission: SUCCESS (ID: ' + incidentId + ')');
      }
    } else {
      console.log('[FAIL] Next.js HTTP: ' + reportRes.status);
    }
  } catch (err) {
    console.log('[FAIL] Next.js Error: ' + err.message);
  }

  // STEP 4, 5, 6: Inspect database record
  console.log('\n[STEP 4, 5, 6] Inspecting SQLite database for persisted AI metadata...');
  if (incidentId) {
    const dbIncident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { reports: true }
    });

    if (dbIncident) {
      aiCategoryPersisted = Boolean(dbIncident.category);
      aiPriorityPersisted = dbIncident.priorityScore > 0;
      let explanations = [];
      try {
        explanations = JSON.parse(dbIncident.aiExplanationJson || '[]');
      } catch (e) {
        explanations = [];
      }
      aiExplanationPersisted = explanations.length > 0;
      aiSeverityPersisted = explanations.some(function(e) {
        return e.detail && e.detail.toLowerCase().indexOf('severity') !== -1;
      });

      console.log('[PASS] Incident persisted in DB: ' + dbIncident.id);
      console.log('   AI Category: ' + dbIncident.category);
      console.log('   AI Priority Score: ' + dbIncident.priorityScore);
      console.log('   AI Explanations Count: ' + explanations.length);
    }
  }

  await prisma.$disconnect();

  console.log('\n================================================');
  console.log('CIVICPULSE LIVE AI PIPELINE VERIFICATION');
  console.log('================================================');
  console.log('FastAPI reachable: ' + (fastApiReachable ? 'YES' : 'NO'));
  console.log('AI endpoint invoked: ' + (aiEndpointInvoked ? 'YES' : 'NO'));
  console.log('Provider used: ' + providerUsed);
  console.log('Fallback used: ' + fallbackUsed);
  console.log('');
  console.log('Next.js report submission: ' + (reportSubmissionSuccess ? 'SUCCESS' : 'FAILED'));
  console.log('');
  console.log('AI category persisted: ' + (aiCategoryPersisted ? 'YES' : 'NO'));
  console.log('AI severity persisted: ' + (aiSeverityPersisted ? 'YES' : 'NO'));
  console.log('AI priority persisted: ' + (aiPriorityPersisted ? 'YES' : 'NO'));
  console.log('AI explanation persisted: ' + (aiExplanationPersisted ? 'YES' : 'NO'));
  console.log('');
  console.log('Database incident ID: ' + (incidentId || 'N/A'));
  console.log('');
  console.log('FINAL RESULT:');
  var allOk = fastApiReachable && aiEndpointInvoked && reportSubmissionSuccess && aiCategoryPersisted && aiPriorityPersisted && aiExplanationPersisted;
  console.log(allOk ? 'END-TO-END AI PIPELINE VERIFIED' : 'VERIFICATION FAILED');
  console.log('================================================\n');

  if (!allOk) process.exit(1);
}

run().catch(function(e) {
  console.error(e);
  process.exit(1);
});
