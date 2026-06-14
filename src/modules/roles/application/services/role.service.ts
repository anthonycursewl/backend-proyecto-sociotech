import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../domain/repositories/role-repository.port';
import type { RoleRepository } from '../../domain/repositories/role-repository.port';
import { Role } from '../../domain/entities/role.entity';
import type {
  PaginatedRoles,
  RoleSummary,
  RoleDetail,
  PermissionSummary,
} from '../../domain/repositories/role-repository.port';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.findAll();
  }

  async findManyCursor(
    cursor?: string,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedRoles> {
    return this.roleRepo.findManyCursor(cursor, limit);
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepo.findByIdWithPermissions(id);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    return role;
  }

  async findDetail(id: string): Promise<RoleDetail> {
    const detail = await this.roleRepo.findDetailById(id);
    if (!detail) {
      throw new NotFoundException('Rol no encontrado');
    }
    return detail;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepo.findByName(name);
  }

  async create(data: { name: string; description?: string }): Promise<Role> {
    const existing = await this.roleRepo.findByName(data.name);
    if (existing) {
      throw new BadRequestException('Ya existe un rol con este nombre');
    }

    const role = new Role({
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
    });

    return this.roleRepo.save(role);
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (role.isSystem) {
      throw new ForbiddenException('No se puede modificar un rol del sistema');
    }

    if (data.name) {
      const existing = await this.roleRepo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Ya existe un rol con este nombre');
      }
    }

    role.update(data);
    return this.roleRepo.update(id, role);
  }

  async delete(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (role.isSystem) {
      throw new ForbiddenException('No se puede eliminar un rol del sistema');
    }

    await this.roleRepo.softDelete(id);
  }

  async getTrashed(): Promise<RoleSummary[]> {
    return this.roleRepo.findTrashed();
  }

  async restore(id: string): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (!role.deletedAt) {
      throw new BadRequestException('El rol no está en la papelera');
    }

    const restored = await this.roleRepo.restore(id);
    if (!restored) {
      throw new NotFoundException('Rol no encontrado');
    }
    return restored;
  }

  async permanentDelete(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (!role.deletedAt) {
      throw new BadRequestException('El rol no está en la papelera');
    }

    await this.roleRepo.permanentDelete(id);
  }

  async addPermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (role.isSystem) {
      throw new ForbiddenException('No se pueden modificar los permisos de un rol del sistema');
    }

    await this.roleRepo.addPermission(roleId, permissionId);
    return this.findById(roleId);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (role.isSystem) {
      throw new ForbiddenException('No se pueden modificar los permisos de un rol del sistema');
    }

    await this.roleRepo.removePermission(roleId, permissionId);
    return this.findById(roleId);
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (role.isSystem) {
      throw new ForbiddenException('No se pueden modificar los permisos de un rol del sistema');
    }

    await this.roleRepo.setPermissions(roleId, permissionIds);
    return this.findById(roleId);
  }

  async findAllPermissions(): Promise<PermissionSummary[]> {
    return this.roleRepo.findAllPermissions();
  }
}
