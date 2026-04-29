import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { TelemetryServiceModule } from './telemetry-service.module';

async function bootstrap() {
  const app = await NestFactory.create(TelemetryServiceModule);
  await app.listen(process.env.PORT ?? 5005);
}
bootstrap();
