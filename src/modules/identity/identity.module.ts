import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import { RegisterUserUseCase, LoginUseCase, RefreshTokenUseCase } from './application/services';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { BcryptAuthService } from './infrastructure/strategies/bcrypt-auth.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from './infrastructure/strategies/roles.guard';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { ProfileService, REDIS_CLIENT } from './presentation/controllers/profile.service';
import { PrismaModule } from '@prisma/prisma.module';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { AUTH_SERVICE } from './domain/ports/auth-service.port';

const redisClientFactory = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    if (!process.env.REDIS_HOST) {
      return null;
    }
    return new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      retryStrategy: () => null,
    });
  },
};

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    BcryptAuthService,
    JwtStrategy,
    RolesGuard,
    ProfileService,
    redisClientFactory,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: AUTH_SERVICE,
      useClass: BcryptAuthService,
    },
  ],
  exports: [
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    JwtStrategy,
    RolesGuard,
    USER_REPOSITORY,
    AUTH_SERVICE,
    ProfileService,
  ],
})
export class IdentityModule {}