import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY,
  PermissionRepository,
} from '../../domain/repositories/permission-repository.port';
import { Permission } from '../../domain/entities/permission.entity';
import { PermissionsPrismaService } from '../db/prisma.service';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(
    @Inject(PermissionsPrismaService)
    private readonly prisma: PermissionsPrismaService,
  ) {}

  private toDomain(p: any): Permission {
    return new Permission({
      id: p.id,
      name: p.name,
      description: p.description,
      resource: p.resource,
      action: p.action,
      createdAt: p.createdAt,
    });
  }

  async findAll(): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany();
    return permissions.map((p) => this.toDomain(p));
  }

  async findById(id: string): Promise<Permission | null> {
    const p = await this.prisma.permission.findUnique({ where: { id } });
    return p ? this.toDomain(p) : null;
  }

  async findByName(name: string): Promise<Permission | null> {
    const p = await this.prisma.permission.findUnique({ where: { name } });
    return p ? this.toDomain(p) : null;
  }

  async findByResource(resource: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { resource },
    });
    return permissions.map((p) => this.toDomain(p));
  }

  async save(permission: Permission): Promise<Permission> {
    const p = await this.prisma.permission.create({
      data: {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        createdAt: permission.createdAt,
      },
    });
    return this.toDomain(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
}
