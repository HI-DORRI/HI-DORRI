import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { XrplModule } from '../xrpl/xrpl.module';
import { DorriController } from './dorri.controller';
import { DorriService } from './dorri.service';

@Module({
  imports: [AuthModule, PrismaModule, XrplModule],
  controllers: [DorriController],
  providers: [DorriService],
})
export class DorriModule {}
