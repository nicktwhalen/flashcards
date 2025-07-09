import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ReviewSessionsService } from './review-sessions.service';
import { CreateReviewSessionDto, SubmitResultDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';

@Controller('review-sessions')
@UseGuards(JwtAuthGuard)
export class ReviewSessionsController {
  constructor(private readonly reviewSessionsService: ReviewSessionsService) {}

  @Post()
  create(@Body() createReviewSessionDto: CreateReviewSessionDto, @Req() req: Request) {
    const user = req.user as User;
    return this.reviewSessionsService.create(createReviewSessionDto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.reviewSessionsService.findOneByUser(id, user.id);
  }

  @Post(':id/results')
  submitResult(@Param('id') sessionId: string, @Body() submitResultDto: SubmitResultDto, @Req() req: Request) {
    const user = req.user as User;
    return this.reviewSessionsService.submitResult(sessionId, submitResultDto, user.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.reviewSessionsService.complete(id, user.id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.reviewSessionsService.getSummary(id, user.id);
  }
}