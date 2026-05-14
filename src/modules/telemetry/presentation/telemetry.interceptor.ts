import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import type { Request, Response } from 'express';
import { TelemetryService } from '../infrastructure/telemetry.service';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    roleName: string;
  };
}

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TelemetryInterceptor.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const method: string = request.method;
    const path: string = request.route?.path || request.url;
    const endpoint = `${method} ${path}`;
    const user = request.user || null;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const durationMs = Date.now() - start;

        this.telemetryService
          .record({
            endpoint,
            method,
            statusCode: response.statusCode,
            durationMs,
            userId: user?.userId || null,
            roleName: user?.roleName || null,
            errorType: null,
          })
          .catch((err: Error) =>
            this.logger.warn(`Telemetry record failed: ${err.message}`),
          );
      }),
      catchError((error: Error) => {
        const durationMs = Date.now() - start;
        const response = context.switchToHttp().getResponse<Response>();

        this.telemetryService
          .record({
            endpoint,
            method,
            statusCode: response.statusCode || 500,
            durationMs,
            userId: user?.userId || null,
            roleName: user?.roleName || null,
            errorType: error.name || 'Error',
          })
          .catch((err: Error) =>
            this.logger.warn(`Telemetry record failed: ${err.message}`),
          );

        return throwError(() => error);
      }),
    );
  }
}
