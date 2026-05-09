import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('create')
  create(@CurrentUser() user: AuthUser) {
    return this.walletsService.create(user.userId);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.walletsService.getMyWallet(user.userId);
  }

  @Get('ledger-txs')
  ledgerTxs(@CurrentUser() user: AuthUser) {
    return this.walletsService.getMyLedgerTxs(user.userId);
  }
}
