const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Users:', await prisma.user.count());
  console.log('Teams:', await prisma.fieldTeam.count());
  console.log('Incidents:', await prisma.incident.count());
  console.log('Reports:', await prisma.citizenReport.count());
  console.log('Tasks:', await prisma.fieldTask.count());
  console.log('Timeline:', await prisma.incidentTimelineEvent.count());
  console.log('Activity:', await prisma.activityLog.count());
  await prisma.$disconnect();
}

check();
