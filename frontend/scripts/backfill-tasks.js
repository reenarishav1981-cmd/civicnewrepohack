const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.fieldTask.updateMany({
    where: { workerName: 'Rajesh Kumar' },
    data: { assignedWorkerId: 'usr-4' }
  });
  console.log('Backfill result:', res);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
