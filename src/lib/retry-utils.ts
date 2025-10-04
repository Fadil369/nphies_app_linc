/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx errors
    const retryableErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'network']
    const errorMessage = error.message.toLowerCase()
    return retryableErrors.some(e => errorMessage.includes(e.toLowerCase()))
  }
}

/**
 * Exponentially increases delay between retries
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1)
  return Math.min(delay, options.maxDelay)
}

/**
 * Adds random jitter to prevent thundering herd problem
 */
function addJitter(delay: number): number {
  return delay + Math.random() * 1000
}

/**
 * Wait for specified milliseconds
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry if this is the last attempt or if shouldRetry returns false
      if (attempt === opts.maxAttempts || !opts.shouldRetry(lastError, attempt)) {
        throw lastError
      }

      // Calculate delay with jitter and wait before retrying
      const delay = calculateDelay(attempt, opts)
      const delayWithJitter = addJitter(delay)

      console.warn(
        `Attempt ${attempt}/${opts.maxAttempts} failed. Retrying in ${Math.round(delayWithJitter)}ms...`,
        lastError.message
      )

      await wait(delayWithJitter)
    }
  }

  throw lastError!
}

/**
 * Create a retryable version of an async function
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options)
  }) as T
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  return DEFAULT_OPTIONS.shouldRetry(error, 1)
}

/**
 * Format retry error message
 */
export function formatRetryError(error: Error, attempts: number): string {
  return `Operation failed after ${attempts} attempt${attempts > 1 ? 's' : ''}: ${error.message}`
}
