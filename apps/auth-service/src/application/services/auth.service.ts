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
      role: (dto.role as UserRole) || UserRole.PATIENT,
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

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { user };
  }

  private generateTokens(user: User) {
    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
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
