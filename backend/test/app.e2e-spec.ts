import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DecksService } from '../src/decks/decks.service';
import { ReviewSessionsService } from '../src/review-sessions/review-sessions.service';
import { DifficultyRating } from '../src/entities';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const mockDeck = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Deck',
    description: 'Test deck for e2e testing',
    createdAt: '2025-01-01T00:00:00.000Z',
    flashcards: [],
    reviewSessions: [],
  };

  const mockFlashcard = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    deckId: '550e8400-e29b-41d4-a716-446655440000',
    birdName: 'Test Robin',
    imageUrl: 'test-robin.jpg',
    createdAt: '2025-01-01T00:00:00.000Z',
    deck: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Deck',
      description: 'Test deck for e2e testing',
      createdAt: '2025-01-01T00:00:00.000Z',
      flashcards: [],
      reviewSessions: [],
    },
    reviewResults: [],
  };

  const mockReviewSession = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    deckId: '550e8400-e29b-41d4-a716-446655440000',
    startedAt: '2025-01-01T00:00:00.000Z',
    completedAt: null,
    deck: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Deck',
      description: 'Test deck for e2e testing',
      createdAt: '2025-01-01T00:00:00.000Z',
      flashcards: [],
      reviewSessions: [],
    },
    reviewResults: [],
  };

  const mockDecksService = {
    findAll: jest.fn().mockResolvedValue([mockDeck]),
    findOne: jest.fn().mockResolvedValue(mockDeck),
    getFlashcards: jest.fn().mockResolvedValue([mockFlashcard]),
  };

  const mockReviewSessionsService = {
    create: jest.fn().mockResolvedValue(mockReviewSession),
    findOne: jest.fn().mockResolvedValue(mockReviewSession),
    submitResult: jest.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003', sessionId: '550e8400-e29b-41d4-a716-446655440002', flashcardId: '550e8400-e29b-41d4-a716-446655440001', difficultyRating: DifficultyRating.EASY }),
    complete: jest.fn().mockResolvedValue({ ...mockReviewSession, completedAt: '2025-01-01T00:00:00.000Z' }),
    getSummary: jest.fn().mockResolvedValue({
      sessionId: '550e8400-e29b-41d4-a716-446655440002',
      deckName: 'Test Deck',
      totalCards: 1,
      easy: [mockFlashcard],
      difficult: [],
      incorrect: [],
      completedAt: '2025-01-01T00:00:00.000Z',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DecksService)
      .useValue(mockDecksService)
      .overrideProvider(ReviewSessionsService)
      .useValue(mockReviewSessionsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Decks API', () => {
    describe('/decks (GET)', () => {
      it('should return all decks', () => {
        return request(app.getHttpServer()).get('/decks').expect(200).expect([mockDeck]);
      });
    });

    describe('/decks/:id (GET)', () => {
      it('should return a specific deck', () => {
        return request(app.getHttpServer()).get('/decks/550e8400-e29b-41d4-a716-446655440000').expect(200).expect(mockDeck);
      });
    });

    describe('/decks/:id/flashcards (GET)', () => {
      it('should return flashcards for a deck', () => {
        return request(app.getHttpServer()).get('/decks/550e8400-e29b-41d4-a716-446655440000/flashcards').expect(200).expect([mockFlashcard]);
      });
    });
  });

  describe('Review Sessions API', () => {
    describe('/review-sessions (POST)', () => {
      it('should create a new review session', async () => {
        return request(app.getHttpServer()).post('/review-sessions').send({ deckId: '550e8400-e29b-41d4-a716-446655440000' }).expect(201).expect(mockReviewSession);
      });

      it('should validate deckId format', () => {
        return request(app.getHttpServer()).post('/review-sessions').send({ deckId: 'invalid-uuid' }).expect(400);
      });

      it('should require deckId', () => {
        return request(app.getHttpServer()).post('/review-sessions').send({}).expect(400);
      });
    });

    describe('/review-sessions/:id (GET)', () => {
      it('should return a review session', () => {
        return request(app.getHttpServer()).get('/review-sessions/550e8400-e29b-41d4-a716-446655440002').expect(200).expect(mockReviewSession);
      });
    });

    describe('/review-sessions/:id/results (POST)', () => {
      it('should submit a review result', () => {
        return request(app.getHttpServer())
          .post('/review-sessions/550e8400-e29b-41d4-a716-446655440002/results')
          .send({
            flashcardId: '550e8400-e29b-41d4-a716-446655440001',
            difficultyRating: DifficultyRating.EASY,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('sessionId', '550e8400-e29b-41d4-a716-446655440002');
            expect(res.body).toHaveProperty('flashcardId', '550e8400-e29b-41d4-a716-446655440001');
            expect(res.body).toHaveProperty('difficultyRating', DifficultyRating.EASY);
          });
      });

      it('should validate difficulty rating', () => {
        return request(app.getHttpServer())
          .post('/review-sessions/550e8400-e29b-41d4-a716-446655440002/results')
          .send({
            flashcardId: '550e8400-e29b-41d4-a716-446655440001',
            difficultyRating: 'invalid-rating',
          })
          .expect(400);
      });
    });

    describe('/review-sessions/:id/complete (PATCH)', () => {
      it('should complete a review session', () => {
        return request(app.getHttpServer())
          .patch('/review-sessions/550e8400-e29b-41d4-a716-446655440002/complete')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id', '550e8400-e29b-41d4-a716-446655440002');
            expect(res.body).toHaveProperty('completedAt');
          });
      });
    });

    describe('/review-sessions/:id/summary (GET)', () => {
      it('should return session summary', () => {
        return request(app.getHttpServer())
          .get('/review-sessions/550e8400-e29b-41d4-a716-446655440002/summary')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('sessionId', '550e8400-e29b-41d4-a716-446655440002');
            expect(res.body).toHaveProperty('deckName', 'Test Deck');
            expect(res.body).toHaveProperty('totalCards', 1);
            expect(res.body).toHaveProperty('easy');
            expect(res.body).toHaveProperty('difficult');
            expect(res.body).toHaveProperty('incorrect');
            expect(res.body).toHaveProperty('completedAt');
          });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', () => {
      return request(app.getHttpServer()).get('/non-existent-route').expect(404);
    });
  });
});
