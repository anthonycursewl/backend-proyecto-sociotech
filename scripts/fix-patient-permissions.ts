import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Find PATIENT role
  const patientRole = await prisma.role.findUnique({ where: { name: 'PATIENT' } });
  if (!patientRole) {
    console.error('PATIENT role not found');
    await prisma.$disconnect();
    return;
  }

  // Remove non-self permissions from PATIENT (should only have :own variants)
  const permsToRemove = ['medical-records:read', 'appointments:read', 'patients:register'];

  for (const permName of permsToRemove) {
    const perm = await prisma.permission.findUnique({ where: { name: permName } });
    if (!perm) {
      console.log(`Permission ${permName} not found, skipping`);
      continue;
    }

    const result = await prisma.rolePermission.deleteMany({
      where: {
        roleId: patientRole.id,
        permissionId: perm.id,
      },
    });

    if (result.count > 0) {
      console.log(`Removed ${permName} from PATIENT`);
    } else {
      console.log(`${permName} was not assigned to PATIENT, skipping`);
    }
  }

  // Show updated PATIENT permissions
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: patientRole.id },
    include: { permission: true },
    orderBy: { permission: { name: 'asc' } },
  });

  console.log('\n=== PATIENT (updated) ===');
  for (const rp of rolePermissions) {
    console.log(`  - ${rp.permission.name}`);
  }
  console.log(`  Total: ${rolePermissions.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
