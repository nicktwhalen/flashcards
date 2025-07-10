'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserHeader from '@/components/UserHeader';
import FlashcardForm from '@/components/FlashcardForm';

interface CreateFlashcardPageProps {
  params: Promise<{ id: string }>;
}

export default function CreateFlashcardPage({ params }: CreateFlashcardPageProps): JSX.Element {
  const [deckId, setDeckId] = useState<string>('');

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setDeckId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  if (!deckId) {
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
        <FlashcardForm mode="create" deckId={deckId} />
      </div>
    </ProtectedRoute>
  );
}
