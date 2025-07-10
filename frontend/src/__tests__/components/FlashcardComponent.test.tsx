import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockFlashcard } from '../utils/test-utils';
import FlashcardComponent from '../../components/FlashcardComponent';
import { DifficultyRating } from 'shared';

describe('FlashcardComponent', () => {
  const mockOnRate = jest.fn();
  const defaultProps = {
    flashcard: mockFlashcard,
    onRate: mockOnRate,
    currentIndex: 0,
    totalCards: 5,
  };

  beforeEach(() => {
    mockOnRate.mockClear();
  });

  it('should render flashcard with progress information', () => {
    render(<FlashcardComponent {...defaultProps} />);

    expect(screen.getByText('Card 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('0% Complete')).toBeInTheDocument();
    expect(screen.getByText('Reveal Bird Name')).toBeInTheDocument();
  });

  it('should show progress bar with correct width', () => {
    render(<FlashcardComponent {...defaultProps} currentIndex={2} />);

    expect(screen.getByText('Card 3 of 5')).toBeInTheDocument();
    expect(screen.getByText('40% Complete')).toBeInTheDocument();
  });

  it('should display bird image', () => {
    render(<FlashcardComponent {...defaultProps} />);

    const image = screen.getByRole('img', { name: 'Bird to identify' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockFlashcard.imageUrl);
  });

  it('should reveal bird name when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FlashcardComponent {...defaultProps} />);

    expect(screen.queryByText(mockFlashcard.birdName)).not.toBeInTheDocument();

    const revealButton = screen.getByText('Reveal Bird Name');
    await user.click(revealButton);

    expect(screen.getByText(mockFlashcard.birdName)).toBeInTheDocument();
    expect(screen.queryByText('Reveal Bird Name')).not.toBeInTheDocument();
  });

  it('should show difficulty rating buttons after revealing name', async () => {
    const user = userEvent.setup();
    render(<FlashcardComponent {...defaultProps} />);

    const revealButton = screen.getByText('Reveal Bird Name');
    await user.click(revealButton);

    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('difficult')).toBeInTheDocument();
    expect(screen.getByText('incorrect')).toBeInTheDocument();
  });

  it('should call onRate when difficulty button is clicked', async () => {
    const user = userEvent.setup();
    render(<FlashcardComponent {...defaultProps} />);

    // First reveal the name
    const revealButton = screen.getByText('Reveal Bird Name');
    await user.click(revealButton);

    // Then click easy button
    const easyButton = screen.getByText('easy');
    await user.click(easyButton);

    await waitFor(
      () => {
        expect(mockOnRate).toHaveBeenCalledWith(DifficultyRating.EASY);
      },
      { timeout: 1000 },
    );
  });

  it('should handle all difficulty ratings', async () => {
    const user = userEvent.setup();

    // Test Easy
    const { rerender } = render(<FlashcardComponent {...defaultProps} />);
    await user.click(screen.getByText('Reveal Bird Name'));
    await user.click(screen.getByText('easy'));
    await waitFor(() => expect(mockOnRate).toHaveBeenCalledWith(DifficultyRating.EASY));

    // Reset and test Difficult
    mockOnRate.mockClear();
    rerender(<FlashcardComponent {...defaultProps} />);
    await user.click(screen.getByText('Reveal Bird Name'));
    await user.click(screen.getByText('difficult'));
    await waitFor(() => expect(mockOnRate).toHaveBeenCalledWith(DifficultyRating.DIFFICULT));

    // Reset and test Incorrect
    mockOnRate.mockClear();
    rerender(<FlashcardComponent {...defaultProps} />);
    await user.click(screen.getByText('Reveal Bird Name'));
    await user.click(screen.getByText('incorrect'));
    await waitFor(() => expect(mockOnRate).toHaveBeenCalledWith(DifficultyRating.INCORRECT));
  });

  it('should disable rating buttons after selection', async () => {
    const user = userEvent.setup();
    render(<FlashcardComponent {...defaultProps} />);

    await user.click(screen.getByText('Reveal Bird Name'));

    const easyButton = screen.getByText('easy').closest('button')!;
    const difficultButton = screen.getByText('difficult').closest('button')!;
    const incorrectButton = screen.getByText('incorrect').closest('button')!;

    await user.click(easyButton);

    // All buttons should be disabled after selection
    expect(easyButton).toBeDisabled();
    expect(difficultButton).toBeDisabled();
    expect(incorrectButton).toBeDisabled();
  });

  it('should show instructions when name is not revealed', () => {
    render(<FlashcardComponent {...defaultProps} />);

    expect(screen.getByText('Look at the bird image and try to identify the species.')).toBeInTheDocument();
    expect(screen.getByText('Rate your knowledge or click "Reveal Bird Name" to see the answer first.')).toBeInTheDocument();
  });

  it('should handle image load error gracefully', () => {
    render(<FlashcardComponent {...defaultProps} />);

    const image = screen.getByRole('img', { name: 'Bird to identify' });
    fireEvent.error(image);

    // Image should be hidden and fallback should show
    expect(image).toHaveStyle('display: none');
  });
});
