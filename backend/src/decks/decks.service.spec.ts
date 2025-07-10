import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DecksService } from './decks.service';
import { Deck, Flashcard, User } from '../entities';
import { ReviewResult } from '../entities/review-result.entity';
import { CreateDeckDto, UpdateDeckDto } from 'shared';
import { UploadService } from '../upload/upload.service';

describe('DecksService', () => {
  let service: DecksService;
  let decksRepository: Repository<Deck>;
  let flashcardsRepository: Repository<Flashcard>;
  let reviewResultsRepository: Repository<ReviewResult>;

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

  const mockDecksRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockFlashcardsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockReviewResultsRepository = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const mockUploadService = {
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecksService,
        {
          provide: getRepositoryToken(Deck),
          useValue: mockDecksRepository,
        },
        {
          provide: getRepositoryToken(Flashcard),
          useValue: mockFlashcardsRepository,
        },
        {
          provide: getRepositoryToken(ReviewResult),
          useValue: mockReviewResultsRepository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<DecksService>(DecksService);
    decksRepository = module.get<Repository<Deck>>(getRepositoryToken(Deck));
    flashcardsRepository = module.get<Repository<Flashcard>>(getRepositoryToken(Flashcard));
    reviewResultsRepository = module.get<Repository<ReviewResult>>(getRepositoryToken(ReviewResult));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return decks for a user', async () => {
      const expectedDecks = [mockDeck];
      mockDecksRepository.find.mockResolvedValue(expectedDecks);

      const result = await service.findByUserId('user-1');

      expect(result).toEqual(expectedDecks);
      expect(mockDecksRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a new deck', async () => {
      const createDto: CreateDeckDto = { name: 'New Deck', description: 'Description' };
      mockDecksRepository.create.mockReturnValue(mockDeck);
      mockDecksRepository.save.mockResolvedValue(mockDeck);

      const result = await service.create(createDto, 'user-1');

      expect(result).toEqual(mockDeck);
      expect(mockDecksRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user-1',
      });
      expect(mockDecksRepository.save).toHaveBeenCalledWith(mockDeck);
    });
  });

  describe('findOneByUser', () => {
    it('should return a deck by id and user', async () => {
      mockDecksRepository.findOne.mockResolvedValue(mockDeck);

      const result = await service.findOneByUser('1', 'user-1');

      expect(result).toEqual(mockDeck);
      expect(mockDecksRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
        relations: ['flashcards'],
      });
    });

    it('should throw NotFoundException if deck not found', async () => {
      mockDecksRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneByUser('999', 'user-1')).rejects.toThrow('Deck not found');
    });
  });

  describe('update', () => {
    it('should update a deck', async () => {
      const updateDto: UpdateDeckDto = { name: 'Updated Deck' };
      mockDecksRepository.findOne.mockResolvedValue(mockDeck);
      mockDecksRepository.save.mockResolvedValue({ ...mockDeck, ...updateDto });

      const result = await service.update('1', updateDto, 'user-1');

      expect(result).toEqual({ ...mockDeck, ...updateDto });
    });
  });

  describe('remove', () => {
    it('should remove a deck', async () => {
      mockDecksRepository.findOne.mockResolvedValue(mockDeck);
      mockDecksRepository.remove.mockResolvedValue(mockDeck);

      await service.remove('1', 'user-1');

      expect(mockDecksRepository.remove).toHaveBeenCalledWith(mockDeck);
    });
  });

  describe('getFlashcards', () => {
    it('should return flashcards for a deck with user validation', async () => {
      const expectedFlashcards = [mockFlashcard];
      mockDecksRepository.findOne.mockResolvedValue(mockDeck);
      mockFlashcardsRepository.find.mockResolvedValue(expectedFlashcards);

      const result = await service.getFlashcards('1', 'user-1');

      expect(result).toEqual(expectedFlashcards);
      expect(mockFlashcardsRepository.find).toHaveBeenCalledWith({
        where: { deckId: '1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('should return flashcards without user validation', async () => {
      const expectedFlashcards = [mockFlashcard];
      mockFlashcardsRepository.find.mockResolvedValue(expectedFlashcards);

      const result = await service.getFlashcards('1');

      expect(result).toEqual(expectedFlashcards);
      expect(mockFlashcardsRepository.find).toHaveBeenCalledWith({
        where: { deckId: '1' },
        order: { createdAt: 'ASC' },
      });
    });
  });
});
