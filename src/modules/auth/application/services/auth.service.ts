import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user-repository.port';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.port';
import { User } from '@user/domain/entities/user.entity';
import { BcryptAuthService } from '../../infrastructure/strategies/bcrypt-auth.service';
import { JwtService } from '@nestjs/jwt';
import { RedisEventBus, DomainEvent } from '../../infrastructure/events';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRES_IN = '2h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '30d';

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly bcryptAuth: BcryptAuthService,
    private readonly jwtService: JwtService,
    private readonly eventBus: RedisEventBus,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedFirstName = dto.firstName.trim();
    const normalizedLastName = dto.lastName.trim();

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await this.bcryptAuth.hashPassword(dto.password);

    const defaultRole = await this.userRepo.findDefaultPatientRoleId();
    if (!defaultRole) {
      throw new Error('PATIENT role not found. Please run seeder.');
    }

    const user = new User({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      roleId: defaultRole,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.userRepo.save(user);

    const userWithRole = await this.userRepo.findByIdWithRole(saved.id);

    const event: DomainEvent = {
      streamName: 'user:events',
      eventType: 'USER_REGISTERED',
      payload: {
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        roleId: saved.roleId,
      },
      timestamp: new Date(),
    };

    this.logger.log(
      `[PUBLISH] Publishing USER_REGISTERED event for ${saved.id}`,
    );
    await this.eventBus.publish(event);
    this.logger.log(`[PUBLISH] Event published successfully for ${saved.id}`);

    return this.generateTokens(userWithRole || saved);
  }

  async login(dto: { email: string; password: string }) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.bcryptAuth.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.userRepo.findByIdWithRole(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await this.bcryptAuth.comparePassword(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.refreshTokenExpires && new Date() > user.refreshTokenExpires) {
        throw new UnauthorizedException('Refresh token expired');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findByIdWithRole(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    const hashedRefreshToken = await this.bcryptAuth.hashPassword(refreshToken);
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 30);

    await this.userRepo.updateRefreshToken(
      user.id,
      hashedRefreshToken,
      refreshTokenExpires,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions,
      },
    };
  }
}
