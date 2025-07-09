'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flashcard, DifficultyRating, ReviewSession } from 'shared';
import { api } from '@/lib/api';
import { shuffleArray } from '@/lib/utils';
import FlashcardComponent from '@/components/FlashcardComponent';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserHeader from '@/components/UserHeader';

interface ReviewPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [, setFlashcards] = useState<Flashcard[]>([]);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSessionId(resolvedParams.sessionId);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    async function loadSessionData() {
      try {
        const sessionData = await api.reviewSessions.getById(sessionId);
        setSession(sessionData);

        const flashcardsData = await api.decks.getFlashcards(sessionData.deckId);
        setFlashcards(flashcardsData);
        setShuffledCards(shuffleArray(flashcardsData));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load review session');
      } finally {
        setLoading(false);
      }
    }

    loadSessionData();
  }, [sessionId]);

  const handleRate = async (rating: DifficultyRating) => {
    if (!session || submittingRating) return;

    setSubmittingRating(true);
    try {
      await api.reviewSessions.submitResult(session.id, {
        flashcardId: shuffledCards[currentIndex].id,
        difficultyRating: rating,
      });

      const nextIndex = currentIndex + 1;
      if (nextIndex >= shuffledCards.length) {
        // Session complete - mark as complete and redirect to summary
        await api.reviewSessions.complete(session.id);
        router.push(`/review/${session.id}/summary`);
      } else {
        setCurrentIndex(nextIndex);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleQuitSession = async () => {
    if (!session) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to quit this review session? Your progress will be saved.'
    );
    
    if (confirmed) {
      try {
        await api.reviewSessions.complete(session.id);
        router.push(`/review/${session.id}/summary`);
      } catch (err) {
        // If complete fails, just navigate to home
        router.push('/');
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading review session...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !session) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Decks
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (shuffledCards.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No flashcards available</h2>
            <p className="text-gray-500 mb-6">
              This deck doesn't have any flashcards to review.
            </p>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Decks
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Session</h1>
            <p className="text-gray-600">
              {session.deck?.name || 'Loading deck name...'}
            </p>
          </div>
          <button
            onClick={handleQuitSession}
            className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors duration-200"
          >
            Quit Session
          </button>
        </div>

        {/* Flashcard Component */}
        <FlashcardComponent
          flashcard={shuffledCards[currentIndex]}
          onRate={handleRate}
          currentIndex={currentIndex}
          totalCards={shuffledCards.length}
        />

        {/* Loading overlay for rating submission */}
        {submittingRating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Saving your response...</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}