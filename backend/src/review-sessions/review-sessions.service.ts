import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewSession, ReviewResult, Deck, Flashcard, DifficultyRating } from '../entities';
import { CreateReviewSessionDto, SubmitResultDto } from './dto';

@Injectable()
export class ReviewSessionsService {
  constructor(
    @InjectRepository(ReviewSession)
    private reviewSessionsRepository: Repository<ReviewSession>,
    @InjectRepository(ReviewResult)
    private reviewResultsRepository: Repository<ReviewResult>,
    @InjectRepository(Deck)
    private decksRepository: Repository<Deck>,
    @InjectRepository(Flashcard)
    private flashcardsRepository: Repository<Flashcard>,
  ) {}

  // Legacy methods for backward compatibility (will be updated in tests)
  async create(createReviewSessionDto: CreateReviewSessionDto, userId?: string) {
    // Verify user owns the deck if userId is provided
    if (userId) {
      const deck = await this.decksRepository.findOne({
        where: { id: createReviewSessionDto.deckId, userId },
      });
      if (!deck) {
        throw new NotFoundException('Deck not found');
      }
    }

    const session = this.reviewSessionsRepository.create({
      deckId: createReviewSessionDto.deckId,
      userId,
      startedAt: new Date(),
    });
    return this.reviewSessionsRepository.save(session);
  }

  findOne(id: string) {
    return this.reviewSessionsRepository.findOne({
      where: { id },
      relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
    });
  }

  // New user-scoped methods
  async findOneByUser(id: string, userId: string): Promise<ReviewSession> {
    const session = await this.reviewSessionsRepository.findOne({
      where: { id, userId },
      relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
    });

    if (!session) {
      throw new NotFoundException('Review session not found');
    }

    return session;
  }

  async submitResult(sessionId: string, submitResultDto: SubmitResultDto, userId?: string) {
    // Verify user owns the session if userId is provided
    if (userId) {
      await this.findOneByUser(sessionId, userId);
    }

    const result = this.reviewResultsRepository.create({
      sessionId,
      flashcardId: submitResultDto.flashcardId,
      difficultyRating: submitResultDto.difficultyRating,
      createdAt: new Date(),
    });
    return this.reviewResultsRepository.save(result);
  }

  async complete(id: string, userId?: string) {
    if (userId) {
      await this.findOneByUser(id, userId);
    }

    await this.reviewSessionsRepository.update(id, {
      completedAt: new Date(),
    });

    return userId ? this.findOneByUser(id, userId) : this.findOne(id);
  }

  async getSummary(sessionId: string, userId?: string) {
    const session = userId
      ? await this.findOneByUser(sessionId, userId)
      : await this.reviewSessionsRepository.findOne({
          where: { id: sessionId },
          relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
        });

    if (!session) {
      return null;
    }

    const easy = session.reviewResults.filter((r) => r.difficultyRating === DifficultyRating.EASY).map((r) => r.flashcard);

    const difficult = session.reviewResults.filter((r) => r.difficultyRating === DifficultyRating.DIFFICULT).map((r) => r.flashcard);

    const incorrect = session.reviewResults.filter((r) => r.difficultyRating === DifficultyRating.INCORRECT).map((r) => r.flashcard);

    return {
      sessionId: session.id,
      deckName: session.deck.name,
      totalCards: session.reviewResults.length,
      easy,
      difficult,
      incorrect,
      completedAt: session.completedAt,
    };
  }
}
