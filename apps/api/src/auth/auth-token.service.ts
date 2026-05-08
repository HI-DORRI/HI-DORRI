import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

type AccessTokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AuthTokenService {
  constructor(private readonly config: ConfigService) {}

  createAccessToken(params: { userId: string; email: string }) {
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = 60 * 60 * 24 * 7;
    const payload: AccessTokenPayload = {
      sub: params.userId,
      email: params.email,
      iat: now,
      exp: now + expiresInSeconds,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verifyAccessToken(token: string) {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature || !this.isValidSignature(encodedPayload, signature)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Access token is invalid',
      });
    }

    const payload = this.parsePayload(encodedPayload);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Access token is expired',
      });
    }

    return payload;
  }

  private sign(value: string) {
    return createHmac('sha256', this.getSecret()).update(value).digest('base64url');
  }

  private isValidSignature(value: string, signature: string) {
    const expected = Buffer.from(this.sign(value));
    const actual = Buffer.from(signature);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private parsePayload(value: string) {
    try {
      const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as AccessTokenPayload;

      if (!payload.sub || !payload.email || !payload.exp) {
        throw new Error('Invalid payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Access token is invalid',
      });
    }
  }

  private getSecret() {
    return this.config.get<string>('AUTH_TOKEN_SECRET') ?? 'local-dev-auth-token-secret';
  }
}
