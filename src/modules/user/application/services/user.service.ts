import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import type { User } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user-repository.port';
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

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async getProfile(userId: string): Promise<GetProfileOutput> {
    const user = await this.userRepository.findById(userId);
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

    const updated = await this.userRepository.update(input.userId, updateData as any);
    return { user: updated };
  }

  async getPatients(): Promise<User[]> {
    return this.userRepository.findByRole(UserRole.PATIENT);
  }

  async getPatientById(patientId: string): Promise<User | null> {
    const patient = await this.userRepository.findById(patientId);
    if (!patient || patient.role !== UserRole.PATIENT) {
      return null;
    }
    return patient;
  }

  async getDoctors(): Promise<User[]> {
    return this.userRepository.findByRole(UserRole.DOCTOR);
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.userRepository.search(query, limit);
  }
}
