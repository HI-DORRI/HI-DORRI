import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MeetupStatus } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { MeetupsService } from './meetups.service';

@Controller('meetups')
@UseGuards(AuthGuard)
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  @Get()
  list(@Query('status') status: MeetupStatus | undefined) {
    return this.meetupsService.list(status);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMeetupDto) {
    return this.meetupsService.create(user.userId, dto);
  }

  @Post(':id/apply')
  apply(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.meetupsService.apply(id, user.userId);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.meetupsService.detail(id, user.userId);
  }
}
