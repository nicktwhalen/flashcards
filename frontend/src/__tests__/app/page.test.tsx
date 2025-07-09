import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { render, createMockFetch, mockDeck } from '../utils/test-utils'
import HomePage from '../../app/page'

// Mock the API
jest.mock('../../lib/api', () => ({
  api: {
    decks: {
      getAll: jest.fn(),
      getFlashcards: jest.fn(),
    },
  },
}))

import { api } from '../../lib/api'

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock getFlashcards to return empty array by default
    ;(api.decks.getFlashcards as jest.Mock).mockResolvedValue([])
  })

  it('should render loading state initially', () => {
    ;(api.decks.getAll as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    render(<HomePage />)
    
    expect(screen.getByText('Loading decks...')).toBeInTheDocument()
    expect(screen.getByText('Loading decks...')).toBeInTheDocument()
  })

  it('should render decks when loaded successfully', async () => {
    const mockDecks = [mockDeck]
    ;(api.decks.getAll as jest.Mock).mockResolvedValue(mockDecks)
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
      expect(screen.getByText('Your Decks (1 available)')).toBeInTheDocument()
      expect(screen.getByText(mockDeck.name)).toBeInTheDocument()
      expect(screen.getByText(mockDeck.description)).toBeInTheDocument()
    })
  })

  it('should render empty state when no decks available', async () => {
    ;(api.decks.getAll as jest.Mock).mockResolvedValue([])
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('No decks available')).toBeInTheDocument()
      expect(screen.getByText('Create your first flashcard deck to get started with bird identification practice.')).toBeInTheDocument()
    })
  })

  it('should render error state when API fails', async () => {
    const errorMessage = 'Failed to load decks'
    ;(api.decks.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should display deck information correctly', async () => {
    const mockDecks = [
      {
        ...mockDeck,
        createdAt: new Date('2023-01-01T12:00:00Z'),
      },
    ]
    ;(api.decks.getAll as jest.Mock).mockResolvedValue(mockDecks)
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText(mockDeck.name)).toBeInTheDocument()
      expect(screen.getByText(mockDeck.description)).toBeInTheDocument()
      expect(screen.getByText(/Created.*1\/1\/2023|Created.*12\/31\/2022/)).toBeInTheDocument()
      expect(screen.getByText('Start Review')).toBeInTheDocument()
    })
  })

  it('should render multiple decks', async () => {
    const mockDecks = [
      { ...mockDeck, id: '1', name: 'Deck 1' },
      { ...mockDeck, id: '2', name: 'Deck 2' },
      { ...mockDeck, id: '3', name: 'Deck 3' },
    ]
    ;(api.decks.getAll as jest.Mock).mockResolvedValue(mockDecks)
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Your Decks (3 available)')).toBeInTheDocument()
      expect(screen.getByText('Deck 1')).toBeInTheDocument()
      expect(screen.getByText('Deck 2')).toBeInTheDocument()
      expect(screen.getByText('Deck 3')).toBeInTheDocument()
    })
  })

  it('should have proper links to deck pages', async () => {
    const mockDecks = [mockDeck]
    ;(api.decks.getAll as jest.Mock).mockResolvedValue(mockDecks)
    
    render(<HomePage />)
    
    await waitFor(() => {
      const deckLink = screen.getByRole('link', { name: new RegExp(mockDeck.name) })
      expect(deckLink).toHaveAttribute('href', `/decks/${mockDeck.id}`)
    })
  })

  it('should show app title and description', async () => {
    ;(api.decks.getAll as jest.Mock).mockResolvedValue([])
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
      expect(screen.getByText('Continue your bird identification journey')).toBeInTheDocument()
    })
  })
})