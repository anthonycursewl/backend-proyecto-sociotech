import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../domain/repositories/role-repository.port';
import { Role } from '../../domain/entities/role.entity';
import type { PaginatedRoles, RoleSummary, RoleDetail, PermissionSummary } from '../../domain/repositories/role-repository.port';

@Injectable()
export class RoleService {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: any) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.findAll();
  }

  async findManyCursor(cursor?: string, limit = 20): Promise<PaginatedRoles> {
    return this.roleRepo.findManyCursor(cursor, limit);
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepo.findByIdWithPermissions(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findDetail(id: string): Promise<RoleDetail> {
    const detail = await this.roleRepo.findDetailById(id);
    if (!detail) {
      throw new NotFoundException('Role not found');
    }
    return detail;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepo.findByName(name);
  }

  async create(data: { name: string; description?: string }): Promise<Role> {
    const existing = await this.roleRepo.findByName(data.name);
    if (existing) {
      throw new BadRequestException('Role with this name already exists');
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

  async update(id: string, data: { name?: string; description?: string }): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system role');
    }

    if (data.name) {
      const existing = await this.roleRepo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Role with this name already exists');
      }
    }

    role.update(data);
    return this.roleRepo.update(id, role);
  }

  async delete(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system role');
    }

    await this.roleRepo.softDelete(id);
  }

  async getTrashed(): Promise<RoleSummary[]> {
    return this.roleRepo.findTrashed();
  }

  async restore(id: string): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (!role.deletedAt) {
      throw new BadRequestException('Role is not in trash');
    }

    const restored = await this.roleRepo.restore(id);
    if (!restored) {
      throw new NotFoundException('Role not found');
    }
    return restored;
  }

  async permanentDelete(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (!role.deletedAt) {
      throw new BadRequestException('Role is not in trash');
    }

    await this.roleRepo.permanentDelete(id);
  }

  async addPermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system role permissions');
    }

    await this.roleRepo.addPermission(roleId, permissionId);
    return this.findById(roleId);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system role permissions');
    }

    await this.roleRepo.removePermission(roleId, permissionId);
    return this.findById(roleId);
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system role permissions');
    }

    await this.roleRepo.setPermissions(roleId, permissionIds);
    return this.findById(roleId);
  }

  async findAllPermissions(): Promise<PermissionSummary[]> {
    return this.roleRepo.findAllPermissions();
  }
}
