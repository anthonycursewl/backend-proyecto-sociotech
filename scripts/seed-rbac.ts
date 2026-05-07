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

const ROLES = [
  { name: 'PATIENT', description: 'Paciente del consultorio', isSystem: true },
  { name: 'ASSISTANT', description: 'Asistente/Recepcionista', isSystem: true },
  { name: 'DOCTOR', description: 'Doctor del consultorio', isSystem: true },
  { name: 'ADMIN', description: 'Administrador del sistema', isSystem: true },
  { name: 'SUPER_ADMIN', description: 'Super Administrador - Acceso total', isSystem: true },
];

const PERMISSIONS = [
  { name: 'users:read', description: 'Ver usuarios', resource: 'users', action: 'read' },
  { name: 'users:create', description: 'Crear usuarios', resource: 'users', action: 'create' },
  { name: 'users:update', description: 'Actualizar usuarios', resource: 'users', action: 'update' },
  { name: 'users:delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete' },
  { name: 'users:assign-role', description: 'Asignar rol a usuarios', resource: 'users', action: 'assign-role' },
  { name: 'roles:read', description: 'Ver roles', resource: 'roles', action: 'read' },
  { name: 'roles:create', description: 'Crear roles', resource: 'roles', action: 'create' },
  { name: 'roles:update', description: 'Actualizar roles', resource: 'roles', action: 'update' },
  { name: 'roles:delete', description: 'Eliminar roles', resource: 'roles', action: 'delete' },
  { name: 'patients:read', description: 'Ver pacientes', resource: 'patients', action: 'read' },
  { name: 'patients:create', description: 'Crear pacientes', resource: 'patients', action: 'create' },
  { name: 'patients:update', description: 'Actualizar pacientes', resource: 'patients', action: 'update' },
  { name: 'patients:delete', description: 'Eliminar pacientes', resource: 'patients', action: 'delete' },
  { name: 'patients:register', description: 'Auto-registrar paciente', resource: 'patients', action: 'register' },
  { name: 'services:read', description: 'Ver servicios', resource: 'services', action: 'read' },
  { name: 'services:create', description: 'Crear servicios', resource: 'services', action: 'create' },
  { name: 'services:update', description: 'Actualizar servicios', resource: 'services', action: 'update' },
  { name: 'services:delete', description: 'Eliminar servicios', resource: 'services', action: 'delete' },
  { name: 'medical-records:read', description: 'Ver historias clinicas', resource: 'medical-records', action: 'read' },
  { name: 'medical-records:create', description: 'Crear historias clinicas', resource: 'medical-records', action: 'create' },
  { name: 'medical-records:update', description: 'Actualizar historias clinicas', resource: 'medical-records', action: 'update' },
  { name: 'medical-records:delete', description: 'Eliminar historias clinicas', resource: 'medical-records', action: 'delete' },
  { name: 'medical-records:sign', description: 'Firmar historias clinicas', resource: 'medical-records', action: 'sign' },
  { name: 'appointments:read', description: 'Ver citas', resource: 'appointments', action: 'read' },
  { name: 'appointments:create', description: 'Crear citas', resource: 'appointments', action: 'create' },
  { name: 'appointments:update', description: 'Actualizar citas', resource: 'appointments', action: 'update' },
  { name: 'appointments:cancel', description: 'Cancelar citas', resource: 'appointments', action: 'cancel' },
  { name: 'doctors:read', description: 'Ver doctores', resource: 'doctors', action: 'read' },
  { name: 'doctors:create', description: 'Crear doctores', resource: 'doctors', action: 'create' },
  { name: 'doctors:update', description: 'Actualizar doctores', resource: 'doctors', action: 'update' },
  { name: 'doctors:delete', description: 'Eliminar doctores', resource: 'doctors', action: 'delete' },
  { name: 'reports:read', description: 'Ver reportes', resource: 'reports', action: 'read' },
  { name: 'reports:generate', description: 'Generar reportes', resource: 'reports', action: 'generate' },
  { name: 'reports:export', description: 'Exportar reportes', resource: 'reports', action: 'export' },
  { name: 'audit:read', description: 'Ver logs de auditoria', resource: 'audit', action: 'read' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  PATIENT: ['patients:register', 'services:read', 'appointments:read', 'medical-records:read'],
  ASSISTANT: ['patients:read', 'patients:create', 'patients:update', 'services:read', 'appointments:read', 'appointments:create', 'appointments:update', 'doctors:read'],
  DOCTOR: [
    'patients:read', 'patients:create', 'patients:update',
    'services:read', 'services:create', 'services:update', 'services:delete',
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:cancel',
    'medical-records:read', 'medical-records:create', 'medical-records:update', 'medical-records:sign',
    'doctors:read', 'reports:read', 'reports:generate',
  ],
  ADMIN: [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'roles:read',
    'patients:read', 'patients:create', 'patients:update', 'patients:delete',
    'services:read', 'services:create', 'services:update', 'services:delete',
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:cancel',
    'medical-records:read', 'medical-records:create', 'medical-records:update', 'medical-records:delete', 'medical-records:sign',
    'doctors:read', 'doctors:create', 'doctors:update', 'doctors:delete',
    'reports:read', 'reports:generate', 'reports:export',
    'audit:read',
  ],
  SUPER_ADMIN: PERMISSIONS.map(p => p.name),
};

async function main() {
  console.log('Seeding roles and permissions...\n');

  // Seed permissions
  console.log('Creating permissions...');
  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { name: perm.name } });
    if (!existing) {
      await prisma.permission.create({ data: perm });
      console.log(`  + ${perm.name}`);
    } else {
      console.log(`  ~ ${perm.name} (already exists)`);
    }
  }

  // Seed roles
  console.log('\nCreating roles...');
  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`  + ${role.name}`);
    } else {
      console.log(`  ~ ${role.name} (already exists)`);
    }
  }

  // Assign permissions to roles
  console.log('\nAssigning permissions to roles...');
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`  ! Role ${roleName} not found, skipping`);
      continue;
    }

    for (const permName of permNames) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (!permission) {
        console.log(`  ! Permission ${permName} not found, skipping`);
        continue;
      }

      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permission.id },
        });
        console.log(`  + ${roleName} <- ${permName}`);
      } else {
        console.log(`  ~ ${roleName} <- ${permName} (already exists)`);
      }
    }
  }

  console.log('\nSeed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());