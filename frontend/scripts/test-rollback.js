const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRollback() {
  console.log("=== RUNNING STAGE 3 TRANSACTION ROLLBACK VERIFICATION ===");

  // Capture baseline state of team-delta and incident CP-1033
  const initialTeam = await prisma.fieldTeam.findUnique({ where: { id: "team-delta" } });
  const initialIncident = await prisma.incident.findUnique({ where: { id: "CP-1033" } });
  const initialTaskCount = await prisma.fieldTask.count();
  const initialTimelineCount = await prisma.incidentTimelineEvent.count();

  console.log(`[Baseline] Team Delta Status: ${initialTeam.status}`);
  console.log(`[Baseline] Incident CP-1033 Status: ${initialIncident.status}`);
  console.log(`[Baseline] Total Tasks: ${initialTaskCount}, Total Timeline: ${initialTimelineCount}`);

  let errorCaught = false;

  // Execute an atomic transaction where step 4 fails deliberately
  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Verify incident exists (production query)
      const incRecord = await tx.incident.findUnique({ where: { id: "CP-1033" } });
      if (!incRecord) throw new Error("Incident not found");

      // Step 2: Verify team exists (production query)
      const teamRecord = await tx.fieldTeam.findUnique({ where: { id: "team-delta" } });
      if (!teamRecord) throw new Error("Team not found");

      // Step 3: Update team (production write)
      await tx.fieldTeam.update({
        where: { id: "team-delta" },
        data: { status: "dispatched", activeIncidentId: "CP-1033" }
      });

      // Step 4: Create Task (production write)
      await tx.fieldTask.create({
        data: {
          id: "TSK-ROLLBACK-TEST",
          incidentId: "CP-1033",
          teamId: "team-delta",
          workerName: teamRecord.leaderName,
          status: "assigned",
          priority: incRecord.priority,
          instructions: "Test rollback instructions",
          siteAddress: incRecord.address,
          latitude: incRecord.latitude,
          longitude: incRecord.longitude,
          distanceKm: 1.2,
          assignedAt: new Date()
        }
      });

      // Step 5: Timeline event (production write)
      await tx.incidentTimelineEvent.create({
        data: {
          incidentId: "CP-1033",
          title: "Team Dispatched",
          description: "Testing rollback event",
          type: "team_assigned",
          actor: "Operations Control"
        }
      });

      // Step 6: Activity log (production write)
      await tx.activityLog.create({
        data: {
          action: "Team Dispatched",
          entityType: "INCIDENT",
          entityId: "CP-1033",
          metadataJson: JSON.stringify({ actor: "Operations Control", type: "TEAM_ASSIGNED" })
        }
      });

      // Step 7: Incident status update (production write)
      await tx.incident.update({
        where: { id: "CP-1033" },
        data: { status: "assigned", assignedTeamId: "team-delta", assignedTeamName: teamRecord.name }
      });

      // FORCED FAILURE AT TAIL: Simulate failure (e.g. downstream network, disk error, unhandled violation)
      throw new Error("Simulated failure at tail of assign transaction");
    });
  } catch (err) {
    errorCaught = true;
    console.log(`[PASS] Transaction caught expected intentional error: "${err.message}"`);
  }

  if (!errorCaught) {
    throw new Error("Transaction failed to throw expected error");
  }

  // Inspect database after failure to verify 100% rollback
  const postTeam = await prisma.fieldTeam.findUnique({ where: { id: "team-delta" } });
  const postIncident = await prisma.incident.findUnique({ where: { id: "CP-1033" } });
  const postTaskCount = await prisma.fieldTask.count();
  const postTimelineCount = await prisma.incidentTimelineEvent.count();

  console.log(`[Post-Rollback] Team Delta Status: ${postTeam.status}`);
  console.log(`[Post-Rollback] Incident CP-1033 Status: ${postIncident.status}`);
  console.log(`[Post-Rollback] Total Tasks: ${postTaskCount}, Total Timeline: ${postTimelineCount}`);

  if (postTeam.status !== initialTeam.status) throw new Error("Rollback failed: Team status was mutated!");
  if (postIncident.status !== initialIncident.status) throw new Error("Rollback failed: Incident status was mutated!");
  if (postTaskCount !== initialTaskCount) throw new Error("Rollback failed: Task was persisted!");
  if (postTimelineCount !== initialTimelineCount) throw new Error("Rollback failed: Timeline event was persisted!");

  console.log("=== 100% ATOMIC TRANSACTION ROLLBACK CONFIRMED ===");
  await prisma.$disconnect();
}

testRollback().catch(err => {
  console.error("Rollback test failed:", err);
  process.exit(1);
});
