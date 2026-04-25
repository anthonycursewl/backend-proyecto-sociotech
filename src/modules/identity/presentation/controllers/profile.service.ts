import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import type { User } from '@identity/domain/entities/user.entity';
import { ROLE_PERMISSIONS } from '@identity/domain/entities/user.entity';
import { ProfileResponseDto } from './profile.dto';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly CACHE_TTL = 300;
  private redisAvailable = false;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis | null,
  ) {
    if (this.redisClient) {
      this.setupErrorHandlers();
      this.initRedis();
    } else {
      this.logger.warn('Redis not configured, caching disabled');
    }
  }

  private setupErrorHandlers(): void {
    if (!this.redisClient) return;
    
    this.redisClient.on('error', (err: Error) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected');
      this.redisAvailable = true;
    });

    this.redisClient.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.redisAvailable = false;
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...');
    });
  }

  private async initRedis(): Promise<void> {
    if (!this.redisClient) return;
    
    if (!process.env.REDIS_HOST) {
      this.logger.warn('REDIS_HOST not configured, caching disabled');
      return;
    }

    try {
      await this.redisClient.connect();
      await this.redisClient.ping();
      this.redisAvailable = true;
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.warn('Redis unavailable, caching disabled');
    }
  }

  async getProfile(user: User): Promise<ProfileResponseDto> {
    const cacheKey = `user:profile:${user.id}`;

    if (this.redisAvailable && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.warn(`Redis read error: ${error}`);
      }
    }

    const profile: ProfileResponseDto = {
      user: {
        id: user.id,
        email: user.email,
        passwordHash: '',
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      metadata: {
        fullName: `${user.firstName} ${user.lastName}`,
        humanReadable: `${user.firstName} ${user.lastName} - ${user.role}`,
        permissions: ROLE_PERMISSIONS[user.role],
      },
    };

    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(profile));
      } catch (error) {
        this.logger.warn(`Redis write error: ${error}`);
      }
    }

    return profile;
  }

  async invalidateCache(userId: string): Promise<void> {
    if (!this.redisAvailable || !this.redisClient) return;
    try {
      await this.redisClient.del(`user:profile:${userId}`);
    } catch (error) {
      this.logger.warn(`Redis invalidate error: ${error}`);
    }
  }
}