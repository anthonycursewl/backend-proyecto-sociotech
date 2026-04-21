import { Inject, Injectable } from '@nestjs/common';
import { User, UserRole } from '@identity/domain/entities/user.entity';
import type { UserRepository } from '@identity/domain/ports/user-repository.port';
import { USER_REPOSITORY } from '@identity/domain/ports/user-repository.port';
import type { AuthService } from '@identity/domain/ports/auth-service.port';
import { AUTH_SERVICE } from '@identity/domain/ports/auth-service.port';
import { Email } from '@identity/domain/value-objects/email.vo';

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface RegisterUserOutput {
  user: User;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = new Email(input.email);

    const existingUser = await this.userRepository.findByEmail(email.value);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await this.authService.hashPassword(input.password);

    const user = new User({
      id: crypto.randomUUID(),
      email: email.value,
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    return { user: savedUser };
  }
}