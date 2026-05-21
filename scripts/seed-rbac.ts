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

const PERMISSIONS = [
  // Users
  { name: 'users:read', description: 'Ver usuarios', resource: 'users', action: 'read' },
  { name: 'users:create', description: 'Crear usuarios', resource: 'users', action: 'create' },
  { name: 'users:update', description: 'Actualizar usuarios', resource: 'users', action: 'update' },
  { name: 'users:delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete' },
  { name: 'users:assign-role', description: 'Asignar rol a usuarios', resource: 'users', action: 'assign-role' },

  // Roles
  { name: 'roles:read', description: 'Ver roles', resource: 'roles', action: 'read' },
  { name: 'roles:create', description: 'Crear roles', resource: 'roles', action: 'create' },
  { name: 'roles:update', description: 'Actualizar roles', resource: 'roles', action: 'update' },
  { name: 'roles:delete', description: 'Eliminar roles (soft delete)', resource: 'roles', action: 'delete' },
  { name: 'roles:delete:permanent', description: 'Eliminar roles permanentemente', resource: 'roles', action: 'delete:permanent' },
  { name: 'roles:restore', description: 'Restaurar roles eliminados', resource: 'roles', action: 'restore' },

  // Patients
  { name: 'patients:read', description: 'Ver pacientes', resource: 'patients', action: 'read' },
  { name: 'patients:read:own', description: 'Ver propio perfil de paciente', resource: 'patients', action: 'read:own' },
  { name: 'patients:create', description: 'Crear pacientes', resource: 'patients', action: 'create' },
  { name: 'patients:create:own', description: 'Registrar propio perfil de paciente', resource: 'patients', action: 'create:own' },
  { name: 'patients:update', description: 'Actualizar pacientes', resource: 'patients', action: 'update' },
  { name: 'patients:update:own', description: 'Actualizar propio perfil de paciente', resource: 'patients', action: 'update:own' },
  { name: 'patients:delete', description: 'Eliminar pacientes', resource: 'patients', action: 'delete' },
  { name: 'patients:register', description: 'Auto-registrar paciente', resource: 'patients', action: 'register' },

  // Services
  { name: 'services:read', description: 'Ver servicios', resource: 'services', action: 'read' },
  { name: 'services:create', description: 'Crear servicios', resource: 'services', action: 'create' },
  { name: 'services:update', description: 'Actualizar servicios', resource: 'services', action: 'update' },
  { name: 'services:delete', description: 'Eliminar servicios', resource: 'services', action: 'delete' },

  // Medical Records
  { name: 'medical-records:read', description: 'Ver historias clinicas', resource: 'medical-records', action: 'read' },
  { name: 'medical-records:read:own', description: 'Ver propias historias clinicas', resource: 'medical-records', action: 'read:own' },
  { name: 'medical-records:create', description: 'Crear historias clinicas', resource: 'medical-records', action: 'create' },
  { name: 'medical-records:update', description: 'Actualizar historias clinicas', resource: 'medical-records', action: 'update' },
  { name: 'medical-records:delete', description: 'Eliminar historias clinicas', resource: 'medical-records', action: 'delete' },
  { name: 'medical-records:sign', description: 'Firmar historias clinicas', resource: 'medical-records', action: 'sign' },

  // Appointments
  { name: 'appointments:read', description: 'Ver citas', resource: 'appointments', action: 'read' },
  { name: 'appointments:read:own', description: 'Ver propias citas', resource: 'appointments', action: 'read:own' },
  { name: 'appointments:create', description: 'Crear citas (admin)', resource: 'appointments', action: 'create' },
  { name: 'appointments:create:own', description: 'Crear propias citas', resource: 'appointments', action: 'create:own' },
  { name: 'appointments:update', description: 'Actualizar citas (admin)', resource: 'appointments', action: 'update' },
  { name: 'appointments:cancel', description: 'Cancelar citas (admin)', resource: 'appointments', action: 'cancel' },
  { name: 'appointments:cancel:own', description: 'Cancelar propias citas', resource: 'appointments', action: 'cancel:own' },
  { name: 'appointments:manage', description: 'Gestionar todas las citas', resource: 'appointments', action: 'manage' },

  // Doctors
  { name: 'doctors:read', description: 'Ver doctores', resource: 'doctors', action: 'read' },
  { name: 'doctors:create', description: 'Crear doctores (admin)', resource: 'doctors', action: 'create' },
  { name: 'doctors:create:own', description: 'Doctor crea su propio perfil', resource: 'doctors', action: 'create:own' },
  { name: 'doctors:update', description: 'Actualizar doctores (admin)', resource: 'doctors', action: 'update' },
  { name: 'doctors:delete', description: 'Eliminar doctores (admin)', resource: 'doctors', action: 'delete' },
  { name: 'doctors:manage', description: 'Admin gestiona doctores (CRUD completo)', resource: 'doctors', action: 'manage' },

  // Schedules
  { name: 'schedules:create:own', description: 'Doctor gestiona sus propios horarios', resource: 'schedules', action: 'create:own' },
  { name: 'schedules:manage', description: 'Admin gestiona todos los horarios', resource: 'schedules', action: 'manage' },

  // Reports
  { name: 'reports:read', description: 'Ver reportes', resource: 'reports', action: 'read' },
  { name: 'reports:generate', description: 'Generar reportes', resource: 'reports', action: 'generate' },
  { name: 'reports:export', description: 'Exportar reportes', resource: 'reports', action: 'export' },

  // Audit
  { name: 'audit:read', description: 'Ver logs de auditoria', resource: 'audit', action: 'read' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  PATIENT: [
    'services:read',
    'appointments:create:own',
    'appointments:read:own',
    'appointments:cancel:own',
    'medical-records:read:own',
    'patients:read:own',
    'patients:update:own',
    'patients:create:own',
  ],
  ASSISTANT: [
    'patients:read',
    'patients:create',
    'patients:update',
    'services:read',
    'appointments:read',
    'appointments:create',
    'appointments:update',
    'doctors:read',
    'patients:read:own',
    'appointments:read:own',
  ],
  DOCTOR: [
    'patients:read',
    'patients:create',
    'patients:update',
    'services:read',
    'services:create',
    'services:update',
    'services:delete',
    'medical-records:read',
    'medical-records:create',
    'medical-records:update',
    'medical-records:sign',
    'appointments:read',
    'appointments:create',
    'appointments:update',
    'appointments:cancel',
    'doctors:read',
    'reports:read',
    'reports:generate',
    'doctors:create:own',
    'schedules:create:own',
    'appointments:read:own',
    'medical-records:read:own',
    'patients:read:own',
  ],
  ADMIN: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:assign-role',
    'roles:read',
    'roles:create',
    'roles:update',
    'roles:delete',
    'roles:restore',
    'patients:read',
    'patients:create',
    'patients:update',
    'patients:delete',
    'services:read',
    'services:create',
    'services:update',
    'services:delete',
    'medical-records:read',
    'medical-records:create',
    'medical-records:update',
    'medical-records:delete',
    'medical-records:sign',
    'appointments:read',
    'appointments:create',
    'appointments:update',
    'appointments:cancel',
    'doctors:read',
    'doctors:create',
    'doctors:update',
    'doctors:delete',
    'reports:read',
    'reports:generate',
    'reports:export',
    'audit:read',
    'doctors:manage',
    'schedules:manage',
    'appointments:manage',
  ],
  SUPER_ADMIN: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:assign-role',
    'roles:read',
    'roles:create',
    'roles:update',
    'roles:delete',
    'roles:delete:permanent',
    'roles:restore',
    'patients:read',
    'patients:create',
    'patients:update',
    'patients:delete',
    'patients:register',
    'services:read',
    'services:create',
    'services:update',
    'services:delete',
    'medical-records:read',
    'medical-records:create',
    'medical-records:update',
    'medical-records:delete',
    'medical-records:sign',
    'appointments:read',
    'appointments:create',
    'appointments:update',
    'appointments:cancel',
    'doctors:read',
    'doctors:create',
    'doctors:update',
    'doctors:delete',
    'reports:read',
    'reports:generate',
    'reports:export',
    'audit:read',
    'doctors:manage',
    'schedules:manage',
    'appointments:manage',
    'patients:read:own',
    'patients:create:own',
    'patients:update:own',
    'medical-records:read:own',
    'appointments:read:own',
    'appointments:create:own',
    'appointments:cancel:own',
    'doctors:create:own',
    'schedules:create:own',
  ],
};

async function seedPermissions() {
  console.log('\n=== Seeding Permissions ===');
  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { name: perm.name } });
    if (!existing) {
      await prisma.permission.create({ data: perm });
      console.log(`  + ${perm.name}`);
    } else {
      await prisma.permission.update({
        where: { name: perm.name },
        data: { description: perm.description, resource: perm.resource, action: perm.action },
      });
      console.log(`  ~ ${perm.name} (updated)`);
    }
  }
}

async function seedRoles() {
  console.log('\n=== Seeding Roles ===');
  const roles = [
    { name: 'PATIENT', description: 'Paciente del consultorio', isSystem: true },
    { name: 'ASSISTANT', description: 'Asistente/Recepcionista', isSystem: true },
    { name: 'DOCTOR', description: 'Doctor del consultorio', isSystem: true },
    { name: 'ADMIN', description: 'Administrador del sistema', isSystem: true },
    { name: 'SUPER_ADMIN', description: 'Super Administrador - Acceso total', isSystem: true },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`  + ${role.name}`);
    } else {
      console.log(`  ~ ${role.name} (already exists)`);
    }
  }
}

async function assignPermissionsToRoles() {
  console.log('\n=== Assigning Permissions to Roles ===');

  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`  ! Role ${roleName} not found, skipping`);
      continue;
    }

    const currentPerms = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });

    const currentPermNames = currentPerms.map(p => p.permission.name);
    const desiredPermNames = permNames;

    const toAdd = desiredPermNames.filter(n => !currentPermNames.includes(n));
    const toRemove = currentPermNames.filter(n => !desiredPermNames.includes(n));

    for (const permName of toRemove) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (permission) {
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id, permissionId: permission.id },
        });
        console.log(`  - ${roleName} <- ${permName} (removed)`);
      }
    }

    for (const permName of toAdd) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      if (!permission) {
        console.log(`  ! Permission ${permName} not found, skipping`);
        continue;
      }

      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      });
      if (existing) {
        console.log(`  ~ ${roleName} <- ${permName} (already exists, skipping)`);
        continue;
      }

      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
      console.log(`  + ${roleName} <- ${permName}`);
    }

    if (toAdd.length === 0 && toRemove.length === 0) {
      console.log(`  ~ ${roleName} (permissions up to date)`);
    }
  }
}

async function main() {
  console.log('\n========================================');
  console.log('   RBAC Seeder - Updated Permissions   ');
  console.log('========================================');

  await seedPermissions();
  await seedRoles();
  await assignPermissionsToRoles();

  console.log('\n========================================');
  console.log('   Seed completed successfully!        ');
  console.log('========================================\n');

  const roles = ['PATIENT', 'ASSISTANT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'];
  for (const roleName of roles) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: { include: { permission: true } } },
    });
    if (role) {
      console.log(`${roleName}: ${role.permissions.map(p => p.permission.name).join(', ')}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());