import {CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor} from '@nestjs/common';
import {Observable} from 'rxjs';
import {LOGGER_PORT} from '../../../application/di-tokens';
import {LastActivityTrackService} from '../../../application/services/last-activity-track.service';
import {LoggerPort} from '../../../domain/repositories/logger.port';

/**
 * Track Last Activity Interceptor
 * Intercepts HTTP requests and tracks user activity asynchronously
 * Following Clean Architecture: uses LoggerPort for logging
 */
@Injectable()
export class TrackLastActivityInterceptor implements NestInterceptor {
  constructor(
    private readonly lastActivityService: LastActivityTrackService,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const userId = this.extractUserId(context);

    // Don't block on activity tracking - fire and forget
    if (userId) {
      this.trackActivityAsync(userId);
    }

    return next.handle();
  }

  /**
   * Extract user ID from HTTP context
   */
  private extractUserId(context: ExecutionContext): number | null {
    try {
      const request = context.switchToHttp().getRequest();
      return this.getUserIdFromRequest(request);
    } catch (error) {
      // Silently fail - interceptor shouldn't break requests
      this.logger.warn('Failed to extract user ID from context', 'TrackLastActivityInterceptor', undefined, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return null;
  }

  /**
   * Extract user ID from request object
   */
  private getUserIdFromRequest(request: any): number | null {
    const user = request?.user;

    if (!user) {
      return null;
    }

    // Type-safe user ID extraction
    const userId = typeof user.id === 'number' ? user.id : null;

    return userId;
  }

  /**
   * Track user activity asynchronously (fire and forget)
   * Errors are logged but don't affect the request flow
   */
  private trackActivityAsync(userId: number): void {
    this.lastActivityService.updateLastActivityToRedis(userId).catch(error => {
      // Silently fail - activity tracking shouldn't block requests
      this.logger.error('Failed to update last activity', 'TrackLastActivityInterceptor', error instanceof Error ? error.stack : undefined, {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }
}
