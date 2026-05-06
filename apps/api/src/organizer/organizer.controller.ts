import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { EvaluateParticipantDto } from './dto/evaluate-participant.dto';
import { OrganizerService } from './organizer.service';

@Controller('organizer')
@UseGuards(AuthGuard)
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Get('meetups')
  getMeetups(@CurrentUser() user: AuthUser) {
    return this.organizerService.getMeetups(user.userId);
  }

  @Get('meetups/:id/applications')
  getApplications(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.organizerService.getApplications(id, user.userId);
  }

  @Post('applications/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.organizerService.approve(id, user.userId);
  }

  @Post('applications/:id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.organizerService.reject(id, user.userId);
  }

  @Post('applications/:id/check-in')
  checkIn(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.organizerService.checkIn(id, user.userId);
  }

  @Post('applications/:id/no-show')
  noShow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.organizerService.noShow(id, user.userId);
  }

  @Post('applications/:id/evaluate')
  evaluate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: EvaluateParticipantDto,
  ) {
    return this.organizerService.evaluateParticipant(id, user.userId, dto);
  }
}
