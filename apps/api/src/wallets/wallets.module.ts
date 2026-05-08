import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { XrplModule } from '../xrpl/xrpl.module';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [AuthModule, PrismaModule, XrplModule],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}
