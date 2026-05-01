import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user-repository.port';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.port';
import { User, UserRole } from '../../domain/entities/user.entity';
import { BcryptAuthService } from '../../infrastructure/strategies/bcrypt-auth.service';
import { JwtService } from '@nestjs/jwt';
import { RedisEventBus, DomainEvent } from '../../infrastructure/events';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRES_IN = '2h'; // 2 hours
  private readonly REFRESH_TOKEN_EXPIRES_IN = '30d'; // 1 month

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly bcryptAuth: BcryptAuthService,
    private readonly jwtService: JwtService,
    private readonly eventBus: RedisEventBus,
  ) {}

  async register(dto: { email: string; password: string; firstName: string; lastName: string; role?: string }) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await this.bcryptAuth.hashPassword(dto.password);
    const user = new User({
      id: crypto.randomUUID(),
      email: dto.email,
      passwordHash,
      role: UserRole.PATIENT, // El rol siempre es PATIENT en el registro
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.userRepo.save(user);

    const event: DomainEvent = {
      streamName: 'user:events',
      eventType: 'USER_REGISTERED',
      payload: {
        id: saved.id,
        email: saved.email,
        passwordHash: saved.passwordHash,
        firstName: saved.firstName,
        lastName: saved.lastName,
        role: saved.role,
      },
      timestamp: new Date(),
    };

    this.logger.log(`[PUBLISH] Publishing USER_REGISTERED event for ${saved.id}`);
    await this.eventBus.publish(event);
    this.logger.log(`[PUBLISH] Event published successfully for ${saved.id}`);

    return this.generateTokens(saved);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.bcryptAuth.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token using the configured JwtService (which uses JWT_SECRET from .env)
      const payload = this.jwtService.verify(refreshToken);

      // Get user and check if refresh token matches
      const user = await this.userRepo.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if the refresh token matches the one in DB
      if (!user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await this.bcryptAuth.comparePassword(refreshToken, user.refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpires && new Date() > user.refreshTokenExpires) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId, false); // exclude passwordHash
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = { userId: user.id, email: user.email, role: user.role };

    // Generate access token (2 hours)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });

    // Generate refresh token (1 month) - uses the secret from JwtModule config
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    // Hash the refresh token and store in DB
    const hashedRefreshToken = await this.bcryptAuth.hashPassword(refreshToken);
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 30); // 30 days

    // Update user with refresh token
    await this.userRepo.updateRefreshToken(user.id, hashedRefreshToken, refreshTokenExpires);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
