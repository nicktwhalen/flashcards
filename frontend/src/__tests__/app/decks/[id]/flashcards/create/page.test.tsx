import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateFlashcardPage from '@/app/decks/[id]/flashcards/create/page';
import { api } from '@/lib/api';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  api: {
    decks: {
      getById: jest.fn(),
      createFlashcard: jest.fn(),
    },
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch for file upload
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

const mockRouter = {
  push: jest.fn(),
};

const mockDeck = {
  id: 'deck-1',
  name: 'Test Deck',
  description: 'Test deck description',
  createdAt: new Date().toISOString(),
  userId: 'user-1',
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'test-picture.jpg',
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('CreateFlashcardPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (api.decks.getById as jest.Mock).mockResolvedValue(mockDeck);
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'token') return 'mock-token';
      return null;
    });
    (fetch as jest.Mock).mockClear();
    mockRouter.push.mockClear();
  });

  it('should render upload form correctly', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
      expect(screen.getByLabelText('Bird Name')).toBeInTheDocument();
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
    });
  });

  it('should handle file upload successfully', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    // Mock successful upload
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fileId: 'test-file-id', url: '/api/uploads/flashcards/test-file-id' }),
    });

    (api.decks.createFlashcard as jest.Mock).mockResolvedValue({
      id: 'flashcard-1',
      birdName: 'Test Bird',
      imageUrl: '/api/uploads/flashcards/test-file-id',
    });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Fill in bird name
    const birdNameInput = screen.getByLabelText('Bird Name');
    fireEvent.change(birdNameInput, { target: { value: 'Test Bird' } });

    // Simulate file upload
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit form
    const submitButton = screen.getByText('Add Flashcard');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/uploads/flashcards/deck-1',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }),
      );
    });

    await waitFor(() => {
      expect(api.decks.createFlashcard).toHaveBeenCalledWith('deck-1', {
        birdName: 'Test Bird',
        imageUrl: '',
        fileId: 'test-file-id',
      });
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/decks/deck-1');
    });
  });

  it('should validate file type', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Try to upload invalid file type
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Please select a valid image file (JPEG, PNG, GIF, or WebP)')).toBeInTheDocument();
    });
  });

  it('should validate file size', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Try to upload file that's too large
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
    });
  });

  it('should handle upload errors gracefully', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    // Mock failed upload
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Fill in bird name
    const birdNameInput = screen.getByLabelText('Bird Name');
    fireEvent.change(birdNameInput, { target: { value: 'Test Bird' } });

    // Simulate file upload
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit form
    const submitButton = screen.getByText('Add Flashcard');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Upload failed: 400 Bad Request')).toBeInTheDocument();
    });
  });

  it('should require file upload to submit form', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Fill in bird name only (no file)
    const birdNameInput = screen.getByLabelText('Bird Name');
    fireEvent.change(birdNameInput, { target: { value: 'Test Bird' } });

    // Submit button should be disabled
    const submitButton = screen.getByText('Add Flashcard');
    expect(submitButton).toBeDisabled();
  });

  it('should show upload section initially and hide when file is selected', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Upload section should be visible initially
    expect(screen.getByText('Click to upload')).toBeInTheDocument();

    // Upload a file
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // Upload section should be hidden
      expect(screen.queryByText('Click to upload')).not.toBeInTheDocument();
      // Preview should be visible
      expect(screen.getByAltText('Bird preview')).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByTitle('Remove image');
    fireEvent.click(removeButton);

    await waitFor(() => {
      // Upload section should be visible again
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
      // Preview should be hidden
      expect(screen.queryByAltText('Bird preview')).not.toBeInTheDocument();
    });
  });

  it('should provide visual feedback during drag and drop', async () => {
    const mockParams = Promise.resolve({ id: 'deck-1' });

    render(
      <TestWrapper>
        <CreateFlashcardPage params={mockParams} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Flashcard')).toBeInTheDocument();
    });

    // Initially should show normal upload text
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, GIF, WebP (MAX. 5MB)')).toBeInTheDocument();

    // Get the upload label directly
    const uploadLabel = document.querySelector('label[for="image-upload"]');
    expect(uploadLabel).toBeInTheDocument();

    // Simulate drag enter
    fireEvent.dragEnter(uploadLabel!, {
      dataTransfer: { files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })] },
    });

    await waitFor(() => {
      // Should show drag feedback text
      expect(screen.getByText('Drop image here')).toBeInTheDocument();
      expect(screen.getByText('Release to upload')).toBeInTheDocument();
    });

    // Simulate drop to reset state
    fireEvent.drop(uploadLabel!, {
      dataTransfer: { files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })] },
    });

    await waitFor(() => {
      // After drop, should show preview instead of upload section
      expect(screen.queryByText('Click to upload')).not.toBeInTheDocument();
      expect(screen.getByAltText('Bird preview')).toBeInTheDocument();
    });
  });
});
