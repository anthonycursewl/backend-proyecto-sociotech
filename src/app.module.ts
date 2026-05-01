import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { SyncModule } from './modules/sync/sync.module';
import { RedisEventBus } from './modules/auth/infrastructure/events/redis-event-bus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UserModule,
    ClinicalModule,
    TelemetryModule,
    SyncModule,
  ],
  providers: [
    RedisEventBus,
  ],
  exports: [RedisEventBus],
})
export class AppModule { }
