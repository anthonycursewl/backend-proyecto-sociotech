import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from '../../domain/repositories/permission-repository.port';
import type { PermissionRepository } from '../../domain/repositories/permission-repository.port';
import { Permission } from '../../domain/entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepo.findAll();
  }

  async findById(id: string): Promise<Permission | null> {
    return this.permissionRepo.findById(id);
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepo.findByResource(resource);
  }
}
