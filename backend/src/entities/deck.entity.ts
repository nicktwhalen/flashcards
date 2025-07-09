import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Flashcard } from './flashcard.entity';
import { ReviewSession } from './review-session.entity';
import { User } from './user.entity';

@Entity('decks')
export class Deck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'user_id' })
  userId: string;

  // Relations
  @ManyToOne(() => User, (user) => user.decks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Flashcard, flashcard => flashcard.deck)
  flashcards: Flashcard[];

  @OneToMany(() => ReviewSession, session => session.deck)
  reviewSessions: ReviewSession[];
}