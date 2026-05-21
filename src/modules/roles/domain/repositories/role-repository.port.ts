import { Role } from '../entities/role.entity';

export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';

export interface PermissionSummary {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface RoleDetail {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: PermissionSummary[];
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedRoles {
  roles: RoleSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface RoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findDetailById(id: string): Promise<RoleDetail | null>;
  findByName(name: string): Promise<Role | null>;
  findByIdWithPermissions(id: string): Promise<Role | null>;
  save(role: Role): Promise<Role>;
  update(id: string, data: Partial<Role>): Promise<Role>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<Role | null>;
  permanentDelete(id: string): Promise<void>;
  findTrashed(): Promise<RoleSummary[]>;
  addPermission(roleId: string, permissionId: string): Promise<void>;
  removePermission(roleId: string, permissionId: string): Promise<void>;
  setPermissions(roleId: string, permissionIds: string[]): Promise<void>;
  findManyCursor(
    cursor?: string,
    limit?: number,
  ): Promise<PaginatedRoles>;
  findAllPermissions(): Promise<PermissionSummary[]>;
}
