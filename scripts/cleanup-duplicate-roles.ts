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

const ROLE_MAP: Record<string, { newName: string; description: string }> = {
  PACIENTE: { newName: 'PATIENT', description: 'Paciente del consultorio' },
  ASISTENTE: { newName: 'ASSISTANT', description: 'Asistente/Recepcionista' },
  'SUPER ADMINISTRADOR': { newName: 'SUPER_ADMIN', description: 'Super Administrador - Acceso total' },
};

async function main() {
  console.log('\n=== Cleaning duplicate roles ===\n');

  // 1. Find all roles
  const allRoles = await prisma.role.findMany();
  console.log(`Total roles in DB: ${allRoles.length}\n`);

  // 2. Identify old (Spanish) and new (English) roles
  const oldIds: string[] = [];
  const dupIds: string[] = [];

  for (const [oldName, mapping] of Object.entries(ROLE_MAP)) {
    const oldRole = allRoles.find((r) => r.name === oldName);
    const newRole = allRoles.find((r) => r.name === mapping.newName);

    if (oldRole && newRole) {
      // Both exist -> update users to new role, delete old
      console.log(`"${oldName}" (${oldRole.id}) -> "${mapping.newName}" (${newRole.id}): updating users...`);
      const update = await prisma.user.updateMany({
        where: { roleId: oldRole.id },
        data: { roleId: newRole.id },
      });
      console.log(`  Updated ${update.count} users`);

      // Delete role_permissions for old role
      const delPerms = await prisma.rolePermission.deleteMany({
        where: { roleId: oldRole.id },
      });
      console.log(`  Deleted ${delPerms.count} role_permissions`);

      // Delete old role
      await prisma.role.delete({ where: { id: oldRole.id } });
      console.log(`  Deleted old role "${oldName}"`);

      oldIds.push(oldRole.id);
    } else if (oldRole && !newRole) {
      // Only old exists -> rename it
      console.log(`Renaming "${oldName}" (${oldRole.id}) -> "${mapping.newName}"`);
      await prisma.role.update({
        where: { id: oldRole.id },
        data: { name: mapping.newName, description: mapping.description },
      });
    }
  }

  // 3. Check for any other duplicates (same name, different IDs)
  const nameCounts = new Map<string, number>();
  for (const r of allRoles) {
    nameCounts.set(r.name, (nameCounts.get(r.name) || 0) + 1);
  }

  for (const [name, count] of nameCounts) {
    if (count > 1) {
      const dups = allRoles.filter((r) => r.name === name).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      // Keep the oldest one, delete the rest
      const keep = dups[0];
      for (let i = 1; i < dups.length; i++) {
        const del = dups[i];
        console.log(`Duplicate "${name}" (${del.id}): updating users to kept one (${keep.id})`);

        const update = await prisma.user.updateMany({
          where: { roleId: del.id },
          data: { roleId: keep.id },
        });
        if (update.count > 0) {
          console.log(`  Updated ${update.count} users`);
        }

        const delPerms = await prisma.rolePermission.deleteMany({
          where: { roleId: del.id },
        });
        if (delPerms.count > 0) {
          console.log(`  Deleted ${delPerms.count} role_permissions`);
        }

        await prisma.role.delete({ where: { id: del.id } });
        console.log(`  Deleted duplicate`);
      }
    }
  }

  // 4. Show final state
  console.log('\n=== Final role state ===\n');
  const finalRoles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { users: true } },
    },
  });

  for (const r of finalRoles) {
    console.log(`  ${r.name.padEnd(15)} ${r.id}  users: ${r._count.users}  ${r.deletedAt ? '[DELETED]' : ''}`);
  }

  console.log('\n=== Done ===\n');
  await prisma.$disconnect();
}

main().catch(console.error);
