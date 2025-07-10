import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import { Deck, Flashcard } from '../entities';
import { ReviewResult } from '../entities/review-result.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deck, Flashcard, ReviewResult]), UploadModule],
  controllers: [DecksController],
  providers: [DecksService],
})
export class DecksModule {}
