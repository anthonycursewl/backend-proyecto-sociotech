import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n=== Testing isActive filter ===\n');

  const all = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: 'desc' },
  });

  const active = all.filter((u) => u.isActive);
  const inactive = all.filter((u) => !u.isActive);

  console.log(`Total users: ${all.length}`);
  console.log(`Active: ${active.length}`);
  console.log(`Inactive: ${inactive.length}\n`);

  if (inactive.length === 0) {
    console.log('No inactive users found. Creating one for testing...\n');

    const target = all.find((u) => u.role.name !== 'SUPER_ADMIN');
    if (!target) {
      console.log('No non-SUPER_ADMIN user found to deactivate.');
      return;
    }

    const deactivated = await prisma.user.update({
      where: { id: target.id },
      data: { isActive: false },
      include: { role: true },
    });
    console.log(`Deactivated: ${deactivated.firstName} ${deactivated.lastName} (${deactivated.email})\n`);
  }

  const verifyInactive = await prisma.user.findMany({
    where: { isActive: false },
    include: { role: true },
  });
  console.log(`DB query (isActive=false): ${verifyInactive.length} users`);
  verifyInactive.forEach((u) => {
    console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) [${u.role.name}] isActive=${u.isActive}`);
  });

  console.log('\n=== Testing cursor-based queries ===\n');

  const noFilter = await prisma.user.findMany({
    take: 21,
    orderBy: { id: 'desc' },
    include: { role: true },
  });
  console.log(`No filter: ${noFilter.length} users`);

  const activeOnly = await prisma.user.findMany({
    where: { isActive: true },
    take: 21,
    orderBy: { id: 'desc' },
    include: { role: true },
  });
  console.log(`isActive=true: ${activeOnly.length} users`);

  const inactiveOnly = await prisma.user.findMany({
    where: { isActive: false },
    take: 21,
    orderBy: { id: 'desc' },
    include: { role: true },
  });
  console.log(`isActive=false: ${inactiveOnly.length} users`);

  console.log('\n=== Done ===\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
