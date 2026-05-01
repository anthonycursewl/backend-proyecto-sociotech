import { User, UserProps } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string, includePassword?: boolean): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
  update(id: string, data: Partial<User>): Promise<User>;
  updateRefreshToken(userId: string, hashedRefreshToken: string, expiresAt: Date): Promise<void>;
  findByRole(role: string): Promise<User[]>;
  search(query: string, limit?: number): Promise<User[]>;
}

export interface CreateUserParams {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserMapper {
  toDomain(prismaUser: any): User;
  toPersistence(user: User): any;
}