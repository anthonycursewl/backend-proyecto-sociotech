import { User, UserRole } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string, includePassword?: boolean): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
  update(id: string, data: Partial<User>): Promise<User>;
  findByRole(role: string): Promise<User[]>;
  search(query: string, limit?: number): Promise<User[]>;
}
