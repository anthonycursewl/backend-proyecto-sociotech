import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import type { Request } from 'express';
import { AUDIT_KEY, type AuditOptions } from './audit.decorator';
import { AuditService } from './audit.service';

export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    roleName: string;
  };
  route: {
    path?: string;
  };
  auditSnapshot?: Record<string, unknown> | null;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user || null;

    if (!user) {
      return next.handle();
    }

    const auditContext = {
      actor: {
        userId: user.userId,
        email: user.email,
        roleName: user.roleName,
      },
      action: auditOptions.action,
      resource: {
        type: auditOptions.resourceType,
        id: (request.params as Record<string, string> | undefined)?.id || null,
      },
      context: {
        ip: request.ip || 'unknown',
        userAgent: request.headers?.['user-agent'] || 'unknown',
        method: request.method,
        path: request.route?.path || request.url,
      },
    };

    return next.handle().pipe(
      tap(() => {
        const changes = auditOptions.includeChanges
          ? {
              old: request.auditSnapshot ?? null,
              new: (request.body as Record<string, unknown>) ?? null,
            }
          : null;

        this.auditService
          .record({
            ...auditContext,
            changes,
            result: 'success',
            errorMessage: null,
          })
          .catch((err: Error) =>
            this.logger.warn(`Audit record failed: ${err.message}`),
          );
      }),
      catchError((error: Error) => {
        const changes = auditOptions.includeChanges
          ? {
              old: request.auditSnapshot ?? null,
              new: (request.body as Record<string, unknown>) ?? null,
            }
          : null;

        this.auditService
          .record({
            ...auditContext,
            changes,
            result: 'failure',
            errorMessage: error.message,
          })
          .catch((err: Error) =>
            this.logger.warn(`Audit record failed: ${err.message}`),
          );

        return throwError(() => error);
      }),
    );
  }
}
