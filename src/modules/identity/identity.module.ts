import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { RegisterUserUseCase, LoginUseCase } from './application/use-cases';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaAuditRepository } from './infrastructure/repositories/prisma-audit.repository';
import { BcryptAuthService } from './infrastructure/strategies/bcrypt-auth.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from './infrastructure/strategies/roles.guard';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UsersController } from './infrastructure/controllers/users.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { AUTH_SERVICE } from './domain/ports/auth-service.port';
import { AUDIT_REPOSITORY } from '@shared/common/audit-repository.port';

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
    BcryptAuthService,
    JwtStrategy,
    RolesGuard,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
    {
      provide: AUTH_SERVICE,
      useClass: BcryptAuthService,
    },
  ],
  exports: [
    RegisterUserUseCase,
    LoginUseCase,
    JwtStrategy,
    RolesGuard,
    USER_REPOSITORY,
    AUDIT_REPOSITORY,
    AUTH_SERVICE,
  ],
})
export class IdentityModule {}