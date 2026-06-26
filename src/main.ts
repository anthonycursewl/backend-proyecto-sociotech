import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { ResponseInterceptor } from './modules/shared/interceptors/response.interceptor';
import { AllExceptionsFilter } from './modules/shared/filters/all-exceptions.filter';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';

const logger = new Logger('Bootstrap');

// Load environment variables from .env in project root
dotenv.config({ path: __dirname + '/../.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — allow all origins in development
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Explicit body parser — ensures bodies are always parsed.
  // Without this, some Express/NestJS versions may leave req.body as undefined
  // on empty or malformed bodies, causing silent failures in DTO validation.
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (_req: any, _res: any, buf: Buffer) => {
        if (buf.length === 0) {
          logger.warn('Empty request body received — ensure client sends valid JSON');
        }
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        exposeDefaultValues: true,
      },
    }),
  );

  // Global exception filter — standardizes all error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response interceptor — wraps success in { success: true, data, meta? }
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Request logger middleware (only in development with LOG_REQUESTS=true)
  if (process.env.LOG_REQUESTS === 'true') {
    const loggerMiddleware = new RequestLoggerMiddleware();
    app.use((req, res, next) => loggerMiddleware.use(req, res, next));
    console.log('Request logging enabled (LOG_REQUESTS=true)');
  }

  // Get port from config or default to 5002
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5002;

  await app.listen(port);
  console.log(`Monolith application is running on port ${port}`);
}

bootstrap();
