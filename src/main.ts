import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import * as dotenv from 'dotenv';

// Load environment variables from .env in project root
dotenv.config({ path: __dirname + '/../.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Request logger middleware (only in development with LOG_REQUESTS=true)
  if (process.env.LOG_REQUESTS === 'true') {
    const loggerMiddleware = new RequestLoggerMiddleware();
    app.use((req, res, next) => loggerMiddleware.use(req, res, next));
    console.log('📜 Request logging enabled (LOG_REQUESTS=true)');
  }

  // Get port from config or default to 5002
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5002;

  await app.listen(port);
  console.log(`Monolith application is running on port ${port}`);
}

bootstrap();
