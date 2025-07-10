export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  userId: string;
  user?: User;
}

export interface Flashcard {
  id: string;
  deckId: string;
  birdName: string;
  imageUrl: string;
  createdAt: Date;
}

export interface ReviewSession {
  id: string;
  deckId: string;
  startedAt: Date;
  completedAt?: Date;
  userId: string;
  deck?: Deck;
  user?: User;
}

export interface ReviewResult {
  id: string;
  sessionId: string;
  flashcardId: string;
  difficultyRating: DifficultyRating;
  createdAt: Date;
}

export enum DifficultyRating {
  EASY = 'easy',
  DIFFICULT = 'difficult',
  INCORRECT = 'incorrect',
}

export interface SessionSummary {
  sessionId: string;
  deckName: string;
  totalCards: number;
  easy: Flashcard[];
  difficult: Flashcard[];
  incorrect: Flashcard[];
  completedAt: Date;
}

export interface CreateReviewSessionDto {
  deckId: string;
}

export interface SubmitResultDto {
  flashcardId: string;
  difficultyRating: DifficultyRating;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

// CRUD DTOs
export interface CreateDeckDto {
  name: string;
  description?: string;
}

export interface UpdateDeckDto {
  name?: string;
  description?: string;
}

export interface CreateFlashcardDto {
  birdName: string;
  imageUrl: string;
  fileId?: string; // Optional file ID for uploaded images
}

export interface UpdateFlashcardDto {
  birdName?: string;
  imageUrl?: string;
}
