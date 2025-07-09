import { Test, TestingModule } from '@nestjs/testing';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import { Deck, Flashcard, User } from '../entities';
import { CreateDeckDto, UpdateDeckDto } from 'shared';

describe('DecksController', () => {
  let controller: DecksController;
  let service: DecksService;

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

  const mockDecksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    findOneByUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getFlashcards: jest.fn(),
    createFlashcard: jest.fn(),
    updateFlashcard: jest.fn(),
    removeFlashcard: jest.fn(),
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecksController],
      providers: [
        {
          provide: DecksService,
          useValue: mockDecksService,
        },
      ],
    }).compile();

    controller = module.get<DecksController>(DecksController);
    service = module.get<DecksService>(DecksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return user decks', async () => {
      const expectedDecks = [mockDeck];
      mockDecksService.findByUserId.mockResolvedValue(expectedDecks);

      const result = await controller.findAll(mockRequest as any);

      expect(result).toEqual(expectedDecks);
      expect(service.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    it('should create a new deck', async () => {
      const createDto: CreateDeckDto = { name: 'New Deck', description: 'Description' };
      mockDecksService.create.mockResolvedValue(mockDeck);

      const result = await controller.create(createDto, mockRequest as any);

      expect(result).toEqual(mockDeck);
      expect(service.create).toHaveBeenCalledWith(createDto, 'user-1');
    });
  });

  describe('findOne', () => {
    it('should return a specific deck', async () => {
      mockDecksService.findOneByUser.mockResolvedValue(mockDeck);

      const result = await controller.findOne('1', mockRequest as any);

      expect(result).toEqual(mockDeck);
      expect(service.findOneByUser).toHaveBeenCalledWith('1', 'user-1');
    });
  });

  describe('update', () => {
    it('should update a deck', async () => {
      const updateDto: UpdateDeckDto = { name: 'Updated Deck' };
      mockDecksService.update.mockResolvedValue(mockDeck);

      const result = await controller.update('1', updateDto, mockRequest as any);

      expect(result).toEqual(mockDeck);
      expect(service.update).toHaveBeenCalledWith('1', updateDto, 'user-1');
    });
  });

  describe('remove', () => {
    it('should remove a deck', async () => {
      mockDecksService.remove.mockResolvedValue(undefined);

      await controller.remove('1', mockRequest as any);

      expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
    });
  });

  describe('getFlashcards', () => {
    it('should return flashcards for a deck', async () => {
      const expectedFlashcards = [mockFlashcard];
      mockDecksService.getFlashcards.mockResolvedValue(expectedFlashcards);

      const result = await controller.getFlashcards('1', mockRequest as any);

      expect(result).toEqual(expectedFlashcards);
      expect(service.getFlashcards).toHaveBeenCalledWith('1', 'user-1');
    });
  });
});