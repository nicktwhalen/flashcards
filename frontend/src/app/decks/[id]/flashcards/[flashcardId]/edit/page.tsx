'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserHeader from '@/components/UserHeader';
import FlashcardForm from '@/components/FlashcardForm';

interface EditFlashcardPageProps {
  params: Promise<{ id: string; flashcardId: string }>;
}

export default function EditFlashcardPage({ params }: EditFlashcardPageProps): JSX.Element {
  const [deckId, setDeckId] = useState<string>('');
  const [flashcardId, setFlashcardId] = useState<string>('');

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setDeckId(resolvedParams.id);
      setFlashcardId(resolvedParams.flashcardId);
    }
    loadParams();
  }, [params]);

  if (!deckId || !flashcardId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <FlashcardForm mode="edit" deckId={deckId} flashcardId={flashcardId} />
      </div>
    </ProtectedRoute>
  );
}
