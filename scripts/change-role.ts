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
  const userId = '6705a9cb-1070-4db8-b294-58b8e7f560c2';
  const roleId = '3c251709-4916-466e-a0d2-b782538a0f67';

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User ${userId} not found`);
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    console.error(`Role ${roleId} not found`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roleId },
  });

  console.log(`User ${user.email} (${userId}) → role ${role.name} (${roleId})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
