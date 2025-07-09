"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Deck, Flashcard } from "shared";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserHeader from "@/components/UserHeader";

interface DeckPageProps {
  params: Promise<{ id: string }>;
}

export default function DeckPage({ params }: DeckPageProps) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [deckId, setDeckId] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [updatingDeck, setUpdatingDeck] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setDeckId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!deckId) return;

    async function loadDeckData() {
      try {
        const [deckData, flashcardsData] = await Promise.all([
          api.decks.getById(deckId),
          api.decks.getFlashcards(deckId),
        ]);
        setDeck(deckData);
        setFlashcards(flashcardsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deck");
      } finally {
        setLoading(false);
      }
    }

    loadDeckData();
  }, [deckId]);

  const handleStartReview = async () => {
    if (!deck || flashcards.length === 0) return;

    setStartingSession(true);
    try {
      const session = await api.reviewSessions.create({ deckId: deck.id });
      router.push(`/review/${session.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start review session"
      );
      setStartingSession(false);
    }
  };

  const handleEditTitle = () => {
    if (!deck) return;
    setEditTitle(deck.name);
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!deck || !editTitle.trim()) return;

    setUpdatingDeck(true);
    try {
      const updatedDeck = await api.decks.update(deck.id, { name: editTitle.trim() });
      setDeck(updatedDeck);
      setEditingTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deck name");
    } finally {
      setUpdatingDeck(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(false);
    setEditTitle("");
  };

  const handleDeleteFlashcard = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDeleteFlashcard = async () => {
    if (!deleteConfirm || !deck) return;

    setDeletingFlashcard(true);
    try {
      await api.decks.deleteFlashcard(deck.id, deleteConfirm.id);
      setFlashcards(flashcards.filter(f => f.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
    } finally {
      setDeletingFlashcard(false);
    }
  };

  const cancelDeleteFlashcard = () => {
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deck...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !deck) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error || "Deck not found"}</p>
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
          <nav className="mb-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← Back to Decks
            </Link>
          </nav>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="text-center mb-8">
                {editingTitle ? (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none text-center"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      disabled={updatingDeck || !editTitle.trim()}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingDeck ? '...' : '✓'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 mb-2 group">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {deck.name}
                    </h1>
                    <button
                      onClick={handleEditTitle}
                      className="opacity-0 group-hover:opacity-100 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm transition-opacity"
                      title="Edit deck name"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                <p className="text-lg text-gray-600 mb-6">{deck.description}</p>

                <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-8">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{flashcards.length}</span>
                    <span>Flashcards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Created</span>
                    <span className="font-semibold">
                      {new Date(deck.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {flashcards.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📭</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No flashcards available
                  </h3>
                  <p className="text-gray-500 mb-6">
                    This deck doesn't have any flashcards yet. Add some to get
                    started!
                  </p>
                  <Link
                    href={`/decks/${deckId}/flashcards/create`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add First Flashcard
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={handleStartReview}
                    disabled={startingSession}
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-4"
                  >
                    {startingSession ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Starting Review...
                      </span>
                    ) : (
                      "Start Review Session"
                    )}
                  </button>

                  <p className="text-sm text-gray-500">
                    You'll see {flashcards.length} flashcards in random order
                  </p>
                </div>
              )}
            </div>

            {flashcards.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Flashcards
                  </h3>
                  <Link
                    href={`/decks/${deckId}/flashcards/create`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Flashcard
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {flashcards.map((flashcard) => (
                    <div
                      key={flashcard.id}
                      className="border border-gray-200 rounded-lg p-3 relative group hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Delete button in top right corner of the entire card */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteFlashcard(flashcard.id, flashcard.birdName);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                        title="Delete flashcard"
                      >
                        ×
                      </button>
                      
                      <Link
                        href={`/decks/${deckId}/flashcards/${flashcard.id}/edit`}
                        className="block text-center cursor-pointer"
                      >
                        <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-2 overflow-hidden">
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
                                target.parentElement!.innerHTML = '<span class="text-gray-400 text-sm">🐦 Image</span>';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">🐦 Image</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {flashcard.birdName}
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Flashcard
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the flashcard for "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteFlashcard}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFlashcard}
                disabled={deletingFlashcard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingFlashcard ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
