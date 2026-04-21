import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { AuditRepository } from '@shared/common/audit-repository.port';
import { User } from '@identity/domain/entities/user.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();

    if (!handler) {
      return next.handle();
    }

    const httpCode = response.statusCode;
    const isSuccess = httpCode >= 200 && httpCode < 400;

    return next.handle().pipe(
      tap({
        next: () => {
          if (isSuccess && request.method !== 'GET') {
            this.logAudit(context, 'CREATE');
          }
        },
        error: (error) => {
          this.logAudit(context, 'ERROR');
        },
      }),
    );
  }

  private async logAudit(context: ExecutionContext, action: string): Promise<void> {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user as User | undefined;

      const entityType = this.getEntityType(context);
      const entityId = this.extractEntityId(request);

      if (!entityType) {
        return;
      }

      const entry = {
        userId: user?.id || null,
        action: `${action}_${request.method}`,
        entityType,
        entityId: entityId || 'unknown',
        oldValues: null,
        newValues: this.extractRequestBody(request),
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.headers['user-agent'],
        timestamp: new Date(),
      };

      await this.auditRepository.log(entry);
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error.message}`);
    }
  }

  private getEntityType(context: ExecutionContext): string | null {
    const controller = context.getClass();
    const handler = context.getHandler();

    if (!controller || !handler) {
      return null;
    }

    const controllerName = controller.name.replace('Controller', '').toLowerCase();
    return controllerName;
  }

  private extractEntityId(request: any): string | null {
    return request.params?.id || null;
  }

  private extractRequestBody(request: any): Record<string, any> | null {
    const body = request.body;
    if (!body || Object.keys(body).length === 0) {
      return null;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}