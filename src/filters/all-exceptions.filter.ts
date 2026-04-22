import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, response);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      const message = this.extractValidationMessage(exception.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [message],
        error: 'Validation Error',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'object' && res !== null && 'message' in res 
        ? (res as { message: string | string[] }).message 
        : exception.message;
      
      return response.status(status).json({
        statusCode: status,
        message,
        error: HttpStatus[status],
      });
    }

    if (exception instanceof Error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [exception.message],
        error: 'Bad Request',
      });
    }

    this.logger.error('Unhandled exception', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ['Internal server error'],
      error: 'Internal Server Error',
    });
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError, response: Response) {
    const meta = exception.meta as Record<string, string> | undefined;

    switch (exception.code) {
      case 'P2002':
        const field = meta?.field || 'field';
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: [`${field} already exists`],
          error: 'Conflict',
        });

      case 'P2025':
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: ['Record not found'],
          error: 'Not Found',
        });

      case 'P2003':
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['Invalid reference - related record does not exist'],
          error: 'Bad Request',
        });

      default:
        this.logger.error(`Prisma error: ${exception.code}`, exception.message);
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['Database operation failed'],
          error: 'Bad Request',
        });
    }
  }

  private extractValidationMessage(message: string): string {
    const match = message.match(/Argument `([^`]+)` is missing|Invalid `.+` invocation/i);
    if (match) {
      return match[1] ? `Missing required field: ${match[1]}` : 'Invalid data';
    }
    return 'Validation error';
  }
}