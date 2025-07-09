import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReviewSession } from './review-session.entity';
import { Flashcard } from './flashcard.entity';

export enum DifficultyRating {
  EASY = 'easy',
  DIFFICULT = 'difficult',
  INCORRECT = 'incorrect'
}

@Entity('review_results')
export class ReviewResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  flashcardId: string;

  @Column({
    type: 'enum',
    enum: DifficultyRating
  })
  difficultyRating: DifficultyRating;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ReviewSession, session => session.reviewResults)
  @JoinColumn({ name: 'sessionId' })
  session: ReviewSession;

  @ManyToOne(() => Flashcard, flashcard => flashcard.reviewResults)
  @JoinColumn({ name: 'flashcardId' })
  flashcard: Flashcard;
}