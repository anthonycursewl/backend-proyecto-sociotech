import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { StreamableFile } from '@nestjs/common';

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T> | T> {
    return next.handle().pipe(
      map((response) => {
        if (
          response instanceof StreamableFile ||
          response === null ||
          response === undefined
        ) {
          return response;
        }

        if (
          typeof response === 'object' &&
          response !== null &&
          !Array.isArray(response) &&
          'success' in (response as Record<string, unknown>)
        ) {
          return response;
        }

        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in (response as Record<string, unknown>) &&
          ('nextCursor' in (response as Record<string, unknown>) ||
            'hasNext' in (response as Record<string, unknown>) ||
            'hasMore' in (response as Record<string, unknown>))
        ) {
          const paginated = response as Record<string, unknown>;
          const data = paginated.data as T;
          const meta: Record<string, unknown> = {};
          if ('nextCursor' in paginated) meta.nextCursor = paginated.nextCursor;
          if ('hasNext' in paginated) meta.hasNext = paginated.hasNext;
          if ('hasMore' in paginated) meta.hasMore = paginated.hasMore;
          return { success: true, data, meta };
        }

        if (
          typeof response === 'object' &&
          response !== null &&
          ('nextCursor' in (response as Record<string, unknown>) ||
            'hasMore' in (response as Record<string, unknown>) ||
            'hasNext' in (response as Record<string, unknown>))
        ) {
          const paginated = response as Record<string, unknown>;
          const meta: Record<string, unknown> = {};
          if ('nextCursor' in paginated) meta.nextCursor = paginated.nextCursor;
          if ('hasMore' in paginated) meta.hasMore = paginated.hasMore;
          if ('hasNext' in paginated) meta.hasNext = paginated.hasNext;

          const dataKeys = ['data', 'patients', 'users', 'services', 'items'];
          let data: T = response;
          for (const key of dataKeys) {
            if (key in paginated) {
              data = paginated[key] as T;
              break;
            }
          }

          return {
            success: true,
            data,
            ...(Object.keys(meta).length > 0 ? { meta } : {}),
          };
        }

        return { success: true, data: response };
      }),
    );
  }
}
