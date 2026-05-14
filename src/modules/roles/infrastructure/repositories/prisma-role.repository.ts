import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '../../domain/repositories/role-repository.port';
import { Role } from '../../domain/entities/role.entity';
import { RolesPrismaService } from '../db/prisma.service';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(
    @Inject(RolesPrismaService) private readonly prisma: RolesPrismaService,
  ) {}

  private toDomain(r: any, permissionIds: string[] = []): Role {
    return new Role({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      permissions: permissionIds,
    });
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany();
    return roles.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Role | null> {
    const r = await this.prisma.role.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const r = await this.prisma.role.findUnique({ where: { name } });
    return r ? this.toDomain(r) : null;
  }

  async findByIdWithPermissions(id: string): Promise<Role | null> {
    const r = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!r) return null;

    const permissionIds = r.permissions.map((rp: any) => rp.permissionId);
    return this.toDomain(r, permissionIds);
  }

  async save(role: Role): Promise<Role> {
    const r = await this.prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
    return this.toDomain(r);
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const updateData: any = {};
    if (data.description !== undefined)
      updateData.description = data.description;

    const r = await this.prisma.role.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(r);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async addPermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({
          data: { roleId, permissionId },
        }),
      ),
    ]);
  }
}
