import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, AuthGuard],
  exports: [AuthTokenService, AuthGuard],
})
export class AuthModule {}
