"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { CreateFlashcardDto, UpdateFlashcardDto, Deck, Flashcard } from "shared";

interface FlashcardFormProps {
  mode: 'create' | 'edit';
  deckId: string;
  flashcardId?: string;
}

export default function FlashcardForm({ mode, deckId, flashcardId }: FlashcardFormProps): JSX.Element {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [formData, setFormData] = useState({
    birdName: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    if (!deckId) return;

    async function loadData() {
      try {
        if (mode === 'edit' && flashcardId) {
          const [deckData, flashcardData] = await Promise.all([
            api.decks.getById(deckId),
            api.decks.getFlashcards(deckId)
          ]);
          
          setDeck(deckData);
          
          const currentFlashcard = flashcardData.find(f => f.id === flashcardId);
          if (!currentFlashcard) {
            setError("Flashcard not found");
            return;
          }
          
          setFlashcard(currentFlashcard);
          setFormData({ birdName: currentFlashcard.birdName });
          setCurrentImageUrl(currentFlashcard.imageUrl);
        } else {
          const deckData = await api.decks.getById(deckId);
          setDeck(deckData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [deckId, flashcardId, mode]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        // Validate that a file is selected for create mode
        if (!selectedFile) {
          setError('Please select an image file');
          setLoading(false);
          return;
        }

        // Upload the file
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', selectedFile);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/flashcards/${deckId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: uploadFormData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        const uploadResult = await response.json();
        setUploading(false);
        
        // Create flashcard with file ID
        const createData: CreateFlashcardDto = {
          birdName: formData.birdName,
          imageUrl: '', // Empty since we're using file upload
          fileId: uploadResult.fileId
        };
        
        await api.decks.createFlashcard(deckId, createData);
      } else {
        // Edit mode
        if (!formData.birdName.trim()) {
          setError('Bird name is required');
          return;
        }

        if (!selectedFile && !currentImageUrl) {
          setError('Please select an image file');
          return;
        }

        let fileId: string | undefined;

        // Upload new image if one was selected
        if (selectedFile) {
          setUploading(true);
          try {
            const uploadResponse = await api.upload.uploadFlashcardImage(deckId, selectedFile);
            fileId = uploadResponse.fileId;
          } catch (uploadError) {
            throw new Error(uploadError instanceof Error ? uploadError.message : 'Failed to upload image');
          } finally {
            setUploading(false);
          }
        }

        // Update flashcard
        const updateData: UpdateFlashcardDto = {
          birdName: formData.birdName.trim(),
        };

        // If new file was uploaded, include the fileId
        if (fileId) {
          (updateData as any).fileId = fileId;
        }

        await api.decks.updateFlashcard(deckId, flashcardId!, updateData);
      }

      router.push(`/decks/${deckId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} flashcard`);
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateAndSetFile = (file: File): void => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleRemoveFile = (): void => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const getCurrentImageSrc = (): string | null => {
    if (!currentImageUrl) return null;
    
    return currentImageUrl.startsWith('/uploads/') 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${currentImageUrl}`
      : currentImageUrl;
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcard...</p>
        </div>
      </div>
    );
  }

  if (error && !deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={mode === 'create' ? "/" : `/decks/${deckId}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {mode === 'create' ? 'Back to Decks' : 'Back to Deck'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/decks/${deckId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to {deck?.name || "Deck"}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {mode === 'create' ? 'Add New Flashcard' : 'Edit Flashcard'}
          </h1>

          {deck && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Deck:</strong> {deck.name}
              </p>
              {deck.description && (
                <p className="text-blue-600 text-sm mt-1">{deck.description}</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="text-red-400 text-xl mr-3">⚠️</div>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="birdName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bird Name
              </label>
              <input
                type="text"
                id="birdName"
                name="birdName"
                value={formData.birdName}
                onChange={handleChange}
                required
                placeholder="e.g., American Robin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bird Image
              </label>
              
              {/* File Upload Section - Only show when no file is selected and no current image */}
              {!selectedFile && !currentImageUrl && (
                <div className="mb-4">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                      }`}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className={`w-8 h-8 mb-4 transition-colors duration-200 ${
                            isDragOver ? 'text-blue-500' : 'text-gray-500'
                          }`}
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className={`mb-2 text-sm transition-colors duration-200 ${
                          isDragOver ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          <span className="font-semibold">
                            {isDragOver ? 'Drop image here' : 'Click to upload'}
                          </span>
                          {!isDragOver && ' or drag and drop'}
                        </p>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDragOver ? 'text-blue-500' : 'text-gray-500'
                        }`}>
                          {isDragOver ? 'Release to upload' : 'PNG, JPG, GIF, WebP (MAX. 5MB)'}
                        </p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Current Image Display - Show as if it's a selected file with delete button */}
              {currentImageUrl && !selectedFile && (
                <div className="mb-4">
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    <div className="relative">
                      <img
                        src={getCurrentImageSrc()!}
                        alt={flashcard?.birdName}
                        className="max-w-full h-48 object-cover rounded-md mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="text-gray-400 text-center py-20 hidden">
                        🐦 Image not available
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentImageUrl(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      Current image
                    </p>
                  </div>
                </div>
              )}

              {/* Image Preview Section - Only show when file is selected */}
              {selectedFile && imagePreview && (
                <div className="mb-4">
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Bird preview"
                        className="max-w-full h-48 object-cover rounded-md mx-auto"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || uploading || !formData.birdName.trim() || (mode === 'create' && !selectedFile) || (mode === 'edit' && !selectedFile && !currentImageUrl)}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {uploading ? "Uploading..." : loading ? (mode === 'create' ? "Adding..." : "Updating...") : (mode === 'create' ? "Add Flashcard" : "Update Flashcard")}
              </button>

              <Link
                href={`/decks/${deckId}`}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}