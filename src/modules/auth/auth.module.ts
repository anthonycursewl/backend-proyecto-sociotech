import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { BcryptAuthService } from './infrastructure/strategies/bcrypt-auth.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { USER_REPOSITORY } from './domain/repositories/user-repository.port';
import { RedisEventBus } from './infrastructure/events/redis-event-bus';
import { PrismaService } from './infrastructure/db/prisma.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        return { secret };
      },
    }),
    QueueModule,
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
export class AuthModule {}
