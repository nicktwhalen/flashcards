import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewSessionsController } from './review-sessions.controller';
import { ReviewSessionsService } from './review-sessions.service';
import { ReviewSession, ReviewResult, Deck, Flashcard } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewSession, ReviewResult, Deck, Flashcard])],
  controllers: [ReviewSessionsController],
  providers: [ReviewSessionsService],
})
export class ReviewSessionsModule {}