import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('applications')
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.applicationsService.getMyApplications(user.userId);
  }

  @Post(':id/review')
  review(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.applicationsService.createReview(id, user.userId, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.cancel(id, user.userId);
  }

  @Post(':id/settle')
  settle(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.settle(id, user.userId);
  }

  @Get(':id/settlement')
  settlement(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.getSettlement(id, user.userId);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.getApplication(id, user.userId);
  }
}
