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
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true },
        orderBy: { permission: { name: 'asc' } },
      },
    },
    orderBy: { name: 'asc' },
  });

  for (const role of roles) {
    console.log(`\n=== ${role.name} ===`);
    const perms = role.permissions.map(rp => rp.permission.name);
    if (perms.length === 0) {
      console.log('  (no permissions)');
    } else {
      perms.forEach(p => console.log(`  - ${p}`));
    }
    console.log(`  Total: ${perms.length}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
