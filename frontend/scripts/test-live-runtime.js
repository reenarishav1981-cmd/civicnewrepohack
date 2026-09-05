const { spawn } = require('child_process');
const http = require('http');

async function testLiveWorkflow() {
  console.log("=== STARTING LIVE RUNTIME INTEGRATION TEST ===");

  function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  // 1. GET /api/incidents
  console.log("\n[TEST A] Testing GET /api/incidents...");
  const incRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents',
    method: 'GET'
  });
  console.log(`Status: ${incRes.status}, Success: ${incRes.data?.success}, Count: ${incRes.data?.count}`);
  if (incRes.status !== 200 || !incRes.data?.success) throw new Error("GET /api/incidents failed");

  // 2. GET /api/incidents/CP-1024
  console.log("\n[TEST B] Testing GET /api/incidents/CP-1024...");
  const detailRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1024',
    method: 'GET'
  });
  console.log(`Status: ${detailRes.status}, Title: ${detailRes.data?.data?.incident?.title?.substring(0, 30)}...`);
  console.log(`Connected Reports: ${detailRes.data?.data?.connectedReports?.length}, Assigned Team: ${detailRes.data?.data?.assignedTeam?.name}`);
  if (detailRes.status !== 200 || detailRes.data?.data?.incident?.id !== 'CP-1024') throw new Error("GET /api/incidents/CP-1024 failed");

  // 3. GET /api/teams
  console.log("\n[TEST C] Testing GET /api/teams...");
  const teamsRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/teams',
    method: 'GET'
  });
  console.log(`Status: ${teamsRes.status}, Teams: ${teamsRes.data?.count}`);
  if (teamsRes.status !== 200 || teamsRes.data?.count !== 4) throw new Error("GET /api/teams failed");

  // 4. GET /api/tasks
  console.log("\n[TEST D] Testing GET /api/tasks...");
  const tasksRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tasks?teamId=team-alpha',
    method: 'GET'
  });
  console.log(`Status: ${tasksRes.status}, Alpha Tasks: ${tasksRes.data?.count}`);
  if (tasksRes.status !== 200 || tasksRes.data?.count < 1) throw new Error("GET /api/tasks failed");

  // 5. GET /api/activity
  console.log("\n[TEST E] Testing GET /api/activity...");
  const actRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/activity',
    method: 'GET'
  });
  console.log(`Status: ${actRes.status}, Activity Logs: ${actRes.data?.count}`);
  if (actRes.status !== 200 || actRes.data?.count < 1) throw new Error("GET /api/activity failed");

  // 6. POST /api/reports (Submit realistic report)
  console.log("\n[TEST F] Testing POST /api/reports (Citizen report submission + AI correlation)...");
  const reportPayload = {
    description: "Deep dangerous crater pothole outside St. Xavier's school gate causing vehicle damage and major hazard.",
    category: "Road Hazard",
    latitude: 21.1702,
    longitude: 72.8311,
    address: "Opp. St. Xavier's Gate, Sector 3",
    userName: "Rohan Varma",
    userPhone: "+91 98222 33445"
  };
  const submitRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, reportPayload);
  console.log(`Status: ${submitRes.status}, Success: ${submitRes.data?.success}`);
  console.log(`Report ID: ${submitRes.data?.data?.report?.id}, Linked Incident ID: ${submitRes.data?.data?.connectedIncidentId}`);
  console.log(`AI Correlated?: ${submitRes.data?.data?.correlation?.isCorrelated}`);
  if (submitRes.status !== 200 || !submitRes.data?.success) throw new Error("POST /api/reports failed");

  // 7. POST /api/incidents/CP-1033/assign (Dispatch team-gamma)
  console.log("\n[TEST G] Testing POST /api/incidents/CP-1033/assign...");
  const assignRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/incidents/CP-1033/assign',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { teamId: "team-gamma", instructions: "Inspect circuit dark stretch and fix loop tripping." });
  console.log(`Status: ${assignRes.status}, Success: ${assignRes.data?.success}`);
  console.log(`Assigned Incident Status: ${assignRes.data?.data?.incident?.status}, Task Created: ${assignRes.data?.data?.task?.id}`);
  if (assignRes.status !== 200 || !assignRes.data?.success) throw new Error("POST /api/incidents/CP-1033/assign failed");

  // 8. PATCH /api/tasks/[id]/status (Worker advances status)
  const newTaskId = assignRes.data?.data?.task?.id;
  console.log(`\n[TEST H] Testing PATCH /api/tasks/${newTaskId}/status (Field Worker workflow)...`);
  const taskProgressRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/tasks/${newTaskId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: "in_progress", workerNotes: "On-site testing electrical transformer phases." });
  console.log(`Status: ${taskProgressRes.status}, Updated Task Status: ${taskProgressRes.data?.data?.task?.status}`);
  if (taskProgressRes.status !== 200 || taskProgressRes.data?.data?.task?.status !== 'in_progress') throw new Error("PATCH task status failed");

  console.log("\n=== ALL LIVE RUNTIME TESTS PASSED WITH 100% SUCCESS ===");
}

testLiveWorkflow().catch(err => {
  console.error("Live test failed:", err);
  process.exit(1);
});
