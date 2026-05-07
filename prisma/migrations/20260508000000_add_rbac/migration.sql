-- Migration: Add RBAC tables
CREATE TABLE "roles" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "description" TEXT, "isSystem" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "roles_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE TABLE "permissions" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "description" TEXT, "resource" TEXT NOT NULL, "action" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "permissions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");
CREATE TABLE "role_permissions" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "roleId" UUID NOT NULL, "permissionId" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");
ALTER TABLE "users" ADD COLUMN "roleId" UUID;
INSERT INTO "roles" ("id", "name", "description", "isSystem", "createdAt", "updatedAt") VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'PATIENT', 'Paciente', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002'::uuid, 'ASSISTANT', 'Asistente', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003'::uuid, 'DOCTOR', 'Doctor', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000004'::uuid, 'ADMIN', 'Admin', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000005'::uuid, 'SUPER_ADMIN', 'Super Admin', true, NOW(), NOW());
INSERT INTO "permissions" ("id", "name", "description", "resource", "action", "createdAt") VALUES
(gen_random_uuid(), 'users:read', 'Ver usuarios', 'users', 'read', NOW()),
(gen_random_uuid(), 'users:create', 'Crear usuarios', 'users', 'create', NOW()),
(gen_random_uuid(), 'users:update', 'Actualizar usuarios', 'users', 'update', NOW()),
(gen_random_uuid(), 'users:delete', 'Eliminar usuarios', 'users', 'delete', NOW()),
(gen_random_uuid(), 'users:assign-role', 'Asignar rol', 'users', 'assign-role', NOW()),
(gen_random_uuid(), 'roles:read', 'Ver roles', 'roles', 'read', NOW()),
(gen_random_uuid(), 'roles:create', 'Crear roles', 'roles', 'create', NOW()),
(gen_random_uuid(), 'roles:update', 'Actualizar roles', 'roles', 'update', NOW()),
(gen_random_uuid(), 'roles:delete', 'Eliminar roles', 'roles', 'delete', NOW()),
(gen_random_uuid(), 'patients:read', 'Ver pacientes', 'patients', 'read', NOW()),
(gen_random_uuid(), 'patients:create', 'Crear pacientes', 'patients', 'create', NOW()),
(gen_random_uuid(), 'patients:update', 'Actualizar pacientes', 'patients', 'update', NOW()),
(gen_random_uuid(), 'patients:delete', 'Eliminar pacientes', 'patients', 'delete', NOW()),
(gen_random_uuid(), 'patients:register', 'Auto-registrar', 'patients', 'register', NOW()),
(gen_random_uuid(), 'services:read', 'Ver servicios', 'services', 'read', NOW()),
(gen_random_uuid(), 'services:create', 'Crear servicios', 'services', 'create', NOW()),
(gen_random_uuid(), 'services:update', 'Actualizar servicios', 'services', 'update', NOW()),
(gen_random_uuid(), 'services:delete', 'Eliminar servicios', 'services', 'delete', NOW()),
(gen_random_uuid(), 'medical-records:read', 'Ver historias', 'medical-records', 'read', NOW()),
(gen_random_uuid(), 'medical-records:create', 'Crear historias', 'medical-records', 'create', NOW()),
(gen_random_uuid(), 'medical-records:update', 'Actualizar historias', 'medical-records', 'update', NOW()),
(gen_random_uuid(), 'medical-records:delete', 'Eliminar historias', 'medical-records', 'delete', NOW()),
(gen_random_uuid(), 'medical-records:sign', 'Firmar historias', 'medical-records', 'sign', NOW()),
(gen_random_uuid(), 'appointments:read', 'Ver citas', 'appointments', 'read', NOW()),
(gen_random_uuid(), 'appointments:create', 'Crear citas', 'appointments', 'create', NOW()),
(gen_random_uuid(), 'appointments:update', 'Actualizar citas', 'appointments', 'update', NOW()),
(gen_random_uuid(), 'appointments:cancel', 'Cancelar citas', 'appointments', 'cancel', NOW()),
(gen_random_uuid(), 'doctors:read', 'Ver doctores', 'doctors', 'read', NOW()),
(gen_random_uuid(), 'doctors:create', 'Crear doctores', 'doctors', 'create', NOW()),
(gen_random_uuid(), 'doctors:update', 'Actualizar doctores', 'doctors', 'update', NOW()),
(gen_random_uuid(), 'doctors:delete', 'Eliminar doctores', 'doctors', 'delete', NOW()),
(gen_random_uuid(), 'reports:read', 'Ver reportes', 'reports', 'read', NOW()),
(gen_random_uuid(), 'reports:generate', 'Generar reportes', 'reports', 'generate', NOW()),
(gen_random_uuid(), 'reports:export', 'Exportar reportes', 'reports', 'export', NOW()),
(gen_random_uuid(), 'audit:read', 'Ver audit', 'audit', 'read', NOW());
INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt") SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, id, NOW() FROM "permissions" WHERE "name" IN ('patients:register', 'services:read', 'appointments:read', 'medical-records:read');
INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt") SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000002'::uuid, id, NOW() FROM "permissions" WHERE "name" IN ('patients:read', 'patients:create', 'patients:update', 'services:read', 'appointments:read', 'appointments:create', 'appointments:update', 'doctors:read');
INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt") SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, id, NOW() FROM "permissions" WHERE "name" IN ('patients:read', 'patients:create', 'patients:update', 'services:read', 'services:create', 'services:update', 'services:delete', 'appointments:read', 'appointments:create', 'appointments:update', 'appointments:cancel', 'medical-records:read', 'medical-records:create', 'medical-records:update', 'medical-records:sign', 'doctors:read', 'reports:read', 'reports:generate');
INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt") SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000004'::uuid, id, NOW() FROM "permissions" WHERE "name" IN ('users:read', 'users:create', 'users:update', 'users:delete', 'roles:read', 'patients:read', 'patients:create', 'patients:update', 'patients:delete', 'services:read', 'services:create', 'services:update', 'services:delete', 'appointments:read', 'appointments:create', 'appointments:update', 'appointments:cancel', 'medical-records:read', 'medical-records:create', 'medical-records:update', 'medical-records:delete', 'medical-records:sign', 'doctors:read', 'doctors:create', 'doctors:update', 'doctors:delete', 'reports:read', 'reports:generate', 'reports:export', 'audit:read');
INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt") SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000005'::uuid, id, NOW() FROM "permissions";
UPDATE "users" SET "roleId" = CASE "role" WHEN 'PATIENT' THEN '00000000-0000-0000-0000-000000000001'::uuid WHEN 'ASSISTANT' THEN '00000000-0000-0000-0000-000000000002'::uuid WHEN 'DOCTOR' THEN '00000000-0000-0000-0000-000000000003'::uuid WHEN 'ADMIN' THEN '00000000-0000-0000-0000-000000000004'::uuid WHEN 'SUPER_ADMIN' THEN '00000000-0000-0000-0000-000000000005'::uuid ELSE '00000000-0000-0000-0000-000000000001'::uuid END;
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT;
ALTER TABLE "users" DROP COLUMN "role";
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE;
CREATE INDEX "users_roleId_idx" ON "users"("roleId");
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");