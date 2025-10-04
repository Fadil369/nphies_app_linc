/**
 * NPHIES API Client for Frontend
 * Handles secure communication with the backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { 
  NPHIESEligibilityRequest, 
  NPHIESClaimRequest, 
  NPHIESPreAuthRequest,
  NPHIESEligibilityResponse,
  NPHIESClaimResponse
} from './nphies-types'
import { retryWithBackoff, isRetryableError } from './retry-utils'

interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
}

interface AuthResponse {
  success: boolean
  token: string
  user: {
    username: string
    role: string
    providerId: string
  }
}

class NPHIESAPIClient {
  private client: AxiosInstance
  private token: string | null = null
  private user: AuthResponse['user'] | null = null
  private baseURL: string

  constructor() {
    // Use Cloudflare Worker endpoint for API calls
    // Set VITE_API_URL to your deployed Worker URL in production, or to local dev proxy
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.logout({ reason: 'unauthorized' })
        }
        return Promise.reject(error)
      }
    )

    // Load token from localStorage
    this.loadToken()
  }

  private loadToken(): void {
    if (typeof window === 'undefined') {
      return
    }

    const savedToken = window.localStorage.getItem('nphies_token')
    const savedUser = window.localStorage.getItem('nphies_user')

    if (savedToken) {
      this.token = savedToken
    }

    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser)
      } catch (error) {
        console.warn('Failed to parse stored NPHIES user payload', error)
        window.localStorage.removeItem('nphies_user')
      }
    }
  }

  private saveToken(token: string): void {
    this.token = token
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nphies_token', token)
    }
    this.dispatchAuthChanged()
  }

  private saveUser(user: AuthResponse['user']): void {
    this.user = user
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nphies_user', JSON.stringify(user))
    }
    this.dispatchAuthChanged()
  }

  private clearStoredCredentials(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('nphies_token')
      window.localStorage.removeItem('nphies_user')
    }
  }

  private dispatchAuthChanged(detail?: { reason?: 'manual' | 'unauthorized' }) {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('nphies:auth-changed', {
        detail: {
          isAuthenticated: this.isAuthenticated(),
          user: this.user,
          reason: detail?.reason ?? 'manual'
        }
      }))

      if (detail?.reason === 'unauthorized') {
        document.dispatchEvent(new CustomEvent('nphies:unauthorized'))
      }
    }
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/auth/login', {
        username,
        password,
      })

      if (response.data.success) {
        this.saveToken(response.data.token)
        this.saveUser(response.data.user)
      }

      return response.data
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error('Authentication failed')
    }
  }

  logout(options?: { reason?: 'manual' | 'unauthorized' }): void {
    this.token = null
    this.user = null
    this.clearStoredCredentials()
    this.dispatchAuthChanged({ reason: options?.reason ?? 'manual' })
  }

  async checkEligibility(request: NPHIESEligibilityRequest): Promise<APIResponse<NPHIESEligibilityResponse>> {
    try {
      const response = await retryWithBackoff(
        () => this.client.post<APIResponse<NPHIESEligibilityResponse>>(
          '/api/nphies/eligibility',
          request
        ),
        {
          maxAttempts: 3,
          shouldRetry: (error: Error) => isRetryableError(error)
        }
      )
      return response.data
    } catch (error) {
      console.error('Eligibility check failed:', error)
      throw this.handleAPIError(error as AxiosError, 'Eligibility check failed')
    }
  }

  async submitClaim(request: NPHIESClaimRequest): Promise<APIResponse<NPHIESClaimResponse>> {
    try {
      const response = await retryWithBackoff(
        () => this.client.post<APIResponse<NPHIESClaimResponse>>(
          '/api/nphies/claims',
          request
        ),
        {
          maxAttempts: 3,
          shouldRetry: (error: Error) => isRetryableError(error)
        }
      )
      return response.data
    } catch (error) {
      console.error('Claim submission failed:', error)
      throw this.handleAPIError(error as AxiosError, 'Claim submission failed')
    }
  }

  async submitPreAuth(request: NPHIESPreAuthRequest): Promise<APIResponse> {
    try {
      const response = await this.client.post<APIResponse>(
        '/api/nphies/preauth',
        request
      )
      return response.data
    } catch (error) {
      console.error('Pre-auth submission failed:', error)
      throw this.handleAPIError(error as AxiosError, 'Pre-authorization submission failed')
    }
  }

  async getClaimStatus(claimId: string): Promise<APIResponse<NPHIESClaimResponse>> {
    try {
      const response = await this.client.get<APIResponse<NPHIESClaimResponse>>(
        `/api/nphies/claims/${claimId}/status`
      )
      return response.data
    } catch (error) {
      console.error('Claim status check failed:', error)
      throw this.handleAPIError(error as AxiosError, 'Claim status check failed')
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health')
      return response.data
    } catch (error) {
      console.error('Health check failed:', error)
      throw new Error('Backend service unavailable')
    }
  }

  private handleAPIError(error: AxiosError, defaultMessage: string): Error {
    if (error.response?.data) {
      const errorData = error.response.data as any
      return new Error(errorData.error || errorData.message || defaultMessage)
    }
    
    if (error.code === 'ECONNREFUSED') {
      return new Error('Cannot connect to NPHIES service. Please try again later.')
    }
    
    if (error.code === 'ETIMEDOUT') {
      return new Error('Request timeout. The service is taking too long to respond.')
    }
    
    return new Error(defaultMessage)
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getUser(): AuthResponse['user'] | null {
    return this.user
  }

  getToken(): string | null {
    return this.token
  }
}

// Create singleton instance
export const nphiesAPI = new NPHIESAPIClient()

// React hooks for API integration
import { useState, useEffect, useCallback } from 'react'

const AUTH_CHANGED_EVENT = 'nphies:auth-changed'
const UNAUTHORIZED_EVENT = 'nphies:unauthorized'

export function useNPHIESAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(nphiesAPI.isAuthenticated())
  const [user, setUser] = useState<AuthResponse['user'] | null>(nphiesAPI.getUser())
  const [loading, setLoading] = useState(false)
  const [lastReason, setLastReason] = useState<'manual' | 'unauthorized' | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const response = await nphiesAPI.login(username, password)
      if (response.success) {
        setIsAuthenticated(true)
        setUser(response.user)
        setLastReason(null)
        return { success: true }
      }
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    nphiesAPI.logout({ reason: 'manual' })
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const authChangedHandler = ((event: Event) => {
      const detail = (event as CustomEvent<{ isAuthenticated: boolean; user: AuthResponse['user'] | null; reason: 'manual' | 'unauthorized' }>).detail
      if (!detail) return
      setIsAuthenticated(detail.isAuthenticated)
      setUser(detail.user ?? null)
      setLastReason(detail.reason)
    }) as EventListener

    const unauthorizedHandler = () => {
      setIsAuthenticated(false)
      setUser(null)
      setLastReason('unauthorized')
    }

    document.addEventListener(AUTH_CHANGED_EVENT, authChangedHandler)
    document.addEventListener(UNAUTHORIZED_EVENT, unauthorizedHandler)

    return () => {
      document.removeEventListener(AUTH_CHANGED_EVENT, authChangedHandler)
      document.removeEventListener(UNAUTHORIZED_EVENT, unauthorizedHandler)
    }
  }, [])

  return {
    isAuthenticated,
    user,
    loading,
    lastReason,
    login,
    logout,
  }
}

export function useNPHIESEligibility() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NPHIESEligibilityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkEligibility = useCallback(async (request: NPHIESEligibilityRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await nphiesAPI.checkEligibility(request)
      if (response.success) {
        setResult(response.data!)
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Eligibility check failed')
        return { success: false, error: response.error }
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    loading,
    result,
    error,
    checkEligibility,
    clearResult,
  }
}

export function useNPHIESClaims() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NPHIESClaimResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitClaim = useCallback(async (request: NPHIESClaimRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await nphiesAPI.submitClaim(request)
      if (response.success) {
        setResult(response.data!)
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Claim submission failed')
        return { success: false, error: response.error }
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const getClaimStatus = useCallback(async (claimId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await nphiesAPI.getClaimStatus(claimId)
      if (response.success) {
        setResult(response.data!)
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Claim status check failed')
        return { success: false, error: response.error }
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    loading,
    result,
    error,
    submitClaim,
    getClaimStatus,
    clearResult,
  }
}

export function useNPHIESHealth() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    setStatus('checking')
    try {
      await nphiesAPI.healthCheck()
      setStatus('online')
      setLastCheck(new Date())
    } catch (error) {
      setStatus('offline')
      setLastCheck(new Date())
    }
  }, [])

  useEffect(() => {
    checkHealth()
    
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    status,
    lastCheck,
    checkHealth,
  }
}
