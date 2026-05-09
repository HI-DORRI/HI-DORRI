import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { DorriService } from './dorri.service';
import { ChargeDorriDto } from './dto/charge-dorri.dto';
import { CreateTrustLineDto } from './dto/create-trustline.dto';
import { CreateChargeQuoteDto } from './dto/create-charge-quote.dto';

@Controller('dorri')
@UseGuards(AuthGuard)
export class DorriController {
  constructor(private readonly dorriService: DorriService) {}

  @Post('trustline')
  createTrustLine(@CurrentUser() user: AuthUser, @Body() dto: CreateTrustLineDto) {
    return this.dorriService.createTrustLine(user.userId, dto);
  }

  @Get('balance')
  getBalance(@CurrentUser() user: AuthUser) {
    return this.dorriService.getBalance(user.userId);
  }

  @Get('rates')
  getRates() {
    return this.dorriService.getRates();
  }

  @Post('charge/quote')
  createChargeQuote(@CurrentUser() user: AuthUser, @Body() dto: CreateChargeQuoteDto) {
    return this.dorriService.createChargeQuote(user.userId, dto);
  }

  @Post('charge')
  charge(@CurrentUser() user: AuthUser, @Body() dto: ChargeDorriDto) {
    return this.dorriService.charge(user.userId, dto);
  }
}
