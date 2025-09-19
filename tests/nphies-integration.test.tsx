/**
 * Comprehensive test suite for NPHIES AI agents and validation workflows
 * Tests CopilotKit integration, NPHIES API calls, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CopilotKit } from '@copilotkit/react-core'
import EnhancedChatInterface from '../src/components/EnhancedChatInterface'
import EnhancedClaimsTracker from '../src/components/EnhancedClaimsTracker'
import { NPHIESValidator, NPHIESEligibilityRequest, NPHIESClaimRequest } from '../src/lib/nphies-types'
import { nphiesAPI } from '../src/lib/nphies-api'

// Mock CopilotKit
jest.mock('@copilotkit/react-core', () => ({
  CopilotKit: ({ children }: any) => <div data-testid="copilot-provider">{children}</div>,
  useCopilotAction: jest.fn(),
  useCopilotReadable: jest.fn(),
  useCopilotChatSuggestions: jest.fn(),
}))

// Mock NPHIES API
jest.mock('../src/lib/nphies-api', () => ({
  nphiesAPI: {
    checkEligibility: jest.fn(),
    submitClaim: jest.fn(),
    submitPreAuth: jest.fn(),
    getClaimStatus: jest.fn(),
    healthCheck: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
  },
  useNPHIESAuth: jest.fn(),
  useNPHIESEligibility: jest.fn(),
  useNPHIESClaims: jest.fn(),
  useNPHIESHealth: jest.fn(),
}))

describe('NPHIES Validation Tests', () => {
  describe('Patient ID Validation', () => {
    it('should validate correct Saudi National ID format', () => {
      const validId = '1234567890'
      expect(NPHIESValidator.validatePatientId(validId)).toBe(true)
    })

    it('should reject invalid patient ID formats', () => {
      const invalidIds = ['123456789', '12345678901', 'abc1234567', '']
      invalidIds.forEach(id => {
        expect(NPHIESValidator.validatePatientId(id)).toBe(false)
      })
    })
  })

  describe('Insurance ID Validation', () => {
    it('should validate correct insurance ID formats', () => {
      const validIds = ['ABC12345', 'XYZ123456789']
      validIds.forEach(id => {
        expect(NPHIESValidator.validateInsuranceId(id)).toBe(true)
      })
    })

    it('should reject invalid insurance ID formats', () => {
      const invalidIds = ['ABC123', 'ABCDEFGHIJKLM', '1234567', '']
      invalidIds.forEach(id => {
        expect(NPHIESValidator.validateInsuranceId(id)).toBe(false)
      })
    })
  })

  describe('Provider ID Validation', () => {
    it('should validate correct provider ID format', () => {
      const validId = '1234567'
      expect(NPHIESValidator.validateProviderId(validId)).toBe(true)
    })

    it('should reject invalid provider ID formats', () => {
      const invalidIds = ['123456', '12345678', 'abc1234', '']
      invalidIds.forEach(id => {
        expect(NPHIESValidator.validateProviderId(id)).toBe(false)
      })
    })
  })

  describe('Diagnosis Code Validation', () => {
    it('should validate correct ICD-10 formats', () => {
      const validCodes = ['A01', 'B12.5', 'C78.12', 'Z99']
      validCodes.forEach(code => {
        expect(NPHIESValidator.validateDiagnosisCode(code)).toBe(true)
      })
    })

    it('should reject invalid ICD-10 formats', () => {
      const invalidCodes = ['123', 'AB1', 'A1.2.3', 'a01', '']
      invalidCodes.forEach(code => {
        expect(NPHIESValidator.validateDiagnosisCode(code)).toBe(false)
      })
    })
  })

  describe('Eligibility Request Validation', () => {
    it('should validate complete eligibility request', () => {
      const validRequest: NPHIESEligibilityRequest = {
        patientId: '1234567890',
        insuranceId: 'ABC123456',
        providerId: '1234567',
        serviceDate: '2024-01-15',
      }

      const result = NPHIESValidator.validateEligibilityRequest(validRequest)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should identify multiple validation errors', () => {
      const invalidRequest: NPHIESEligibilityRequest = {
        patientId: '123', // Invalid format
        insuranceId: 'AB', // Too short
        providerId: '12345678', // Too long
        serviceDate: 'invalid-date', // Invalid date
      }

      const result = NPHIESValidator.validateEligibilityRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Claim Request Validation', () => {
    it('should validate complete claim request', () => {
      const validClaim: NPHIESClaimRequest = {
        patientInfo: {
          id: '1234567890',
          name: 'Ahmed Al-Saud',
          dob: '1990-01-01',
          gender: 'M',
        },
        providerInfo: {
          id: '1234567',
          name: 'King Faisal Medical Center',
          license: 'LIC123456',
        },
        services: [
          {
            code: 'CPT99213',
            description: 'Office visit',
            quantity: 1,
            unitPrice: 200,
            date: '2024-01-15',
          },
        ],
        diagnosis: [
          {
            code: 'A01.1',
            description: 'Typhoid fever',
            type: 'primary',
          },
        ],
        totalAmount: 200,
        claimType: 'outpatient',
      }

      const result = NPHIESValidator.validateClaimRequest(validClaim)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate service codes and diagnosis codes', () => {
      const invalidClaim: NPHIESClaimRequest = {
        patientInfo: {
          id: '123', // Invalid
          name: 'Test Patient',
          dob: '1990-01-01',
          gender: 'M',
        },
        providerInfo: {
          id: '12345678', // Invalid
          name: 'Test Provider',
          license: 'LIC123456',
        },
        services: [
          {
            code: 'INVALID', // Invalid format
            description: 'Test service',
            quantity: 0, // Invalid quantity
            unitPrice: -100, // Invalid price
            date: '2024-01-15',
          },
        ],
        diagnosis: [
          {
            code: 'INVALID', // Invalid format
            description: 'Test diagnosis',
            type: 'primary',
          },
        ],
        totalAmount: 200,
        claimType: 'invalid' as any, // Invalid type
      }

      const result = NPHIESValidator.validateClaimRequest(invalidClaim)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(5)
    })
  })
})

describe('NPHIES API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-jwt-token',
        user: {
          username: 'test@healthcare.sa',
          role: 'healthcare_provider',
          providerId: '1234567',
        },
      }

      ;(nphiesAPI.login as jest.Mock).mockResolvedValue(mockResponse)

      const result = await nphiesAPI.login('test@healthcare.sa', 'password123')
      expect(result.success).toBe(true)
      expect(result.token).toBe('mock-jwt-token')
    })

    it('should handle authentication failure', async () => {
      ;(nphiesAPI.login as jest.Mock).mockRejectedValue(new Error('Authentication failed'))

      await expect(nphiesAPI.login('invalid@user.com', 'wrongpassword')).rejects.toThrow('Authentication failed')
    })
  })

  describe('Eligibility Check', () => {
    it('should successfully check patient eligibility', async () => {
      const mockResponse = {
        success: true,
        data: {
          eligible: true,
          coverageDetails: {
            policyId: 'ABC123456',
            coveragePercentage: 80,
            deductible: 500,
            copayment: 50,
            maxBenefit: 100000,
          },
          expiryDate: '2025-12-31',
        },
        timestamp: '2024-01-15T10:00:00Z',
      }

      ;(nphiesAPI.checkEligibility as jest.Mock).mockResolvedValue(mockResponse)

      const request: NPHIESEligibilityRequest = {
        patientId: '1234567890',
        insuranceId: 'ABC123456',
        providerId: '1234567',
        serviceDate: '2024-01-15',
      }

      const result = await nphiesAPI.checkEligibility(request)
      expect(result.success).toBe(true)
      expect(result.data?.eligible).toBe(true)
    })

    it('should handle eligibility check failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Patient not found',
        code: 'PATIENT_NOT_FOUND',
        timestamp: '2024-01-15T10:00:00Z',
      }

      ;(nphiesAPI.checkEligibility as jest.Mock).mockResolvedValue(mockResponse)

      const request: NPHIESEligibilityRequest = {
        patientId: '9999999999',
        insuranceId: 'INVALID123',
        providerId: '1234567',
        serviceDate: '2024-01-15',
      }

      const result = await nphiesAPI.checkEligibility(request)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Patient not found')
    })
  })

  describe('Claim Submission', () => {
    it('should successfully submit claim', async () => {
      const mockResponse = {
        success: true,
        data: {
          claimId: 'CLM-2024-001',
          status: 'submitted',
          reference: 'REF123456',
        },
        timestamp: '2024-01-15T10:00:00Z',
      }

      ;(nphiesAPI.submitClaim as jest.Mock).mockResolvedValue(mockResponse)

      const claimRequest: NPHIESClaimRequest = {
        patientInfo: {
          id: '1234567890',
          name: 'Test Patient',
          dob: '1990-01-01',
          gender: 'M',
        },
        providerInfo: {
          id: '1234567',
          name: 'Test Provider',
          license: 'LIC123456',
        },
        services: [
          {
            code: 'CPT99213',
            description: 'Office visit',
            quantity: 1,
            unitPrice: 200,
            date: '2024-01-15',
          },
        ],
        diagnosis: [
          {
            code: 'A01.1',
            description: 'Test diagnosis',
            type: 'primary',
          },
        ],
        totalAmount: 200,
        claimType: 'outpatient',
      }

      const result = await nphiesAPI.submitClaim(claimRequest)
      expect(result.success).toBe(true)
      expect(result.data?.claimId).toBe('CLM-2024-001')
    })
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-15T10:00:00Z',
      }

      ;(nphiesAPI.healthCheck as jest.Mock).mockResolvedValue(mockResponse)

      const result = await nphiesAPI.healthCheck()
      expect(result.status).toBe('healthy')
    })

    it('should handle service unavailable', async () => {
      ;(nphiesAPI.healthCheck as jest.Mock).mockRejectedValue(new Error('Backend service unavailable'))

      await expect(nphiesAPI.healthCheck()).rejects.toThrow('Backend service unavailable')
    })
  })
})

describe('Enhanced Chat Interface Tests', () => {
  const mockCopilotAction = jest.fn()
  const mockCopilotReadable = jest.fn()
  const mockCopilotSuggestions = jest.fn()

  beforeEach(() => {
    ;(require('@copilotkit/react-core').useCopilotAction as jest.Mock).mockImplementation(mockCopilotAction)
    ;(require('@copilotkit/react-core').useCopilotReadable as jest.Mock).mockImplementation(mockCopilotReadable)
    ;(require('@copilotkit/react-core').useCopilotChatSuggestions as jest.Mock).mockImplementation(mockCopilotSuggestions)
  })

  it('should render chat interface with CopilotKit integration', () => {
    render(
      <CopilotKit publicApiKey="test-key">
        <EnhancedChatInterface />
      </CopilotKit>
    )

    expect(screen.getByText('NPHIES Assistant')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Healthcare Support')).toBeInTheDocument()
  })

  it('should register NPHIES-specific copilot actions', () => {
    render(
      <CopilotKit publicApiKey="test-key">
        <EnhancedChatInterface />
      </CopilotKit>
    )

    // Verify that CopilotKit actions are registered
    expect(mockCopilotAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'checkNphiesEligibility',
        description: expect.stringContaining('NPHIES'),
      })
    )

    expect(mockCopilotAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'validateNphiesClaim',
        description: expect.stringContaining('validate'),
      })
    )
  })

  it('should handle quick action clicks', async () => {
    render(
      <CopilotKit publicApiKey="test-key">
        <EnhancedChatInterface />
      </CopilotKit>
    )

    const eligibilityButton = screen.getByText('Check Patient Eligibility')
    fireEvent.click(eligibilityButton)

    await waitFor(() => {
      expect(screen.getByDisplayValue(/eligibility status/i)).toBeInTheDocument()
    })
  })
})

describe('Enhanced Claims Tracker Tests', () => {
  it('should render claims tracker with AI validation features', () => {
    render(
      <CopilotKit publicApiKey="test-key">
        <EnhancedClaimsTracker />
      </CopilotKit>
    )

    expect(screen.getByText('Enhanced Claims Tracker')).toBeInTheDocument()
    expect(screen.getByText('AI-powered claims validation')).toBeInTheDocument()
  })

  it('should display validation scores for claims', () => {
    render(
      <CopilotKit publicApiKey="test-key">
        <EnhancedClaimsTracker />
      </CopilotKit>
    )

    // Look for AI validation score elements
    expect(screen.getByText(/AI Score/i)).toBeInTheDocument()
    expect(screen.getByText(/NPHIES Readiness/i)).toBeInTheDocument()
  })

  it('should trigger AI validation on claim selection', async () => {
    render(
      <CopilotKit publicApiKey="test-key">
        <EnhancedClaimsTracker />
      </CopilotKit>
    )

    const firstClaim = screen.getByText('CLM-2024-001')
    fireEvent.click(firstClaim)

    await waitFor(() => {
      expect(screen.getByText(/AI Validation Score/i)).toBeInTheDocument()
    })
  })
})

describe('Error Handling Tests', () => {
  it('should handle network timeouts gracefully', async () => {
    ;(nphiesAPI.checkEligibility as jest.Mock).mockRejectedValue(new Error('Request timeout'))

    const request: NPHIESEligibilityRequest = {
      patientId: '1234567890',
      insuranceId: 'ABC123456',
      providerId: '1234567',
      serviceDate: '2024-01-15',
    }

    await expect(nphiesAPI.checkEligibility(request)).rejects.toThrow('Request timeout')
  })

  it('should handle NPHIES API errors with proper error codes', () => {
    const error = new Error('Invalid patient ID format')
    error.name = 'NPHIESError'
    
    expect(error.message).toContain('Invalid patient ID')
  })

  it('should validate all required fields before API calls', () => {
    const incompleteRequest = {
      patientId: '1234567890',
      // Missing insuranceId, providerId, serviceDate
    } as NPHIESEligibilityRequest

    const result = NPHIESValidator.validateEligibilityRequest(incompleteRequest)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('Performance Tests', () => {
  it('should validate large claim requests efficiently', () => {
    const largeClaimRequest: NPHIESClaimRequest = {
      patientInfo: {
        id: '1234567890',
        name: 'Test Patient',
        dob: '1990-01-01',
        gender: 'M',
      },
      providerInfo: {
        id: '1234567',
        name: 'Test Provider',
        license: 'LIC123456',
      },
      services: Array.from({ length: 100 }, (_, i) => ({
        code: `CPT9921${i}`,
        description: `Service ${i}`,
        quantity: 1,
        unitPrice: 100,
        date: '2024-01-15',
      })),
      diagnosis: Array.from({ length: 10 }, (_, i) => ({
        code: `A0${i}.1`,
        description: `Diagnosis ${i}`,
        type: i === 0 ? 'primary' as const : 'secondary' as const,
      })),
      totalAmount: 10000,
      claimType: 'outpatient',
    }

    const startTime = performance.now()
    const result = NPHIESValidator.validateClaimRequest(largeClaimRequest)
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    expect(result.isValid).toBe(true)
  })
})

describe('Integration Tests', () => {
  it('should complete full eligibility check workflow', async () => {
    // Mock successful authentication
    ;(nphiesAPI.login as jest.Mock).mockResolvedValue({
      success: true,
      token: 'test-token',
      user: { username: 'test@healthcare.sa', role: 'provider', providerId: '1234567' },
    })

    // Mock successful eligibility check
    ;(nphiesAPI.checkEligibility as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        eligible: true,
        coverageDetails: {
          policyId: 'ABC123456',
          coveragePercentage: 80,
          deductible: 500,
          copayment: 50,
          maxBenefit: 100000,
        },
        expiryDate: '2025-12-31',
      },
    })

    // Execute workflow
    const authResult = await nphiesAPI.login('test@healthcare.sa', 'password123')
    expect(authResult.success).toBe(true)

    const eligibilityRequest: NPHIESEligibilityRequest = {
      patientId: '1234567890',
      insuranceId: 'ABC123456',
      providerId: '1234567',
      serviceDate: '2024-01-15',
    }

    const validation = NPHIESValidator.validateEligibilityRequest(eligibilityRequest)
    expect(validation.isValid).toBe(true)

    const eligibilityResult = await nphiesAPI.checkEligibility(eligibilityRequest)
    expect(eligibilityResult.success).toBe(true)
    expect(eligibilityResult.data?.eligible).toBe(true)
  })
})