/**
 * Cloudflare Worker for NPHIES Backend API
 * Handles secure communication with Saudi Arabia's NPHIES platform
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign } from 'hono/jwt'
import { logger } from 'hono/logger'
import { validator } from 'hono/validator'
import { z } from 'zod'

type Bindings = {
  NPHIES_API_URL: string
  NPHIES_CLIENT_ID: string
  NPHIES_CLIENT_SECRET: string
  JWT_SECRET: string
  OPENAI_API_KEY: string
  KV_NAMESPACE: KVNamespace
  D1_DATABASE: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['https://your-domain.pages.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Validation schemas
const EligibilityRequestSchema = z.object({
  patientId: z.string().length(10, 'Patient ID must be 10 digits'),
  insuranceId: z.string().min(8).max(12),
  providerId: z.string().length(7, 'Provider ID must be 7 digits'),
  serviceDate: z.string().refine((value) => {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
      return false
    }
    const parsed = Date.parse(value)
    return !Number.isNaN(parsed)
  }, { message: 'Service date must be a valid YYYY-MM-DD value' }),
  serviceType: z.string().optional()
})

const ClaimRequestSchema = z.object({
  patientInfo: z.object({
    id: z.string().length(10),
    name: z.string().min(1),
    dob: z.string(),
    gender: z.enum(['M', 'F'])
  }),
  providerInfo: z.object({
    id: z.string().length(7),
    name: z.string().min(1),
    license: z.string().min(1)
  }),
  services: z.array(z.object({
    code: z.string().min(3).max(8),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    date: z.string()
  })),
  diagnosis: z.array(z.object({
    code: z.string().regex(/^[A-Z][0-9]{2}(\\.[0-9]{1,2})?$/, 'Invalid ICD-10 format'),
    description: z.string().min(1),
    type: z.enum(['primary', 'secondary'])
  })),
  totalAmount: z.number().positive(),
  claimType: z.enum(['inpatient', 'outpatient', 'pharmacy', 'dental'])
})

const PreAuthRequestSchema = z.object({
  patientId: z.string().length(10),
  providerId: z.string().length(7),
  serviceRequested: z.string().min(1),
  medicalJustification: z.string().min(10),
  estimatedCost: z.number().positive(),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  supportingDocuments: z.array(z.string()).optional()
})

// NPHIES API client for Cloudflare Workers
class NPHIESClient {
  private baseURL: string
  private clientId: string
  private clientSecret: string
  private kv: KVNamespace

  constructor(env: Bindings) {
    this.baseURL = env.NPHIES_API_URL
    this.clientId = env.NPHIES_CLIENT_ID
    this.clientSecret = env.NPHIES_CLIENT_SECRET
    this.kv = env.KV_NAMESPACE
  }

  async getAccessToken(): Promise<string> {
    // Check cache first
    const cachedToken = await this.kv.get('nphies_access_token')
    if (cachedToken) {
      return cachedToken
    }

    // Get new token
    const response = await fetch(`${this.baseURL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'eligibility claims preauth'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to authenticate with NPHIES')
    }

    const data = await response.json() as any
    const accessToken = data.access_token
    const expiresIn = data.expires_in

    // Cache token for 90% of its lifetime
    await this.kv.put('nphies_access_token', accessToken, {
      expirationTtl: Math.floor(expiresIn * 0.9)
    })

    return accessToken
  }

  async checkEligibility(request: z.infer<typeof EligibilityRequestSchema>) {
    const accessToken = await this.getAccessToken()
    
    const response = await fetch(`${this.baseURL}/eligibility/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Provider-ID': request.providerId
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json() as any
      return {
        success: false,
        error: error.error || 'Eligibility check failed',
        code: error.code || 'ELIGIBILITY_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    }
  }

  async submitClaim(request: z.infer<typeof ClaimRequestSchema>) {
    const accessToken = await this.getAccessToken()
    
    const response = await fetch(`${this.baseURL}/claims/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Provider-ID': request.providerInfo.id
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json() as any
      return {
        success: false,
        error: error.error || 'Claim submission failed',
        code: error.code || 'CLAIM_SUBMISSION_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      claimId: data.claimId,
      timestamp: new Date().toISOString()
    }
  }

  async submitPreAuth(request: z.infer<typeof PreAuthRequestSchema>) {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseURL}/preauth/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Provider-ID': request.providerId
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json() as any
      return {
        success: false,
        error: error.error || 'Pre-authorization submission failed',
        code: error.code || 'PREAUTH_SUBMISSION_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      preAuthId: data.preAuthId,
      timestamp: new Date().toISOString()
    }
  }

  async getClaimStatus(claimId: string) {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseURL}/claims/${claimId}/status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json() as any
      return {
        success: false,
        error: error.error || 'Claim status check failed',
        code: error.code || 'CLAIM_STATUS_ERROR',
        timestamp: new Date().toISOString()
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    }
  }
}

// Routes

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'cloudflare-workers'
  })
})

// Authentication endpoint
app.post('/auth/login', 
  validator('json', (value, c) => {
    const schema = z.object({
      username: z.string().email(),
      password: z.string().min(6)
    })
    const result = schema.safeParse(value)
    if (!result.success) {
      return c.json({ error: 'Invalid request format' }, 400)
    }
    return result.data
  }),
  async (c) => {
    const { username, password } = c.req.valid('json')
    
    // Demo authentication - replace with real authentication
    if (username === 'demo@healthcare.sa' && password === 'demo123') {
      const token = await sign({
        username,
        role: 'healthcare_provider',
        providerId: '1234567',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      }, c.env.JWT_SECRET)
      
      return c.json({
        success: true,
        token,
        user: {
          username,
          role: 'healthcare_provider',
          providerId: '1234567'
        }
      })
    }
    
    return c.json({ error: 'Invalid credentials' }, 401)
  }
)

// JWT middleware for protected routes
const jwtMiddleware = jwt({
  secret: async (c) => c.env.JWT_SECRET,
})

// NPHIES Eligibility Check
app.post('/api/nphies/eligibility',
  jwtMiddleware,
  validator('json', (value, c) => {
    const result = EligibilityRequestSchema.safeParse(value)
    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.errors
      }, 400)
    }
    return result.data
  }),
  async (c) => {
    const request = c.req.valid('json')
    const nphiesClient = new NPHIESClient(c.env)
    
    try {
      const result = await nphiesClient.checkEligibility(request)
      return c.json(result)
    } catch (error) {
      return c.json({
        error: 'Eligibility check failed',
        message: (error as Error).message
      }, 500)
    }
  }
)

// NPHIES Claim Submission
app.post('/api/nphies/claims',
  jwtMiddleware,
  validator('json', (value, c) => {
    const result = ClaimRequestSchema.safeParse(value)
    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.errors
      }, 400)
    }
    return result.data
  }),
  async (c) => {
    const request = c.req.valid('json')
    const nphiesClient = new NPHIESClient(c.env)
    
    try {
      const result = await nphiesClient.submitClaim(request)
      return c.json(result)
    } catch (error) {
      return c.json({
        error: 'Claim submission failed',
        message: (error as Error).message
      }, 500)
    }
  }
)

// NPHIES Pre-Authorization Submission
app.post('/api/nphies/preauth',
  jwtMiddleware,
  validator('json', (value, c) => {
    const result = PreAuthRequestSchema.safeParse(value)
    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.errors
      }, 400)
    }
    return result.data
  }),
  async (c) => {
    const request = c.req.valid('json')
    const nphiesClient = new NPHIESClient(c.env)

    try {
      const result = await nphiesClient.submitPreAuth(request)
      return c.json(result)
    } catch (error) {
      return c.json({
        error: 'Pre-authorization submission failed',
        message: (error as Error).message
      }, 500)
    }
  }
)

// Claim status lookup
app.get('/api/nphies/claims/:claimId/status',
  jwtMiddleware,
  async (c) => {
    const { claimId } = c.req.param()
    const nphiesClient = new NPHIESClient(c.env)

    try {
      const result = await nphiesClient.getClaimStatus(claimId)
      return c.json(result)
    } catch (error) {
      return c.json({
        error: 'Claim status check failed',
        message: (error as Error).message
      }, 500)
    }
  }
)

// CopilotKit API endpoint
app.post('/api/copilotkit/*', async (c) => {
  // Proxy to OpenAI API for CopilotKit
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: c.req.raw.body,
  })

  return new Response(openaiResponse.body, {
    status: openaiResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
})

// Error handling
app.onError((err, c) => {
  console.error('Worker error:', err)
  return c.json({
    error: 'Internal server error',
    message: 'Something went wrong'
  }, 500)
})

export default app
