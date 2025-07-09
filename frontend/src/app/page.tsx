"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Deck, Flashcard } from "shared";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserHeader from "@/components/UserHeader";

export default function HomePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckFlashcards, setDeckFlashcards] = useState<Record<string, Flashcard[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState<string | null>(null);

  useEffect(() => {
    async function loadDecks() {
      try {
        const data = await api.decks.getAll();
        setDecks(data);
        
        // Load flashcards for each deck
        const flashcardsMap: Record<string, Flashcard[]> = {};
        await Promise.all(
          data.map(async (deck) => {
            try {
              const flashcards = await api.decks.getFlashcards(deck.id);
              flashcardsMap[deck.id] = flashcards;
            } catch (err) {
              flashcardsMap[deck.id] = [];
            }
          })
        );
        setDeckFlashcards(flashcardsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load decks");
      } finally {
        setLoading(false);
      }
    }

    loadDecks();
  }, []);

  const handleStartReview = async (deckId: string) => {
    setStartingSession(deckId);
    try {
      const session = await api.reviewSessions.create({ deckId });
      router.push(`/review/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start review session');
      setStartingSession(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading decks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome Back!
            </h1>
            <p className="text-lg text-gray-600">
              Continue your bird identification journey
            </p>
          </header>

          <main>
            {decks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  No decks available
                </h2>
                <p className="text-gray-500 mb-6">
                  Create your first flashcard deck to get started with bird
                  identification practice.
                </p>
                <Link
                  href="/decks/create"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Your First Deck
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Your Decks ({decks.length} available)
                  </h2>
                  <Link
                    href="/decks/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    + Create New Deck
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200"
                    >
                      <Link
                        href={`/decks/${deck.id}`}
                        className="block group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                            {deck.name}
                          </h3>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {deck.description}
                        </p>

                        {/* Flashcard Preview Images */}
                        <div className="mb-4">
                          {deckFlashcards[deck.id] && deckFlashcards[deck.id].length > 0 ? (
                            <div className="flex gap-2 mb-2">
                              {deckFlashcards[deck.id].slice(0, 3).map((flashcard) => (
                                <div
                                  key={flashcard.id}
                                  className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                                >
                                  {flashcard.imageUrl ? (
                                    <img
                                      src={flashcard.imageUrl.startsWith('/uploads/') 
                                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${flashcard.imageUrl}`
                                        : flashcard.imageUrl
                                      }
                                      alt={flashcard.birdName}
                                      className="w-full h-full object-cover rounded-lg"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.parentElement!.innerHTML = '<span class="text-gray-400 text-xs">🐦</span>';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xs">🐦</span>
                                  )}
                                </div>
                              ))}
                              {deckFlashcards[deck.id].length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">+{deckFlashcards[deck.id].length - 3}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mb-2">
                              <span className="text-sm text-gray-400">No flashcards yet</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500">
                            {deckFlashcards[deck.id]?.length || 0} cards
                          </span>
                          <span className="text-sm text-gray-500">
                            Created{" "}
                            {new Date(deck.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleStartReview(deck.id)}
                        disabled={startingSession === deck.id}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {startingSession === deck.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Starting Review...
                          </span>
                        ) : (
                          'Start Review'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
