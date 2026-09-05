const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== RUNNING CIVICPULSE STAGE 2 INTEGRATION TESTS ===");

  // 1. Incidents
  const incidents = await prisma.incident.findMany();
  console.log(`[PASS] Read ${incidents.length} incidents from SQLite.`);
  if (!incidents.some(i => i.id === "CP-1024")) throw new Error("Missing CP-1024");

  // 2. Incident Detail with Relations
  const cp1024 = await prisma.incident.findUnique({
    where: { id: "CP-1024" },
    include: { reports: true, fieldTasks: true, timelineEvents: true }
  });
  console.log(`[PASS] Fetched CP-1024: ${cp1024.reports.length} reports, ${cp1024.fieldTasks.length} tasks, ${cp1024.timelineEvents.length} timeline events.`);

  // 3. Teams
  const teams = await prisma.fieldTeam.findMany();
  console.log(`[PASS] Read ${teams.length} field teams from SQLite.`);

  // 4. Tasks
  const tasks = await prisma.fieldTask.findMany();
  console.log(`[PASS] Read ${tasks.length} tasks from SQLite.`);

  // 5. Test Live Mutation & Persistence
  const testReportId = `R-TEST-${Date.now()}`;
  await prisma.citizenReport.create({
    data: {
      id: testReportId,
      userId: "usr-1",
      description: "Test persistence signal for verification",
      category: "Road Hazard",
      latitude: 21.1702,
      longitude: 72.8311,
      address: "Integration Test Location",
      status: "received"
    }
  });

  const verifiedReport = await prisma.citizenReport.findUnique({ where: { id: testReportId } });
  if (!verifiedReport) throw new Error("Persistence verification failed: created report not found");
  console.log(`[PASS] Created and verified new persistent report: ${verifiedReport.id}`);

  // Clean up test report
  await prisma.citizenReport.delete({ where: { id: testReportId } });
  console.log(`[PASS] Cleaned up temporary verification record.`);

  console.log("=== ALL STAGE 2 INTEGRATION TESTS PASSED ===");
  await prisma.$disconnect();
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
