import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Deck } from './deck.entity';
import { ReviewResult } from './review-result.entity';

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deckId: string;

  @Column()
  birdName: string;

  @Column()
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Deck, deck => deck.flashcards)
  @JoinColumn({ name: 'deckId' })
  deck: Deck;

  @OneToMany(() => ReviewResult, result => result.flashcard, { cascade: true })
  reviewResults: ReviewResult[];
}