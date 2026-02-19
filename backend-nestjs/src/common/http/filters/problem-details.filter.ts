import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ConflictException,
    ExceptionFilter,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { Request } from 'express';
import { DomainError } from '../../errors/domain-error';
import { LoggerService } from '../../observability/logger.service';

@Catch()
@Injectable()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest<Request>();

    try {

      // Validate response exists
      if (!response) {
        this.logger.error('CRITICAL: No response object available in exception filter', 'ProblemDetailsFilter.catch()', undefined, {});
        return;
      }

      // Check if headers already sent
      if (response.headersSent) {
        this.logger.warn('Response headers already sent, cannot send error response', 'ProblemDetailsFilter.catch()', undefined, {
          path: request?.url
        } as any);
        return;
      }

      if (exception instanceof DomainError) {
        this.handleDomainError(exception, response, request);
        return;
      }

      const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      let message: string | object = exception instanceof HttpException ? exception.getResponse() : 'Internal Server Error';

      if (typeof message === 'object') {
        message = this.extractMessage(message);
      }

      // Enhanced error logging
      const errorDetails: any = {
        path: request?.url,
        method: request?.method,
        status,
        message: typeof message === 'string' ? message : JSON.stringify(message)
      };

      // Log underlying cause when present (e.g. 401 Invalid token → real reason: decryption failed / jwt expired)
      const cause = (exception as any)?.cause;
      if (cause instanceof Error) {
        errorDetails.cause = cause.name;
        errorDetails.causeMessage = cause.message;
        if (cause.stack) {
          errorDetails.causeStack = cause.stack;
        }
      }

      // Only log request body for POST/PUT/PATCH requests and if it exists
      if (request && ['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
        // Sanitize sensitive data from body
        const sanitizedBody = {...request.body};
        if (sanitizedBody.password) {
          sanitizedBody.password = '[REDACTED]';
        }
        errorDetails.body = sanitizedBody;
      }

      this.logger.error(
        `Status: ${status}, Message: ${message}`,
        'ProblemDetailsFilter.catch()',
        exception instanceof Error ? exception.stack : (exception as any).stack,
        errorDetails
      );

      if (exception instanceof PrismaClientInitializationError) {
        // Database connection/configuration error
        const errorMessage = exception.message || 'Database connection error';
        this.logger.error('Database initialization error', 'ProblemDetailsFilter.catch()', undefined, {
          error: errorMessage,
          hint: 'Please check your DATABASE_URL environment variable'
        });
        this.handleException(
          response,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Database connection error. Please check your database configuration.',
          request
        );
      } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
        this.handlePrismaExceptions(exception, response, request);
      } else if (exception instanceof Prisma.PrismaClientValidationError) {
        this.handleException(response, HttpStatus.BAD_REQUEST, 'Database validation error', request);
      } else if (exception instanceof BadRequestException) {
        this.handleValidationException(exception, response, request);
      } else if (exception instanceof HttpException) {
        this.handleHttpExceptions(exception, response, request);
      } else {
        this.handleException(response, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error', request);
      }
    } catch (filterError) {
      // Critical: If exception filter itself fails, try to send a basic response
      this.logger.error(
        'CRITICAL: Exception filter failed',
        'ProblemDetailsFilter.catch()',
        filterError instanceof Error ? filterError.stack : undefined,
        {
          error: filterError instanceof Error ? filterError.message : String(filterError),
          originalException: exception instanceof Error ? exception.message : String(exception)
        }
      );

      // Try to get response and send error
      try {
        const httpResponse = host.switchToHttp().getResponse();
        if (httpResponse && !httpResponse.headersSent) {
          httpResponse.status(500).json({
            success: false,
            message: 'An unexpected error occurred'
          });
        }
      } catch (finalError) {
        // Last resort - log and give up
        this.logger.error(
          'ABSOLUTE FAILURE: Cannot send any error response',
          'ProblemDetailsFilter.catch()',
          finalError instanceof Error ? finalError.stack : undefined,
          {
            error: finalError instanceof Error ? finalError.message : String(finalError)
          }
        );
      }
    }
  }

  private handleDomainError(exception: DomainError, response: any, request: Request): void {
    const requestId = (request as any).id || request.headers['x-request-id'] || 'unknown';

    this.logger.error(`Domain Error: ${exception.message}`, 'ProblemDetailsFilter.handleDomainError()', exception.stack, {
      code: exception.code,
      statusCode: exception.statusCode,
      path: request.url,
      method: request.method,
      requestId
    });

    if (response.headersSent) {
      this.logger.warn('Cannot send domain error - headers already sent', 'ProblemDetailsFilter.handleDomainError()', undefined, {
        path: request.url
      } as any);
      return;
    }

    const isAuthEndpoint = request.url?.includes('/auth/');
    let errorMessage = exception.message;

    if (request.url?.includes('/auth/change-password')) {
      if (exception.code === 'INVALID_CREDENTIALS') {
        errorMessage = 'Failed to change password';
      }
    }

    try {
      if (isAuthEndpoint) {
        const responseBody = {
          success: false,
          message: errorMessage
        };

        this.logger.debug('About to send auth error response', 'ProblemDetailsFilter.handleDomainError()', undefined, {
          statusCode: exception.statusCode,
          responseBody,
          headersSent: response.headersSent
        });

        try {
          response.status(exception.statusCode);
          response.setHeader('Content-Type', 'application/json');
          response.json(responseBody);
        } catch (jsonError) {
          this.logger.error(
            'CRITICAL: json() failed, using fallback send()',
            'ProblemDetailsFilter.handleDomainError()',
            jsonError instanceof Error ? jsonError.stack : undefined,
            {
              error: jsonError instanceof Error ? jsonError.message : String(jsonError),
              hasStatus: typeof response.status === 'function',
              hasJson: typeof response.json === 'function',
              hasSend: typeof response.send === 'function'
            }
          );

          if (typeof response.status === 'function' && typeof response.send === 'function') {
            response.status(exception.statusCode).setHeader('Content-Type', 'application/json').send(JSON.stringify(responseBody));
          }
        }
      } else {
        const problemDetails = {
          type: `https://api.example.com/problems/${exception.code.toLowerCase().replace(/_/g, '-')}`,
          title: exception.constructor.name.replace('Error', ''),
          status: exception.statusCode,
          detail: exception.message,
          instance: request.url,
          code: exception.code,
          traceId: requestId
        };

        response.status(exception.statusCode).json(problemDetails);
      }
    } catch (sendError) {
      this.logger.error({
        message: 'CRITICAL: Failed to send domain error response',
        details: {
          error: sendError instanceof Error ? sendError.message : String(sendError),
          path: request.url,
          stack: sendError instanceof Error ? sendError.stack : undefined
        }
      });
    }
  }

  private handlePrismaExceptions(exception: Prisma.PrismaClientKnownRequestError, response: any, request?: Request) {
    let message = 'Prisma Client Known Request Error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.code) {
      case 'P2002':
        const target = (exception as any).meta?.target;
        message = `${target?.[0] || 'Field'} already exists`;
        status = HttpStatus.CONFLICT;
        break;
      case 'P2025':
        message = "Resource doesn't exist or you don't have permission";
        status = HttpStatus.NOT_FOUND;
        break;
      case 'P2003':
        message = 'Error on deleting the resource';
        status = HttpStatus.BAD_REQUEST;
        break;
      default:
        message = 'Database operation failed';
    }

    this.handleException(response, status, message, request);
  }

  private handleHttpExceptions(exception: HttpException, response: any, request?: Request) {
    const status = exception.getStatus();
    const message = exception.message || 'Internal Server Error';

    if (exception instanceof NotFoundException) {
      this.handleException(response, status, message, request);
    } else if (exception instanceof BadRequestException) {
      this.handleValidationException(exception, response, request);
    } else if (exception instanceof UnauthorizedException) {
      this.handleException(response, status, message, request);
    } else if (exception instanceof ForbiddenException) {
      this.handleException(response, status, message, request);
    } else if (exception instanceof ConflictException) {
      this.handleException(response, status, message, request);
    } else {
      this.handleException(response, status, message, request);
    }
  }

  private handleValidationException(exception: BadRequestException, response: any, request?: Request) {
    const status = exception.getStatus();
    const validationResponse = exception.getResponse();

    let message = 'Validation Error';
    const messages = (validationResponse as any).message;
    if (Array.isArray(messages)) {
      message = messages.join(', ');
    } else if (typeof messages === 'string') {
      message = messages;
    }

    this.handleException(response, status, message, request);
  }

  private handleException(response: any, status: number, message: string, request?: Request) {
    if (!response) {
      this.logger.error({
        message: 'Cannot handle exception - no response object',
        details: {status, message}
      });
      return;
    }

    if (response.headersSent) {
      this.logger.warn({
        message: 'Cannot send exception response - headers already sent',
        details: {status, message, path: request?.url}
      });
      return;
    }

    try {
      const requestId = request ? (request as any).id || request.headers['x-request-id'] || 'unknown' : 'unknown';
      const isAuthEndpoint = request?.url?.includes('/auth/');

      if (isAuthEndpoint) {
        const responseBody = {
          success: false,
          message: message
        };
        response.status(status).json(responseBody);
      } else {
        const problemDetails = {
          type: `https://api.example.com/problems/${this.getErrorTypeFromStatus(status)}`,
          title: this.getTitleFromStatus(status),
          status,
          detail: message,
          instance: request?.url || '/',
          traceId: requestId
        };
        response.status(status).json(problemDetails);
      }
    } catch (sendError) {
      this.logger.error({
        message: 'Failed to send exception response',
        details: {
          error: sendError instanceof Error ? sendError.message : String(sendError),
          status,
          message
        }
      });
    }
  }

  private getErrorTypeFromStatus(status: number): string {
    if (status >= 400 && status < 500) {
      return 'client-error';
    } else if (status >= 500) {
      return 'server-error';
    }
    return 'unknown-error';
  }

  private getTitleFromStatus(status: number): string {
    const titles: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable'
    };
    return titles[status] || 'Error';
  }

  private extractMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    if (typeof message.message === 'string') {
      return message.message;
    }
    if (Array.isArray(message.message)) {
      return message.message.join(', ');
    }
    return 'Internal Server Error';
  }
}
