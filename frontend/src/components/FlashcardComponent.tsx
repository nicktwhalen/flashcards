'use client';

import { useState } from 'react';
import { Flashcard, DifficultyRating } from 'shared';

interface FlashcardComponentProps {
  flashcard: Flashcard;
  onRate: (rating: DifficultyRating) => void;
  currentIndex: number;
  totalCards: number;
}

export default function FlashcardComponent({ 
  flashcard, 
  onRate, 
  currentIndex, 
  totalCards 
}: FlashcardComponentProps) {
  const [showName, setShowName] = useState(false);
  const [selectedRating, setSelectedRating] = useState<DifficultyRating | null>(null);

  const handleRevealName = () => {
    setShowName(true);
  };

  const handleRate = (rating: DifficultyRating) => {
    setSelectedRating(rating);
    setTimeout(() => {
      onRate(rating);
      setShowName(false);
      setSelectedRating(null);
    }, 500);
  };

  const getRatingColor = (rating: DifficultyRating) => {
    switch (rating) {
      case DifficultyRating.EASY:
        return 'bg-green-500 hover:bg-green-600';
      case DifficultyRating.DIFFICULT:
        return 'bg-yellow-500 hover:bg-yellow-600';
      case DifficultyRating.INCORRECT:
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getRatingEmoji = (rating: DifficultyRating) => {
    switch (rating) {
      case DifficultyRating.EASY:
        return '✅';
      case DifficultyRating.DIFFICULT:
        return '⚠️';
      case DifficultyRating.INCORRECT:
        return '❌';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentIndex) / totalCards) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        {/* Bird Image */}
        <div className="text-center mb-6">
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-4">
            {flashcard.imageUrl ? (
              <img 
                src={flashcard.imageUrl.startsWith('/uploads/') 
                  ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${flashcard.imageUrl}`
                  : flashcard.imageUrl
                }
                alt="Bird to identify"
                className="max-h-full max-w-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className="text-gray-400 text-lg hidden">
              🐦 Bird Image
            </div>
          </div>
          
          {!showName && (
            <button
              onClick={handleRevealName}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Reveal Bird Name
            </button>
          )}
        </div>

        {/* Bird Name (Hidden until revealed) */}
        {showName && (
          <div className="text-center mb-8 animate-fadeIn">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                {flashcard.birdName}
              </h2>
            </div>
          </div>
        )}

        {/* Difficulty Rating Section */}
        <div className="text-center mb-6">
          <p className="text-blue-600 mb-4">
            How well did you know this bird?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {Object.values(DifficultyRating).map((rating) => (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                disabled={selectedRating !== null}
                className={`
                  ${getRatingColor(rating)}
                  text-white px-6 py-4 rounded-lg font-semibold transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 min-w-32
                  ${selectedRating === rating ? 'scale-105 ring-4 ring-white ring-opacity-50' : ''}
                `}
              >
                <span className="text-xl">{getRatingEmoji(rating)}</span>
                <span className="capitalize">{rating}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-500 text-sm">
        <p>Look at the bird image and try to identify the species.</p>
        <p>Rate your knowledge or click "Reveal Bird Name" to see the answer first.</p>
      </div>
    </div>
  );
}