import { api } from '../../lib/api';
import { DifficultyRating } from 'shared';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test API base URL
const TEST_API_BASE = 'http://localhost:3001';

describe('API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('decks', () => {
    describe('getAll', () => {
      it('should fetch all decks', async () => {
        const mockDecks = [{ id: '1', name: 'Test Deck' }];
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify(mockDecks)),
          json: () => Promise.resolve(mockDecks),
        });

        const result = await api.decks.getAll();

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/decks`, {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(mockDecks);
      });
    });

    describe('getById', () => {
      it('should fetch a specific deck', async () => {
        const mockDeck = { id: '1', name: 'Test Deck' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify(mockDeck)),
          json: () => Promise.resolve(mockDeck),
        });

        const result = await api.decks.getById('1');

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/decks/1`, {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(mockDeck);
      });
    });

    describe('getFlashcards', () => {
      it('should fetch flashcards for a deck', async () => {
        const mockFlashcards = [{ id: '1', birdName: 'Robin' }];
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify(mockFlashcards)),
          json: () => Promise.resolve(mockFlashcards),
        });

        const result = await api.decks.getFlashcards('1');

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/decks/1/flashcards`, {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(mockFlashcards);
      });
    });
  });

  describe('reviewSessions', () => {
    describe('create', () => {
      it('should create a new review session', async () => {
        const mockSession = { id: '1', deckId: '1' };
        const createData = { deckId: '1' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify(mockSession)),
          json: () => Promise.resolve(mockSession),
        });

        const result = await api.reviewSessions.create(createData);

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/review-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData),
        });
        expect(result).toEqual(mockSession);
      });
    });

    describe('submitResult', () => {
      it('should submit a review result', async () => {
        const resultData = {
          flashcardId: '1',
          difficultyRating: DifficultyRating.EASY,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify({})),
          json: () => Promise.resolve({}),
        });

        await api.reviewSessions.submitResult('1', resultData);

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/review-sessions/1/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultData),
        });
      });
    });

    describe('complete', () => {
      it('should complete a review session', async () => {
        const mockSession = { id: '1', completedAt: new Date().toISOString() };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify(mockSession)),
          json: () => Promise.resolve(mockSession),
        });

        const result = await api.reviewSessions.complete('1');

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/review-sessions/1/complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(mockSession);
      });
    });

    describe('getSummary', () => {
      it('should get session summary', async () => {
        const mockSummary = { sessionId: '1', totalCards: 5 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json'),
          },
          text: () => Promise.resolve(JSON.stringify(mockSummary)),
          json: () => Promise.resolve(mockSummary),
        });

        const result = await api.reviewSessions.getSummary('1');

        expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_BASE}/review-sessions/1/summary`, {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(mockSummary);
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.decks.getAll()).rejects.toThrow('API Error: 404 Not Found');
    });
  });
});
