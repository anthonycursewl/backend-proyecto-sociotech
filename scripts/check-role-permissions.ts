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
    orderBy: { createdAt: 'asc' },
    include: {
      permissions: {
        include: { permission: true },
        orderBy: { permission: { resource: 'asc' } },
      },
    },
  });

  for (const role of roles) {
    const header = `${role.name}${role.isSystem ? ' (system)' : ''}${role.deletedAt ? ' [DELETED]' : ''}`;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`  ${header}`);
    console.log(`  Description: ${role.description || 'N/A'}`);
    console.log(`  ID: ${role.id}`);
    console.log(`${'='.repeat(80)}`);

    if (role.permissions.length === 0) {
      console.log('  (no permissions)');
      continue;
    }

    const grouped: Record<string, typeof role.permissions> = {};
    for (const rp of role.permissions) {
      const resource = rp.permission.resource;
      if (!grouped[resource]) grouped[resource] = [];
      grouped[resource].push(rp);
    }

    for (const [resource, perms] of Object.entries(grouped)) {
      console.log(`\n  ── ${resource} ──`);
      for (const rp of perms) {
        console.log(`    ✔ ${rp.permission.name.padEnd(35)} ${rp.permission.description || ''}`);
      }
    }
    console.log();
  }

  await prisma.$disconnect();
}

main().catch(console.error);
