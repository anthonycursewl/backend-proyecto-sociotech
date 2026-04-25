import { Inject, Injectable } from '@nestjs/common';
import { User } from '@identity/domain/entities/user.entity';
import type { UserRepository } from '@identity/domain/ports/user-repository.port';
import { USER_REPOSITORY } from '@identity/domain/ports/user-repository.port';
import type { AuthService, JwtTokens } from '@identity/domain/ports/auth-service.port';
import { AUTH_SERVICE } from '@identity/domain/ports/auth-service.port';
import { Email } from '@identity/domain/value-objects/email.vo';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
  tokens: JwtTokens;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = new Email(input.email);

    const user = await this.userRepository.findByEmail(email.value);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const isPasswordValid = await this.authService.verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = await Promise.all([
      this.authService.generateToken(payload),
      this.authService.generateRefreshToken(payload),
    ]);

    return {
      user,
      tokens: {
        accessToken: tokens[0],
        refreshToken: tokens[1],
      },
    };
  }
}