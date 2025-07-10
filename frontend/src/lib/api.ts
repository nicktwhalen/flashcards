import { Deck, Flashcard, ReviewSession, CreateReviewSessionDto, SubmitResultDto, SessionSummary, CreateDeckDto, UpdateDeckDto, CreateFlashcardDto, UpdateFlashcardDto, AuthUser, LoginResponse } from 'shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle void responses (no JSON body)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

export const api = {
  auth: {
    getProfile: (): Promise<AuthUser> => fetchAPI('/auth/profile'),
    logout: (): Promise<{ message: string }> => fetchAPI('/auth/logout', { method: 'POST' }),
  },

  decks: {
    getAll: (): Promise<Deck[]> => fetchAPI('/decks'),
    getById: (id: string): Promise<Deck> => fetchAPI(`/decks/${id}`),
    create: (data: CreateDeckDto): Promise<Deck> =>
      fetchAPI('/decks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateDeckDto): Promise<Deck> =>
      fetchAPI(`/decks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string): Promise<void> => fetchAPI(`/decks/${id}`, { method: 'DELETE' }),
    getFlashcards: (id: string): Promise<Flashcard[]> => fetchAPI(`/decks/${id}/flashcards`),
    createFlashcard: (deckId: string, data: CreateFlashcardDto): Promise<Flashcard> =>
      fetchAPI(`/decks/${deckId}/flashcards`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateFlashcard: (deckId: string, flashcardId: string, data: UpdateFlashcardDto): Promise<Flashcard> =>
      fetchAPI(`/decks/${deckId}/flashcards/${flashcardId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteFlashcard: (deckId: string, flashcardId: string): Promise<void> => fetchAPI(`/decks/${deckId}/flashcards/${flashcardId}`, { method: 'DELETE' }),
  },

  reviewSessions: {
    create: (data: CreateReviewSessionDto): Promise<ReviewSession> =>
      fetchAPI('/review-sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getById: (id: string): Promise<ReviewSession> => fetchAPI(`/review-sessions/${id}`),

    submitResult: (sessionId: string, data: SubmitResultDto): Promise<void> =>
      fetchAPI(`/review-sessions/${sessionId}/results`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    complete: (id: string): Promise<ReviewSession> =>
      fetchAPI(`/review-sessions/${id}/complete`, {
        method: 'PATCH',
      }),

    getSummary: (id: string): Promise<SessionSummary> => fetchAPI(`/review-sessions/${id}/summary`),
  },

  upload: {
    uploadFlashcardImage: async (deckId: string, file: File): Promise<{ fileId: string; url: string }> => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/uploads/flashcards/${deckId}`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
  },
};
