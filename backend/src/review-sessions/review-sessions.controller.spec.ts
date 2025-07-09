import { Test, TestingModule } from '@nestjs/testing';
import { ReviewSessionsController } from './review-sessions.controller';
import { ReviewSessionsService } from './review-sessions.service';
import { ReviewSession, DifficultyRating, User } from '../entities';
import { CreateReviewSessionDto, SubmitResultDto } from './dto';

describe('ReviewSessionsController', () => {
  let controller: ReviewSessionsController;
  let service: ReviewSessionsService;

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

  const mockReviewSession: ReviewSession = {
    id: '1',
    deckId: '1',
    startedAt: new Date(),
    completedAt: undefined,
    userId: 'user-1',
    user: mockUser,
    deck: undefined,
    reviewResults: [],
  };

  const mockSessionSummary = {
    sessionId: '1',
    deckName: 'Test Deck',
    totalCards: 3,
    easy: [],
    difficult: [],
    incorrect: [],
    completedAt: new Date(),
  };

  const mockReviewSessionsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByUser: jest.fn(),
    submitResult: jest.fn(),
    complete: jest.fn(),
    getSummary: jest.fn(),
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewSessionsController],
      providers: [
        {
          provide: ReviewSessionsService,
          useValue: mockReviewSessionsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewSessionsController>(ReviewSessionsController);
    service = module.get<ReviewSessionsService>(ReviewSessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review session', async () => {
      const createDto: CreateReviewSessionDto = { deckId: '1' };
      mockReviewSessionsService.create.mockResolvedValue(mockReviewSession);

      const result = await controller.create(createDto, mockRequest as any);

      expect(result).toEqual(mockReviewSession);
      expect(service.create).toHaveBeenCalledWith(createDto, 'user-1');
    });
  });

  describe('findOne', () => {
    it('should return a review session', async () => {
      mockReviewSessionsService.findOneByUser.mockResolvedValue(mockReviewSession);

      const result = await controller.findOne('1', mockRequest as any);

      expect(result).toEqual(mockReviewSession);
      expect(service.findOneByUser).toHaveBeenCalledWith('1', 'user-1');
    });
  });

  describe('submitResult', () => {
    it('should submit a review result', async () => {
      const submitDto: SubmitResultDto = {
        flashcardId: '1',
        difficultyRating: DifficultyRating.EASY,
      };
      const mockResult = { id: '1', ...submitDto };
      mockReviewSessionsService.submitResult.mockResolvedValue(mockResult);

      const result = await controller.submitResult('1', submitDto, mockRequest as any);

      expect(result).toEqual(mockResult);
      expect(service.submitResult).toHaveBeenCalledWith('1', submitDto, 'user-1');
    });
  });

  describe('complete', () => {
    it('should complete a review session', async () => {
      const completedSession = { ...mockReviewSession, completedAt: new Date() };
      mockReviewSessionsService.complete.mockResolvedValue(completedSession);

      const result = await controller.complete('1', mockRequest as any);

      expect(result).toEqual(completedSession);
      expect(service.complete).toHaveBeenCalledWith('1', 'user-1');
    });
  });

  describe('getSummary', () => {
    it('should return session summary', async () => {
      mockReviewSessionsService.getSummary.mockResolvedValue(mockSessionSummary);

      const result = await controller.getSummary('1', mockRequest as any);

      expect(result).toEqual(mockSessionSummary);
      expect(service.getSummary).toHaveBeenCalledWith('1', 'user-1');
    });
  });
});