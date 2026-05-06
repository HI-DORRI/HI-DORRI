import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenService } from './auth-token.service';
import { AuthUser } from './auth-user';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.getBearerToken(request);
    const payload = this.authTokenService.verifyAccessToken(token);

    request.user = {
      userId: payload.sub,
      email: payload.email,
    };

    return true;
  }

  private getBearerToken(request: Request) {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Bearer access token is required',
      });
    }

    return authorization.slice('Bearer '.length).trim();
  }
}
