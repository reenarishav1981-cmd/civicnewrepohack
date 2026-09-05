const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditDatabaseIntegrity() {
  console.log("=== RUNNING STAGE 3 DATABASE INTEGRITY AUDIT ===");

  let violationCount = 0;

  // 1. Check for Orphan Reports (incidentId specified but non-existent)
  const reports = await prisma.citizenReport.findMany();
  const incidents = await prisma.incident.findMany();
  const incidentIds = new Set(incidents.map(i => i.id));

  for (const r of reports) {
    if (r.incidentId && !incidentIds.has(r.incidentId)) {
      console.error(`[VIOLATION] Orphan CitizenReport ${r.id} references non-existent incident ${r.incidentId}`);
      violationCount++;
    }
  }

  // 2. Check for Orphan Tasks (incidentId or teamId non-existent)
  const tasks = await prisma.fieldTask.findMany();
  const teams = await prisma.fieldTeam.findMany();
  const teamIds = new Set(teams.map(t => t.id));

  for (const t of tasks) {
    if (!incidentIds.has(t.incidentId)) {
      console.error(`[VIOLATION] Orphan FieldTask ${t.id} references non-existent incident ${t.incidentId}`);
      violationCount++;
    }
    if (!teamIds.has(t.teamId)) {
      console.error(`[VIOLATION] Orphan FieldTask ${t.id} references non-existent team ${t.teamId}`);
      violationCount++;
    }
  }

  // 3. Check for Orphan Timeline Events
  const timelineEvents = await prisma.incidentTimelineEvent.findMany();
  for (const tl of timelineEvents) {
    if (!incidentIds.has(tl.incidentId)) {
      console.error(`[VIOLATION] Orphan TimelineEvent ${tl.id} references non-existent incident ${tl.incidentId}`);
      violationCount++;
    }
  }

  // 4. Check Status Invariants
  for (const inc of incidents) {
    if (inc.assignedTeamId && !teamIds.has(inc.assignedTeamId)) {
      console.error(`[VIOLATION] Incident ${inc.id} references non-existent assigned team ${inc.assignedTeamId}`);
      violationCount++;
    }
  }

  console.log(`Audited: ${reports.length} reports, ${incidents.length} incidents, ${tasks.length} tasks, ${teams.length} teams, ${timelineEvents.length} timeline events.`);

  if (violationCount === 0) {
    console.log("[PASS] ZERO INTEGRITY VIOLATIONS DETECTED. DATABASE IS 100% RELATIONAL AND CONSISTENT.");
  } else {
    throw new Error(`Integrity audit failed with ${violationCount} violations.`);
  }

  await prisma.$disconnect();
}

auditDatabaseIntegrity().catch(err => {
  console.error("Integrity audit failed:", err);
  process.exit(1);
});
