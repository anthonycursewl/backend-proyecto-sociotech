import { Permission } from '../entities/permission.entity';

export const PERMISSION_REPOSITORY = 'PERMISSION_REPOSITORY';

export interface PermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  findByResource(resource: string): Promise<Permission[]>;
  save(permission: Permission): Promise<Permission>;
  delete(id: string): Promise<void>;
}