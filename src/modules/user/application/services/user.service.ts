import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { User } from '../../domain/entities/user.entity';
import type { UserRepository, UserSummary, PaginatedUsers } from '../../domain/repositories/user-repository.port';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.port';

export interface UpdateProfileInput {
  userId: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateProfileOutput {
  user: User;
}

export interface GetProfileOutput {
  user: User;
}

export interface ListUsersInput {
  cursor?: string;
  limit?: number;
  isActive?: boolean;
}

export interface ListUsersOutput {
  users: UserSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface ToggleUserActiveOutput {
  user: User;
}

export interface ChangeUserRoleInput {
  userId: string;
  roleId: string;
  requesterUserId: string;
}

export interface ChangeUserRoleOutput {
  user: User;
}

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async getProfile(userId: string): Promise<GetProfileOutput> {
    const user = await this.userRepository.findByIdWithRole(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { user };
  }

  async updateProfile(input: UpdateProfileInput): Promise<UpdateProfileOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Record<string, any> = {};
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;

    const updated = await this.userRepository.update(input.userId, updateData);
    return { user: updated };
  }

  async getPatients(): Promise<User[]> {
    const patients = await this.userRepository.findAll();
    return patients.filter((u) => u.roleName === 'PATIENT');
  }

  async getPatientsCursor(cursor?: string, limit = 20): Promise<PaginatedUsers> {
    return this.userRepository.findPatientsCursor(cursor, limit);
  }

  async getPatientById(patientId: string): Promise<User | null> {
    const patient = await this.userRepository.findByIdWithRole(patientId);
    if (!patient || patient.roleName !== 'PATIENT') {
      return null;
    }
    return patient;
  }

  async getDoctors(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    return users.filter((u) => u.roleName === 'DOCTOR');
  }

  async getDoctorsCursor(cursor?: string, limit = 20): Promise<PaginatedUsers> {
    return this.userRepository.findDoctorsCursor(cursor, limit);
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.userRepository.search(query, limit);
  }

  async listUsers(input: ListUsersInput): Promise<ListUsersOutput> {
    return this.userRepository.findManyCursor(input.cursor, input.limit ?? 20, input.isActive);
  }

  async toggleUserActive(userId: string, requesterUserId: string): Promise<ToggleUserActiveOutput> {
    if (userId === requesterUserId) {
      throw new ForbiddenException('Cannot toggle your own account');
    }
    const user = await this.userRepository.toggleActive(userId);
    return { user };
  }

  async changeUserRole(input: ChangeUserRoleInput): Promise<ChangeUserRoleOutput> {
    const user = await this.userRepository.assignRole(input.userId, input.roleId, input.requesterUserId);
    return { user };
  }
}
