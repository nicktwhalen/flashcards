import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Deck } from './deck.entity';
import { ReviewResult } from './review-result.entity';
import { User } from './user.entity';

@Entity('review_sessions')
export class ReviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deckId: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  // Relations
  @ManyToOne(() => User, (user) => user.reviewSessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Deck, (deck) => deck.reviewSessions)
  @JoinColumn({ name: 'deckId' })
  deck: Deck;

  @OneToMany(() => ReviewResult, (result) => result.session)
  reviewResults: ReviewResult[];
}
