process.env.DATA_PROVIDER = 'memory';

import { getCivicRepository } from "../src/lib/repositories";

async function verifyMemory() {
  console.log("=== RUNNING IN-MEMORY DATA PROVIDER VERIFICATION ===");
  const repo = getCivicRepository();
  console.log("Active Repository Class:", repo.constructor.name);

  if (repo.constructor.name !== "InMemoryCivicRepository") {
    throw new Error(`Expected InMemoryCivicRepository, got ${repo.constructor.name}`);
  }

  // 1. GET incidents
  const incidents = await repo.getIncidents();
  console.log(`[PASS] getIncidents returned ${incidents.length} incidents.`);
  if (incidents.length === 0) throw new Error("No incidents found in memory provider");

  // 2. GET teams
  const teams = await repo.getTeams();
  console.log(`[PASS] getTeams returned ${teams.length} teams.`);
  if (teams.length === 0) throw new Error("No teams found in memory provider");

  // 3. GET tasks
  const tasks = await repo.getTasks();
  console.log(`[PASS] getTasks returned ${tasks.length} tasks.`);
  if (tasks.length === 0) throw new Error("No tasks found in memory provider");

  // 4. Test Assignment Workflow Contract
  console.log("\nTesting assignTeamToIncident on memory provider...");
  const assignResult = await repo.assignTeamToIncident("CP-1033", "team-delta", "Memory dispatch instructions");
  console.log(`[PASS] Assigned Incident: ${assignResult.incident.id}, Status: ${assignResult.incident.status}`);
  console.log(`[PASS] Created Task: ${assignResult.task.id}, Team Status: ${assignResult.team.status}`);

  if (assignResult.incident.status !== "assigned" || assignResult.team.status !== "dispatched") {
    throw new Error("Memory assignment failed contract invariants");
  }

  // 5. Test Duplicate Assignment Guard on Memory Provider
  console.log("\nTesting Duplicate Assignment Guard on memory provider...");
  let duplicateCaught = false;
  try {
    await repo.assignTeamToIncident("CP-1033", "team-delta", "Duplicate memory dispatch");
  } catch (err: any) {
    duplicateCaught = true;
    console.log(`[PASS] Memory provider rejected duplicate dispatch: "${err.message}"`);
  }
  if (!duplicateCaught) throw new Error("Memory provider allowed duplicate dispatch!");

  // 6. Test advanceTaskStatus Contract
  console.log("\nTesting advanceTaskStatus on memory provider...");
  const advanceResult = await repo.advanceTaskStatus(assignResult.task.id, "en_route");
  console.log(`[PASS] Task advanced to: ${advanceResult.task.status}`);
  if (advanceResult.task.status !== "en_route") throw new Error("Memory task advance failed");

  // 7. Test Atomic Report Intake Contract
  console.log("\nTesting processReportSubmissionAtomic on memory provider...");
  const intakeResult = await repo.processReportSubmissionAtomic({
    report: {
      id: "R-MEM-1",
      userId: "usr-1",
      userName: "Memory Tester",
      incidentId: "CP-1033",
      description: "Memory report test",
      category: "Road Hazard",
      latitude: 21.17,
      longitude: 72.83,
      address: "Memory Street",
      mediaType: "image",
      status: "received",
      createdAt: new Date().toISOString()
    },
    targetIncidentId: "CP-1033"
  });
  console.log(`[PASS] Report persisted: ${intakeResult.report.id}, Target: ${intakeResult.incident.id}`);

  console.log("\n=== IN-MEMORY REPOSITORY COMPATIBILITY VERIFIED SUCCESSFULLY ===");
}

verifyMemory().catch(err => {
  console.error("Memory verification failed:", err);
  process.exit(1);
});
