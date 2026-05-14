import { Module, type Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { QueueModule } from '../queue/queue.module';
import { TelemetryService } from './infrastructure/telemetry.service';
import { TelemetryInterceptor } from './presentation/telemetry.interceptor';

const globalInterceptor: Provider = {
  provide: APP_INTERCEPTOR,
  useClass: TelemetryInterceptor,
};

@Module({
  imports: [QueueModule],
  providers: [TelemetryService, TelemetryInterceptor, globalInterceptor],
})
export class TelemetryModule {}
