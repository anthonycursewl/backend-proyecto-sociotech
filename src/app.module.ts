import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { ServicesModule } from './modules/services/services.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { SyncModule } from './modules/sync/sync.module';
import { SharedModule } from './modules/shared/shared.module';
import { PatientModule } from './modules/patient/patient.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditModule } from './modules/audit/audit.module';
import { FlusherModule } from './modules/flusher/flusher.module';
import { PublicModule } from './modules/public/public.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { RedisEventBus } from './modules/auth/infrastructure/events/redis-event-bus';
import { GLOBAL_CACHE_TTL } from './modules/shared/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    CacheModule.register({ isGlobal: true, ttl: GLOBAL_CACHE_TTL }),
    SharedModule,
    AuthModule,
    UserModule,
    ClinicalModule,
    ServicesModule,
    TelemetryModule,
    SyncModule,
    PatientModule,
    AppointmentsModule,
    AuditModule,
    FlusherModule,
    PublicModule,
    PdfModule,
  ],
  providers: [RedisEventBus],
  exports: [RedisEventBus],
})
export class AppModule {}
