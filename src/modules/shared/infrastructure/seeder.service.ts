import { Injectable, Logger } from '@nestjs/common';
import { PermissionsPrismaService } from '../../permissions/infrastructure/db/prisma.service';
import { RolesPrismaService } from '../../roles/infrastructure/db/prisma.service';
import { RoleName, Permission } from '../constants';

interface PermissionSeed {
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RoleSeed {
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly permissionsPrisma: PermissionsPrismaService,
    private readonly rolesPrisma: RolesPrismaService,
  ) {}

  async seed() {
    const permissions = this.getPermissions();
    const roles = this.getRoles();

    await this.seedPermissions(permissions);
    await this.seedRoles(roles);
    await this.assignPermissionsToRoles();
  }

  private getPermissions(): PermissionSeed[] {
    return [
      // Users
      {
        name: 'users:read',
        description: 'Ver usuarios',
        resource: 'users',
        action: 'read',
      },
      {
        name: 'users:create',
        description: 'Crear usuarios',
        resource: 'users',
        action: 'create',
      },
      {
        name: 'users:update',
        description: 'Actualizar usuarios',
        resource: 'users',
        action: 'update',
      },
      {
        name: 'users:delete',
        description: 'Eliminar usuarios',
        resource: 'users',
        action: 'delete',
      },
      {
        name: 'users:assign-role',
        description: 'Asignar rol a usuarios',
        resource: 'users',
        action: 'assign-role',
      },

      // Roles
      {
        name: 'roles:read',
        description: 'Ver roles',
        resource: 'roles',
        action: 'read',
      },
      {
        name: 'roles:create',
        description: 'Crear roles',
        resource: 'roles',
        action: 'create',
      },
      {
        name: 'roles:update',
        description: 'Actualizar roles',
        resource: 'roles',
        action: 'update',
      },
      {
        name: 'roles:delete',
        description: 'Eliminar roles',
        resource: 'roles',
        action: 'delete',
      },

      // Patients
      {
        name: 'patients:read',
        description: 'Ver pacientes',
        resource: 'patients',
        action: 'read',
      },
      {
        name: 'patients:read:own',
        description: 'Ver propio perfil de paciente',
        resource: 'patients',
        action: 'read:own',
      },
      {
        name: 'patients:create',
        description: 'Crear pacientes',
        resource: 'patients',
        action: 'create',
      },
      {
        name: 'patients:create:own',
        description: 'Registrar propio perfil de paciente',
        resource: 'patients',
        action: 'create:own',
      },
      {
        name: 'patients:update',
        description: 'Actualizar pacientes',
        resource: 'patients',
        action: 'update',
      },
      {
        name: 'patients:update:own',
        description: 'Actualizar propio perfil de paciente',
        resource: 'patients',
        action: 'update:own',
      },
      {
        name: 'patients:delete',
        description: 'Eliminar pacientes',
        resource: 'patients',
        action: 'delete',
      },
      {
        name: 'patients:register',
        description: 'Auto-registrar paciente',
        resource: 'patients',
        action: 'register',
      },

      // Services
      {
        name: 'services:read',
        description: 'Ver servicios',
        resource: 'services',
        action: 'read',
      },
      {
        name: 'services:create',
        description: 'Crear servicios',
        resource: 'services',
        action: 'create',
      },
      {
        name: 'services:update',
        description: 'Actualizar servicios',
        resource: 'services',
        action: 'update',
      },
      {
        name: 'services:delete',
        description: 'Eliminar servicios',
        resource: 'services',
        action: 'delete',
      },

      // Medical Records
      {
        name: 'medical-records:read',
        description: 'Ver historias clínicas',
        resource: 'medical-records',
        action: 'read',
      },
      {
        name: 'medical-records:read:own',
        description: 'Ver propias historias clínicas',
        resource: 'medical-records',
        action: 'read:own',
      },
      {
        name: 'medical-records:create',
        description: 'Crear historias clínicas',
        resource: 'medical-records',
        action: 'create',
      },
      {
        name: 'medical-records:update',
        description: 'Actualizar historias clínicas',
        resource: 'medical-records',
        action: 'update',
      },
      {
        name: 'medical-records:delete',
        description: 'Eliminar historias clínicas',
        resource: 'medical-records',
        action: 'delete',
      },
      {
        name: 'medical-records:sign',
        description: 'Firmar historias clínicas',
        resource: 'medical-records',
        action: 'sign',
      },

      // Appointments
      {
        name: 'appointments:read',
        description: 'Ver citas',
        resource: 'appointments',
        action: 'read',
      },
      {
        name: 'appointments:read:own',
        description: 'Ver propias citas',
        resource: 'appointments',
        action: 'read:own',
      },
      {
        name: 'appointments:create',
        description: 'Crear citas (admin)',
        resource: 'appointments',
        action: 'create',
      },
      {
        name: 'appointments:create:own',
        description: 'Crear propias citas',
        resource: 'appointments',
        action: 'create:own',
      },
      {
        name: 'appointments:update',
        description: 'Actualizar citas (admin)',
        resource: 'appointments',
        action: 'update',
      },
      {
        name: 'appointments:update:own',
        description: 'Actualizar propias citas',
        resource: 'appointments',
        action: 'update:own',
      },
      {
        name: 'appointments:cancel',
        description: 'Cancelar citas (admin)',
        resource: 'appointments',
        action: 'cancel',
      },
      {
        name: 'appointments:cancel:own',
        description: 'Cancelar propias citas',
        resource: 'appointments',
        action: 'cancel:own',
      },
      {
        name: 'appointments:manage',
        description: 'Gestionar todas las citas',
        resource: 'appointments',
        action: 'manage',
      },

      // Doctors
      {
        name: 'doctors:read',
        description: 'Ver doctores',
        resource: 'doctors',
        action: 'read',
      },
      {
        name: 'doctors:create',
        description: 'Crear doctores (admin)',
        resource: 'doctors',
        action: 'create',
      },
      {
        name: 'doctors:update',
        description: 'Actualizar doctores (admin)',
        resource: 'doctors',
        action: 'update',
      },
      {
        name: 'doctors:delete',
        description: 'Eliminar doctores (admin)',
        resource: 'doctors',
        action: 'delete',
      },
      {
        name: 'doctors:create:own',
        description: 'Doctor crea su propio perfil',
        resource: 'doctors',
        action: 'create:own',
      },
      {
        name: 'doctors:update:own',
        description: 'Doctor actualiza su propio perfil',
        resource: 'doctors',
        action: 'update:own',
      },
      {
        name: 'doctors:manage',
        description: 'Admin gestiona doctores (CRUD completo)',
        resource: 'doctors',
        action: 'manage',
      },

      // Schedules
      {
        name: 'schedules:create:own',
        description: 'Doctor crea sus propios horarios',
        resource: 'schedules',
        action: 'create:own',
      },
      {
        name: 'schedules:read:own',
        description: 'Doctor ve sus propios horarios',
        resource: 'schedules',
        action: 'read:own',
      },
      {
        name: 'schedules:update:own',
        description: 'Doctor actualiza sus propios horarios',
        resource: 'schedules',
        action: 'update:own',
      },
      {
        name: 'schedules:delete:own',
        description: 'Doctor elimina sus propios horarios',
        resource: 'schedules',
        action: 'delete:own',
      },
      {
        name: 'schedules:manage',
        description: 'Admin gestiona todos los horarios',
        resource: 'schedules',
        action: 'manage',
      },

      // Reports
      {
        name: 'reports:read',
        description: 'Ver reportes',
        resource: 'reports',
        action: 'read',
      },
      {
        name: 'reports:generate',
        description: 'Generar reportes',
        resource: 'reports',
        action: 'generate',
      },
      {
        name: 'reports:export',
        description: 'Exportar reportes',
        resource: 'reports',
        action: 'export',
      },

      // Audit
      {
        name: 'audit:read',
        description: 'Ver logs de auditoría',
        resource: 'audit',
        action: 'read',
      },
    ];
  }

  private getRoles(): RoleSeed[] {
    return [
      {
        name: RoleName.PATIENT,
        description: 'Paciente del consultorio',
        isSystem: true,
        permissions: [
          'services:read',
          'doctors:read',
          'appointments:create:own',
          'appointments:read:own',
          'appointments:cancel:own',
          'medical-records:read:own',
          'patients:read:own',
          'patients:create:own',
          'patients:update:own',
          'users:update:own',
        ],
      },
      {
        name: RoleName.ASSISTANT,
        description: 'Asistente/Recepcionista',
        isSystem: true,
        permissions: [
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
      },
      {
        name: RoleName.DOCTOR,
        description: 'Doctor del consultorio',
        isSystem: true,
        permissions: [
          'patients:read',
          'doctors:read',
          'doctors:create:own',
          'doctors:update:own',
          'appointments:read',
          'appointments:read:own',
          'appointments:update',
          'appointments:cancel',
          'medical-records:read',
          'medical-records:read:own',
          'medical-records:create',
          'medical-records:update',
          'medical-records:sign',
          'schedules:create:own',
          'schedules:read:own',
          'schedules:update:own',
          'schedules:delete:own',
          'services:read',
          'services:create',
          'services:update',
          'services:delete',
          'reports:read',
          'reports:generate',
        ],
      },
      {
        name: RoleName.ADMIN,
        description: 'Administrador del sistema',
        isSystem: true,
        permissions: [
          'users:read',
          'users:create',
          'users:update',
          'users:delete',
          'roles:read',
          'patients:read',
          'patients:create',
          'patients:update',
          'patients:delete',
          'services:read',
          'services:create',
          'services:update',
          'services:delete',
          'medical-records:read',
          'doctors:read',
          'doctors:create',
          'doctors:update',
          'doctors:delete',
          'doctors:manage',
          'schedules:manage',
          'appointments:read',
          'appointments:create',
          'appointments:update',
          'appointments:cancel',
          'appointments:manage',
          'reports:read',
          'reports:generate',
          'reports:export',
          'audit:read',
        ],
      },
      {
        name: RoleName.SUPER_ADMIN,
        description: 'Super Administrador - Acceso total',
        isSystem: true,
        permissions: [
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
          'roles:delete:permanent',
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
          'appointments:manage',
          'doctors:read',
          'doctors:create',
          'doctors:update',
          'doctors:delete',
          'doctors:manage',
          'schedules:manage',
          'reports:read',
          'reports:generate',
          'reports:export',
          'audit:read',
        ],
      },
    ];
  }

  private async seedPermissions(permissions: PermissionSeed[]) {
    for (const perm of permissions) {
      const existing = await this.permissionsPrisma.permission.findUnique({
        where: { name: perm.name },
      });
      if (!existing) {
        await this.permissionsPrisma.permission.create({
          data: {
            name: perm.name,
            description: perm.description,
            resource: perm.resource,
            action: perm.action,
          },
        });
        this.logger.log(`Created permission: ${perm.name}`);
      }
    }
  }

  private async seedRoles(roles: RoleSeed[]) {
    for (const role of roles) {
      const existing = await this.rolesPrisma.role.findUnique({
        where: { name: role.name },
      });
      if (!existing) {
        await this.rolesPrisma.role.create({
          data: {
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
          },
        });
        this.logger.log(`Created role: ${role.name}`);
      }
    }
  }

  private async assignPermissionsToRoles() {
    const roles = this.getRoles();

    for (const roleData of roles) {
      const role = await this.rolesPrisma.role.findUnique({
        where: { name: roleData.name },
      });
      if (!role) continue;

      for (const permName of roleData.permissions) {
        const permission = await this.permissionsPrisma.permission.findUnique({
          where: { name: permName },
        });
        if (!permission) {
          this.logger.warn(`Permission not found: ${permName}`);
          continue;
        }

        const existing = await this.rolesPrisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
        });
        if (!existing) {
          await this.rolesPrisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
      this.logger.log(`Assigned permissions to role: ${roleData.name}`);
    }
  }
}
