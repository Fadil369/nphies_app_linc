/**
 * Test setup file for Jest
 * Configures testing environment and global mocks
 */

/// <reference types="jest" />
import '@testing-library/jest-dom'

// Make the `jest` global visible as a value to TypeScript and declare test lifecycle globals
declare const jest: any
declare function beforeAll(fn: () => void | Promise<void>): void
declare function afterAll(fn: () => void | Promise<void>): void
declare function afterEach(fn: () => void | Promise<void>): void
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment (cast to any to satisfy jest/node typings)
;(global as any).TextEncoder = TextEncoder as any
;(global as any).TextDecoder = TextDecoder as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (jest as any).fn().mockImplementation((query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock localStorage (include length and key to satisfy Storage interface)
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn().mockReturnValue(null),
}
;(global as any).localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn().mockReturnValue(null),
}
;(global as any).sessionStorage = sessionStorageMock

// Mock fetch API
global.fetch = jest.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn()

// Mock performance API
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
}

// Suppress console.error for expected test errors
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})