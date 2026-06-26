import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
        error = exception.name;
      } else if (typeof exResponse === 'object') {
        const exObj = exResponse as Record<string, unknown>;
        message = (exObj.message as string | string[]) ?? exception.message;
        error = (exObj.error as string) ?? exception.name;
      }

      if (statusCode >= 500) {
        this.logger.error(
          `[${statusCode}] ${request.method} ${request.url}: ${JSON.stringify(message)}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `[${statusCode}] ${request.method} ${request.url}: ${JSON.stringify(message)}`,
        );
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      message =
        process.env.NODE_ENV === 'development'
          ? exception.message
          : 'Internal server error';
    }

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
