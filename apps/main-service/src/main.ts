import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { MainServiceModule } from './main-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MainServiceModule);
  await app.listen(process.env.PORT ?? 5003);
}
bootstrap();
