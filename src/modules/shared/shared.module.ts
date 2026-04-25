import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ExpoPushNotificationService } from './infrastructure/notification/expo-push.service';
import { SystemController } from './infrastructure/system.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { UnitOfWork } from './infrastructure/unit-of-work/unit-of-work';
import { PrismaModule } from '@prisma/prisma.module';
import { PrismaAuditRepository } from '@identity/infrastructure/repositories/prisma-audit.repository';
import { AUDIT_REPOSITORY } from './common/audit-repository.port';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'arrozito_con_cilantro_ñam_ñam_ñam',
    }),
  ],
  controllers: [SystemController],
  providers: [
    ExpoPushNotificationService,
    AuditInterceptor,
    UnitOfWork,
    {
      provide: 'NotificationProvider',
      useClass: ExpoPushNotificationService,
    },
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
  ],
  exports: [
    ExpoPushNotificationService,
    'NotificationProvider',
    AuditInterceptor,
    AUDIT_REPOSITORY,
    UnitOfWork,
  ],
})
export class SharedModule { }