import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { SyncServiceModule } from './sync-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SyncServiceModule);
  await app.listen(process.env.PORT ?? 5004);
}
bootstrap();
