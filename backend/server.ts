/**
 * NPHIES API Backend Service
 * Handles secure communication with Saudi Arabia's National Platform for Health Information Exchange Services
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { CopilotRuntime, OpenAIAdapter } from '@copilotkit/runtime'

// Environment configuration
const config = {
  port: process.env.PORT || 3001,
  nphiesApiUrl: process.env.NPHIES_API_URL || 'https://api.nphies.sa',
  nphiesClientId: process.env.NPHIES_CLIENT_ID,
  nphiesClientSecret: process.env.NPHIES_CLIENT_SECRET,
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  openaiApiKey: process.env.OPENAI_API_KEY,
  azureStorageConnection: process.env.AZURE_STORAGE_CONNECTION,
  environment: process.env.NODE_ENV || 'development'
}

// Validation schemas for NPHIES requests
const EligibilityRequestSchema = z.object({
  patientId: z.string().length(10, 'Patient ID must be 10 digits'),
  insuranceId: z.string().min(8).max(12),
  providerId: z.string().length(7, 'Provider ID must be 7 digits'),
  serviceDate: z.string().datetime(),
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

// Initialize Express app
const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// NPHIES API client
class NPHIESClient {
  private baseURL: string
  private clientId: string
  private clientSecret: string
  private accessToken?: string
  private tokenExpiryTime?: number

  constructor() {
    this.baseURL = config.nphiesApiUrl
    this.clientId = config.nphiesClientId!
    this.clientSecret = config.nphiesClientSecret!
  }

  async authenticate(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'eligibility claims preauth'
      })

      this.accessToken = response.data.access_token
      this.tokenExpiryTime = Date.now() + (response.data.expires_in * 1000)
    } catch (error) {
      console.error('NPHIES authentication failed:', error)
      throw new Error('Failed to authenticate with NPHIES')
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiryTime || Date.now() >= this.tokenExpiryTime) {
      await this.authenticate()
    }
  }

  async checkEligibility(request: z.infer<typeof EligibilityRequestSchema>) {
    await this.ensureAuthenticated()
    
    try {
      const response = await axios.post(`${this.baseURL}/eligibility/check`, request, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Provider-ID': request.providerId
        }
      })

      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Eligibility check failed:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || 'Eligibility check failed',
        code: error.response?.data?.code || 'ELIGIBILITY_ERROR',
        timestamp: new Date().toISOString()
      }
    }
  }

  async submitClaim(request: z.infer<typeof ClaimRequestSchema>) {
    await this.ensureAuthenticated()
    
    try {
      const response = await axios.post(`${this.baseURL}/claims/submit`, request, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Provider-ID': request.providerInfo.id
        }
      })

      return {
        success: true,
        data: response.data,
        claimId: response.data.claimId,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Claim submission failed:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || 'Claim submission failed',
        code: error.response?.data?.code || 'CLAIM_SUBMISSION_ERROR',
        timestamp: new Date().toISOString()
      }
    }
  }

  async submitPreAuth(request: z.infer<typeof PreAuthRequestSchema>) {
    await this.ensureAuthenticated()
    
    try {
      const response = await axios.post(`${this.baseURL}/preauth/submit`, request, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Provider-ID': request.providerId
        }
      })

      return {
        success: true,
        data: response.data,
        preAuthId: response.data.preAuthId,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Pre-auth submission failed:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || 'Pre-authorization submission failed',
        code: error.response?.data?.code || 'PREAUTH_SUBMISSION_ERROR',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getClaimStatus(claimId: string) {
    await this.ensureAuthenticated()
    
    try {
      const response = await axios.get(`${this.baseURL}/claims/${claimId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Claim status check failed:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || 'Claim status check failed',
        code: error.response?.data?.code || 'CLAIM_STATUS_ERROR',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Initialize NPHIES client
const nphiesClient = new NPHIESClient()

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.environment
  })
})

// Authentication endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    // In production, validate against your user database
    // For demo purposes, using simple validation
    if (username === 'demo@healthcare.sa' && password === 'demo123') {
      const token = jwt.sign(
        { 
          username, 
          role: 'healthcare_provider',
          providerId: '1234567'
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      )
      
      res.json({
        success: true,
        token,
        user: {
          username,
          role: 'healthcare_provider',
          providerId: '1234567'
        }
      })
    } else {
      res.status(401).json({ error: 'Invalid credentials' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
})

// NPHIES Eligibility Check
app.post('/api/nphies/eligibility', authenticateToken, async (req, res) => {
  try {
    const validatedRequest = EligibilityRequestSchema.parse(req.body)
    const result = await nphiesClient.checkEligibility(validatedRequest)
    
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    } else {
      res.status(500).json({
        error: 'Eligibility check failed',
        message: (error as Error).message
      })
    }
  }
})

// NPHIES Claim Submission
app.post('/api/nphies/claims', authenticateToken, async (req, res) => {
  try {
    const validatedRequest = ClaimRequestSchema.parse(req.body)
    const result = await nphiesClient.submitClaim(validatedRequest)
    
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    } else {
      res.status(500).json({
        error: 'Claim submission failed',
        message: (error as Error).message
      })
    }
  }
})

// NPHIES Pre-Authorization
app.post('/api/nphies/preauth', authenticateToken, async (req, res) => {
  try {
    const validatedRequest = PreAuthRequestSchema.parse(req.body)
    const result = await nphiesClient.submitPreAuth(validatedRequest)
    
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    } else {
      res.status(500).json({
        error: 'Pre-authorization submission failed',
        message: (error as Error).message
      })
    }
  }
})

// Claim Status Check
app.get('/api/nphies/claims/:claimId/status', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params
    const result = await nphiesClient.getClaimStatus(claimId)
    
    res.json(result)
  } catch (error) {
    res.status(500).json({
      error: 'Claim status check failed',
      message: (error as Error).message
    })
  }
})

// CopilotKit API endpoint
app.use('/api/copilotkit', (req, res) => {
  const runtime = new CopilotRuntime()
  
  const serviceAdapter = new OpenAIAdapter({
    apiKey: config.openaiApiKey!,
    model: 'gpt-4'
  })

  return runtime.streamHttpServerResponse(req, res, serviceAdapter, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
})

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: config.environment === 'development' ? error.message : 'Something went wrong'
  })
})

// Start server
app.listen(config.port, () => {
  console.log(`🚀 NPHIES API Backend running on port ${config.port}`)
  console.log(`🏥 Environment: ${config.environment}`)
  console.log(`🔒 Security: Enabled with Helmet & Rate Limiting`)
  console.log(`📡 NPHIES API: ${config.nphiesApiUrl}`)
  
  if (config.environment === 'development') {
    console.log(`🧪 Health Check: http://localhost:${config.port}/health`)
    console.log(`🤖 CopilotKit: http://localhost:${config.port}/api/copilotkit`)
  }
})

export default app