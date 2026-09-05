const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepAudit() {
  console.log("=== PRISMA SQLite DEEP AUDIT ===");
  
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, role: u.role })));

  const teams = await prisma.fieldTeam.findMany();
  console.log("Teams:", teams.map(t => ({ id: t.id, name: t.name, status: t.status, activeIncidentId: t.activeIncidentId })));

  const incidents = await prisma.incident.findMany({
    include: { reports: true, fieldTasks: true, timelineEvents: true }
  });
  console.log("Incidents:", incidents.map(i => ({
    id: i.id,
    title: i.title.substring(0, 30) + "...",
    status: i.status,
    priority: i.priority,
    reportsCount: i.reports.length,
    tasksCount: i.fieldTasks.length,
    timelineCount: i.timelineEvents.length
  })));

  const tasks = await prisma.fieldTask.findMany();
  console.log("Tasks:", tasks.map(t => ({ id: t.id, incidentId: t.incidentId, teamId: t.teamId, status: t.status })));

  const evidence = await prisma.evidence.count();
  console.log("Evidence count:", evidence);

  const correlationMatches = await prisma.correlationMatch.count();
  console.log("CorrelationMatch count:", correlationMatches);

  await prisma.$disconnect();
}

deepAudit().catch(console.error);
