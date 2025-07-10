'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionSummary, DifficultyRating } from 'shared';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserHeader from '@/components/UserHeader';

interface SummaryPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function SummaryPage({ params }: SummaryPageProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [startingNewSession, setStartingNewSession] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSessionId(resolvedParams.sessionId);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    async function loadSummary() {
      try {
        const summaryData = await api.reviewSessions.getSummary(sessionId);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load summary');
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [sessionId]);

  const getRatingStats = () => {
    if (!summary) return { easy: 0, difficult: 0, incorrect: 0 };
    return {
      easy: summary.easy.length,
      difficult: summary.difficult.length,
      incorrect: summary.incorrect.length,
    };
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (easyPercentage: number) => {
    if (easyPercentage >= 80) return 'Excellent work! You know these birds well! 🌟';
    if (easyPercentage >= 60) return 'Good job! Keep practicing to improve further. 👍';
    if (easyPercentage >= 40) return 'Not bad! Review the difficult ones and try again. 📚';
    return 'Keep practicing! Consider studying these birds more closely. 💪';
  };

  const handleStartNewSession = async () => {
    if (!summary) return;

    const deckId = [...summary.easy, ...summary.difficult, ...summary.incorrect][0]?.deckId;
    if (!deckId) return;

    setStartingNewSession(true);
    try {
      const session = await api.reviewSessions.create({ deckId });
      router.push(`/review/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start new session');
      setStartingNewSession(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading summary...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !summary) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error || 'Summary not found'}</p>
            <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Back to Decks
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getRatingStats();
  const easyPercentage = summary.totalCards > 0 ? (stats.easy / summary.totalCards) * 100 : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Complete!</h1>
            <p className="text-lg text-gray-600">{summary.deckName}</p>
            <p className="text-sm text-gray-500">Completed on {formatDate(summary.completedAt)}</p>
          </div>

          {/* Overall Performance */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overall Performance</h2>

            <div className="text-center mb-6">
              <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(easyPercentage)}`}>{Math.round(easyPercentage)}%</div>
              <p className="text-gray-600">Cards marked as "Easy"</p>
              <p className="text-lg text-gray-700 mt-2">{getPerformanceMessage(easyPercentage)}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div className="bg-green-500" style={{ width: `${(stats.easy / summary.totalCards) * 100}%` }}></div>
                <div className="bg-yellow-500" style={{ width: `${(stats.difficult / summary.totalCards) * 100}%` }}></div>
                <div className="bg-red-500" style={{ width: `${(stats.incorrect / summary.totalCards) * 100}%` }}></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.easy}</div>
                <div className="text-sm text-green-700">✅ Easy</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.difficult}</div>
                <div className="text-sm text-yellow-700">⚠️ Difficult</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
                <div className="text-sm text-red-700">❌ Incorrect</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Easy Cards */}
            {stats.easy > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">✅ Easy ({stats.easy})</h3>
                <div className="grid grid-cols-1 gap-3">
                  {summary.easy.map((card) => (
                    <div key={card.id} className="border border-green-200 rounded-lg p-3">
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-2 overflow-hidden">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl.startsWith('/uploads/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${card.imageUrl}` : card.imageUrl}
                              alt={card.birdName}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span class="text-gray-400 text-sm">🐦 Image</span>';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">🐦 Image</span>
                          )}
                        </div>
                        <div className="font-medium text-gray-800">{card.birdName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficult Cards */}
            {stats.difficult > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-yellow-600 mb-4 flex items-center gap-2">⚠️ Difficult ({stats.difficult})</h3>
                <div className="grid grid-cols-1 gap-3">
                  {summary.difficult.map((card) => (
                    <div key={card.id} className="border border-yellow-200 rounded-lg p-3">
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-2 overflow-hidden">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl.startsWith('/uploads/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${card.imageUrl}` : card.imageUrl}
                              alt={card.birdName}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span class="text-gray-400 text-sm">🐦 Image</span>';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">🐦 Image</span>
                          )}
                        </div>
                        <div className="font-medium text-gray-800">{card.birdName}</div>
                        <div className="text-sm text-gray-600">Consider reviewing this bird</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incorrect Cards */}
            {stats.incorrect > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">❌ Incorrect ({stats.incorrect})</h3>
                <div className="grid grid-cols-1 gap-3">
                  {summary.incorrect.map((card) => (
                    <div key={card.id} className="border border-red-200 rounded-lg p-3">
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-2 overflow-hidden">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl.startsWith('/uploads/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${card.imageUrl}` : card.imageUrl}
                              alt={card.birdName}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span class="text-gray-400 text-sm">🐦 Image</span>';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">🐦 Image</span>
                          )}
                        </div>
                        <div className="font-medium text-gray-800">{card.birdName}</div>
                        <div className="text-sm text-gray-600">Study this bird more closely</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleStartNewSession} disabled={startingNewSession} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
              {startingNewSession ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting Review...
                </span>
              ) : (
                'Review This Deck Again'
              )}
            </button>
            <Link href="/" className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 text-center">
              Choose Another Deck
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
