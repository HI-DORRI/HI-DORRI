import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { XrplModule } from '../xrpl/xrpl.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { SettlementPolicyService } from './settlement-policy.service';

@Module({
  imports: [AuthModule, PrismaModule, XrplModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, SettlementPolicyService],
})
export class ApplicationsModule {}
