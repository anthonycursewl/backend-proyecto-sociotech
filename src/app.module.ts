import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { ServicesModule } from './modules/services/services.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { SyncModule } from './modules/sync/sync.module';
import { SharedModule } from './modules/shared/shared.module';
import { PatientModule } from './modules/patient/patient.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { RedisEventBus } from './modules/auth/infrastructure/events/redis-event-bus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    AuthModule,
    UserModule,
    ClinicalModule,
    ServicesModule,
    TelemetryModule,
    SyncModule,
    PatientModule,
    AppointmentsModule,
  ],
  providers: [
    RedisEventBus,
  ],
  exports: [RedisEventBus],
})
export class AppModule { }
