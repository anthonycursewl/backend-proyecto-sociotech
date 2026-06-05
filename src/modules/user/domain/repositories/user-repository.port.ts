import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PaginatedUsers {
  users: UserSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface PaginatedSimpleUsers {
  users: UserSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string, includePassword?: boolean): Promise<User | null>;
  findByIdWithRole(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
  update(id: string, data: Partial<User>): Promise<User>;
  updateRoleId(id: string, roleId: string): Promise<User>;
  updateRefreshToken(
    id: string,
    refreshToken: string | null,
    expires?: Date,
  ): Promise<void>;
  search(query: string, limit?: number): Promise<User[]>;
  findDefaultPatientRoleId(): Promise<string | null>;
  findManyCursor(
    cursor?: string,
    limit?: number,
    isActive?: boolean,
  ): Promise<PaginatedUsers>;
  findPatientsCursor(cursor?: string, limit?: number): Promise<PaginatedUsers>;
  findDoctorsCursor(cursor?: string, limit?: number): Promise<PaginatedUsers>;
  toggleActive(id: string): Promise<User>;
  assignRole(
    id: string,
    roleId: string,
    requesterUserId: string,
  ): Promise<User>;
}
