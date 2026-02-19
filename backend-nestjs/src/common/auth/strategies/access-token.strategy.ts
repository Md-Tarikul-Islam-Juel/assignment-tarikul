import {ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {AuthGuard} from '@nestjs/passport';
import * as jose from 'jose';
import {LoggerService} from '../../observability/logger.service';

/**
 * Access Token Strategy
 * Auth guard for HTTP requests.
 * Supports both plain JWT and JWE-encrypted JWT tokens
 */
@Injectable()
export class AccessTokenStrategy extends AuthGuard('jwt_accessToken_guard') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      let jwtToken: string;
      if (this.isJweToken(token)) {
        jwtToken = await this.decryptJweToken(token);
      } else {
        jwtToken = token;
      }
      await this.validateJwtToken(jwtToken, request);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : '';
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Access token validation failed: ${name} - ${message}`,
        'AccessTokenStrategy',
        stack,
        { reason: message, errorName: name, tokenPartCount: token?.split('.').length }
      );
      if (name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      const unauthorized = new UnauthorizedException('Invalid token');
      (unauthorized as any).cause = err;
      throw unauthorized;
    }
  }

  public getRequest(context: ExecutionContext): any {
    return context.switchToHttp().getRequest();
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [, token] = authHeader.split(' ');
    // Reject literal "undefined"/"null" or empty so we return 401 "No token provided" instead of "Invalid token"
    if (!token || token === 'undefined' || token === 'null' || !token.trim()) {
      return null;
    }
    return token.trim();
  }

  private isJweToken(token: string): boolean {
    return token.split('.').length === 5; // JWE tokens have five parts
  }

  private async decryptJweToken(jweToken: string): Promise<string> {
    const secret = this.configService.get<string>('authConfig.token.jweAccessTokenSecretKey');
    if (!secret || typeof secret !== 'string' || secret.trim() === '') {
      throw new Error('JWE access token secret is not configured (authConfig.token.jweAccessTokenSecretKey)');
    }
    const secretKey = new TextEncoder().encode(secret);
    const {plaintext} = await jose.compactDecrypt(jweToken, secretKey);
    return new TextDecoder().decode(plaintext);
  }

  private async validateJwtToken(token: string, request: any) {
    if (!this.jwtService) {
      throw new Error(
        'JwtService not injected. Any module that uses AccessTokenStrategy (e.g. AccountModule) must import PlatformJwtModule.'
      );
    }
    const secret = this.configService.get<string>('authConfig.token.jwtAccessTokenSecretKey');
    if (!secret || typeof secret !== 'string' || secret.trim() === '') {
      throw new Error('JWT access token secret is not configured (authConfig.token.jwtAccessTokenSecretKey)');
    }
    const decoded = this.jwtService.verify(token, {secret});
    request.user = decoded;
  }
}

