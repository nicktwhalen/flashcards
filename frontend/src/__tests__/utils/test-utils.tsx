import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock data for testing
export const mockDeck = {
  id: '1',
  name: 'Test Deck',
  description: 'A test deck for unit testing',
  createdAt: new Date('2023-01-01'),
}

export const mockFlashcard = {
  id: '1',
  deckId: '1',
  birdName: 'Test Robin',
  imageUrl: 'https://example.com/robin.jpg',
  createdAt: new Date('2023-01-01'),
}

export const mockReviewSession = {
  id: '1',
  deckId: '1',
  startedAt: new Date('2023-01-01'),
  completedAt: undefined,
  deck: mockDeck,
}

export const mockSessionSummary = {
  sessionId: '1',
  deckName: 'Test Deck',
  totalCards: 3,
  easy: [mockFlashcard],
  difficult: [],
  incorrect: [],
  completedAt: new Date('2023-01-01'),
}

// Mock API responses
export const createMockFetch = (responses: Record<string, any>) => {
  return jest.fn().mockImplementation((url: string) => {
    const response = responses[url] || responses.default
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    })
  })
}

// Mock user for testing
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg'
}

// Mock localStorage for authentication
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockImplementation((key: string) => {
      if (key === 'token') return 'mock-jwt-token'
      if (key === 'user') return JSON.stringify(mockUser)
      return null
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

// Wrapper component with AuthProvider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Add a simple test to prevent "no tests" error
describe('test-utils', () => {
  it('should export mock data', () => {
    expect(mockDeck).toBeDefined()
    expect(mockFlashcard).toBeDefined()
    expect(mockUser).toBeDefined()
  })
})