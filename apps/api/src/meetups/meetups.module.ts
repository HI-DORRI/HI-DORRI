import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { XrplModule } from '../xrpl/xrpl.module';
import { MeetupsController } from './meetups.controller';
import { MeetupsService } from './meetups.service';

@Module({
  imports: [AuthModule, PrismaModule, XrplModule],
  controllers: [MeetupsController],
  providers: [MeetupsService],
})
export class MeetupsModule {}
