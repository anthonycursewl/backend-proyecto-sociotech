import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { BcryptAuthService } from './infrastructure/strategies/bcrypt-auth.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { USER_REPOSITORY } from './domain/repositories/user-repository.port';
import { RedisEventBus } from './infrastructure/events/redis-event-bus';
import { PrismaService } from './infrastructure/db/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptAuthService,
    JwtStrategy,
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    RedisEventBus,
  ],
  exports: [RedisEventBus],
})
export class AuthServiceModule {}
