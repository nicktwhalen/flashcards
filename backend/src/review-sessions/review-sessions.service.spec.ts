import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewSessionsService } from './review-sessions.service';
import { ReviewSession, ReviewResult, Deck, Flashcard, DifficultyRating, User } from '../entities';
import { CreateReviewSessionDto, SubmitResultDto } from './dto';

describe('ReviewSessionsService', () => {
  let service: ReviewSessionsService;
  let reviewSessionsRepository: Repository<ReviewSession>;
  let reviewResultsRepository: Repository<ReviewResult>;
  let decksRepository: Repository<Deck>;
  let flashcardsRepository: Repository<Flashcard>;

  const mockUser: User = {
    id: 'user-1',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'test.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    decks: [],
    reviewSessions: [],
  };

  const mockDeck: Deck = {
    id: '1',
    name: 'Test Deck',
    description: 'A test deck',
    createdAt: new Date(),
    userId: 'user-1',
    user: mockUser,
    flashcards: [],
    reviewSessions: [],
  };

  const mockFlashcard: Flashcard = {
    id: '1',
    deckId: '1',
    birdName: 'Test Bird',
    imageUrl: 'test.jpg',
    createdAt: new Date(),
    deck: mockDeck,
    reviewResults: [],
  };

  const mockReviewSession: ReviewSession = {
    id: '1',
    deckId: '1',
    userId: 'user-1',
    startedAt: new Date(),
    completedAt: undefined,
    user: mockUser,
    deck: mockDeck,
    reviewResults: [],
  };

  const mockReviewResult: ReviewResult = {
    id: '1',
    sessionId: '1',
    flashcardId: '1',
    difficultyRating: DifficultyRating.EASY,
    createdAt: new Date(),
    session: mockReviewSession,
    flashcard: mockFlashcard,
  };

  const mockRepositories = {
    reviewSessions: {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    },
    reviewResults: {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    },
    decks: {
      findOne: jest.fn(),
    },
    flashcards: {
      find: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewSessionsService,
        {
          provide: getRepositoryToken(ReviewSession),
          useValue: mockRepositories.reviewSessions,
        },
        {
          provide: getRepositoryToken(ReviewResult),
          useValue: mockRepositories.reviewResults,
        },
        {
          provide: getRepositoryToken(Deck),
          useValue: mockRepositories.decks,
        },
        {
          provide: getRepositoryToken(Flashcard),
          useValue: mockRepositories.flashcards,
        },
      ],
    }).compile();

    service = module.get<ReviewSessionsService>(ReviewSessionsService);
    reviewSessionsRepository = module.get<Repository<ReviewSession>>(getRepositoryToken(ReviewSession));
    reviewResultsRepository = module.get<Repository<ReviewResult>>(getRepositoryToken(ReviewResult));
    decksRepository = module.get<Repository<Deck>>(getRepositoryToken(Deck));
    flashcardsRepository = module.get<Repository<Flashcard>>(getRepositoryToken(Flashcard));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review session', async () => {
      const createDto: CreateReviewSessionDto = { deckId: '1' };
      const expectedSession = { ...mockReviewSession };

      mockRepositories.decks.findOne.mockResolvedValue(mockDeck);
      mockRepositories.reviewSessions.create.mockReturnValue(expectedSession);
      mockRepositories.reviewSessions.save.mockResolvedValue(expectedSession);

      const result = await service.create(createDto, 'user-1');

      expect(result).toEqual(expectedSession);
      expect(mockRepositories.decks.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
      });
      expect(mockRepositories.reviewSessions.create).toHaveBeenCalledWith({
        deckId: '1',
        userId: 'user-1',
        startedAt: expect.any(Date),
      });
      expect(mockRepositories.reviewSessions.save).toHaveBeenCalledWith(expectedSession);
    });
  });

  describe('findOneByUser', () => {
    it('should return a review session with user validation', async () => {
      const sessionWithRelations = {
        ...mockReviewSession,
        deck: mockDeck,
        reviewResults: [mockReviewResult],
      };

      mockRepositories.reviewSessions.findOne.mockResolvedValue(sessionWithRelations);

      const result = await service.findOneByUser('1', 'user-1');

      expect(result).toEqual(sessionWithRelations);
      expect(mockRepositories.reviewSessions.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
        relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
      });
    });
  });

  describe('submitResult', () => {
    it('should create and save a review result with user validation', async () => {
      const submitDto: SubmitResultDto = {
        flashcardId: '1',
        difficultyRating: DifficultyRating.EASY,
      };

      mockRepositories.reviewSessions.findOne.mockResolvedValue(mockReviewSession);
      mockRepositories.reviewResults.create.mockReturnValue(mockReviewResult);
      mockRepositories.reviewResults.save.mockResolvedValue(mockReviewResult);

      const result = await service.submitResult('1', submitDto, 'user-1');

      expect(result).toEqual(mockReviewResult);
      expect(mockRepositories.reviewSessions.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
        relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
      });
      expect(mockRepositories.reviewResults.create).toHaveBeenCalledWith({
        sessionId: '1',
        flashcardId: '1',
        difficultyRating: DifficultyRating.EASY,
        createdAt: expect.any(Date),
      });
      expect(mockRepositories.reviewResults.save).toHaveBeenCalledWith(mockReviewResult);
    });
  });

  describe('complete', () => {
    it('should mark session as complete with user validation', async () => {
      const completedSession = {
        ...mockReviewSession,
        completedAt: new Date(),
      };

      mockRepositories.reviewSessions.findOne.mockResolvedValueOnce(mockReviewSession);
      mockRepositories.reviewSessions.update.mockResolvedValue({ affected: 1 });
      mockRepositories.reviewSessions.findOne.mockResolvedValueOnce(completedSession);

      const result = await service.complete('1', 'user-1');

      expect(result).toEqual(completedSession);
      expect(mockRepositories.reviewSessions.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
        relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
      });
      expect(mockRepositories.reviewSessions.update).toHaveBeenCalledWith('1', {
        completedAt: expect.any(Date),
      });
    });
  });

  describe('getSummary', () => {
    it('should return session summary with categorized results and user validation', async () => {
      const sessionWithResults = {
        ...mockReviewSession,
        deck: mockDeck,
        reviewResults: [
          { ...mockReviewResult, difficultyRating: DifficultyRating.EASY, flashcard: mockFlashcard },
          {
            ...mockReviewResult,
            id: '2',
            difficultyRating: DifficultyRating.DIFFICULT,
            flashcard: { ...mockFlashcard, id: '2', birdName: 'Difficult Bird' },
          },
          {
            ...mockReviewResult,
            id: '3',
            difficultyRating: DifficultyRating.INCORRECT,
            flashcard: { ...mockFlashcard, id: '3', birdName: 'Incorrect Bird' },
          },
        ],
        completedAt: new Date(),
      };

      mockRepositories.reviewSessions.findOne.mockResolvedValue(sessionWithResults);

      const result = await service.getSummary('1', 'user-1');

      expect(result).toEqual({
        sessionId: '1',
        deckName: 'Test Deck',
        totalCards: 3,
        easy: [mockFlashcard],
        difficult: [{ ...mockFlashcard, id: '2', birdName: 'Difficult Bird' }],
        incorrect: [{ ...mockFlashcard, id: '3', birdName: 'Incorrect Bird' }],
        completedAt: sessionWithResults.completedAt,
      });
      expect(mockRepositories.reviewSessions.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
        relations: ['deck', 'reviewResults', 'reviewResults.flashcard'],
      });
    });

    it('should return null if session not found', async () => {
      mockRepositories.reviewSessions.findOne.mockResolvedValue(null);

      const result = await service.getSummary('999');

      expect(result).toBeNull();
    });
  });
});
