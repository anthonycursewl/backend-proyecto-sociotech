import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdminUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npm run seed:admin <email> <password> [role]');
    console.log('  role: ADMIN (default) or SUPER_ADMIN');
    console.log('');
    console.log('Example: npm run seed:admin admin@consultorio.com MiPassword123 SUPER_ADMIN');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const roleName = args[2] || 'ADMIN';

  if (!['ADMIN', 'SUPER_ADMIN'].includes(roleName)) {
    console.error('Role must be ADMIN or SUPER_ADMIN');
    process.exit(1);
  }

  console.log(`Creating ${roleName} user: ${email}`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (existingUser) {
    console.log('User already exists!');
    console.log(`Current role: ${existingUser.role.name}`);
    process.exit(1);
  }

  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    console.error(`Role ${roleName} not found. Run npm run seed:rbac first.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: role.id,
      isActive: true,
    },
    include: { role: true },
  });

  console.log(`\nUser created successfully!`);
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role.name}`);
  console.log(`Created at: ${user.createdAt}`);
}

createAdminUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());