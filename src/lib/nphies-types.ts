/**
 * NPHIES Service Types and Validation Utilities
 * Supporting Saudi Arabian healthcare data exchange standards
 */

// NPHIES service request types
export interface NPHIESEligibilityRequest {
  patientId: string
  insuranceId: string
  providerId: string
  serviceDate: string
  serviceType?: string
}

export interface NPHIESClaimRequest {
  patientInfo: {
    id: string
    name: string
    dob: string
    gender: 'M' | 'F'
  }
  providerInfo: {
    id: string
    name: string
    license: string
  }
  services: Array<{
    code: string
    description: string
    quantity: number
    unitPrice: number
    date: string
  }>
  diagnosis: Array<{
    code: string
    description: string
    type: 'primary' | 'secondary'
  }>
  totalAmount: number
  claimType: 'inpatient' | 'outpatient' | 'pharmacy' | 'dental'
}

export interface NPHIESPreAuthRequest {
  patientId: string
  providerId: string
  serviceRequested: string
  medicalJustification: string
  estimatedCost: number
  urgency: 'routine' | 'urgent' | 'emergency'
  supportingDocuments?: string[]
}

// NPHIES response types
export interface NPHIESEligibilityResponse {
  eligible: boolean
  coverageDetails: {
    policyId: string
    coveragePercentage: number
    deductible: number
    copayment: number
    maxBenefit: number
  }
  limitations?: string[]
  expiryDate: string
}

export interface NPHIESClaimResponse {
  claimId: string
  status: 'accepted' | 'rejected' | 'pending' | 'under_review'
  adjudicatedAmount?: number
  rejectionReasons?: string[]
  paymentDate?: string
  reference: string
}

// Validation utilities
export class NPHIESValidator {
  static validatePatientId(id: string): boolean {
    // Saudi National ID validation (10 digits)
    return /^[0-9]{10}$/.test(id)
  }
  
  static validateInsuranceId(id: string): boolean {
  // Insurance policy ID validation
  return /^[A-Z0-9]{8,12}$/.test(id)
  }
  
  static validateProviderId(id: string): boolean {
    // Healthcare provider ID validation (7 digits)
    return /^[0-9]{7}$/.test(id)
  }
  
  static validateServiceCode(code: string): boolean {
    // CPT/HCPCS code validation: allow alphanumeric codes between 3 and 10 chars
    return /^[A-Z0-9]{3,10}$/.test(code)
  }
  
  static validateDiagnosisCode(code: string): boolean {
    // ICD-10 code validation
    return /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/.test(code)
  }
  
  static validateEligibilityRequest(request: NPHIESEligibilityRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (!this.validatePatientId(request.patientId)) {
      errors.push('Invalid patient ID format. Must be 10-digit Saudi National ID.')
    }
    
    if (!this.validateInsuranceId(request.insuranceId)) {
      errors.push('Invalid insurance ID format.')
    }
    
    if (!this.validateProviderId(request.providerId)) {
      errors.push('Invalid provider ID format. Must be 7-digit provider code.')
    }
    
    if (!request.serviceDate || isNaN(Date.parse(request.serviceDate))) {
      errors.push('Invalid or missing service date.')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  static validateClaimRequest(request: NPHIESClaimRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    // Validate patient info
    if (!this.validatePatientId(request.patientInfo.id)) {
      errors.push('Invalid patient ID in patient info.')
    }
    
    // Validate provider info
    if (!this.validateProviderId(request.providerInfo.id)) {
      errors.push('Invalid provider ID in provider info.')
    }
    
    // Validate services
    request.services.forEach((service, index) => {
      if (!this.validateServiceCode(service.code)) {
        errors.push(`Invalid service code at index ${index}: ${service.code}`)
      }
      if (service.quantity <= 0) {
        errors.push(`Invalid quantity at service index ${index}`)
      }
      if (service.unitPrice <= 0) {
        errors.push(`Invalid unit price at service index ${index}`)
      }
    })
    
    // Validate diagnosis codes
    request.diagnosis.forEach((diag, index) => {
      if (!this.validateDiagnosisCode(diag.code)) {
        errors.push(`Invalid diagnosis code at index ${index}: ${diag.code}`)
      }
    })
    
    // Validate claim type
    const validClaimTypes = ['inpatient', 'outpatient', 'pharmacy', 'dental']
    if (!validClaimTypes.includes(request.claimType)) {
      errors.push('Invalid claim type. Must be one of: inpatient, outpatient, pharmacy, dental')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// NPHIES error handling
export class NPHIESError extends Error {
  constructor(
    public code: string,
    public message: string,
    public suggestion?: string
  ) {
    super(message)
    this.name = 'NPHIESError'
  }
}

// Common NPHIES error codes and solutions
export const NPHIES_ERROR_CODES = {
  INVALID_PATIENT_ID: {
    code: 'E001',
    message: 'Invalid patient ID format',
    suggestion: 'Ensure patient ID is a 10-digit Saudi National ID'
  },
  POLICY_NOT_ACTIVE: {
    code: 'E002', 
    message: 'Insurance policy is not active',
    suggestion: 'Verify policy status and coverage dates'
  },
  PROVIDER_NOT_REGISTERED: {
    code: 'E003',
    message: 'Provider is not registered with insurance network',
    suggestion: 'Contact insurance company to verify network participation'
  },
  PREAUTH_REQUIRED: {
    code: 'E004',
    message: 'Service requires pre-authorization',
    suggestion: 'Submit pre-authorization request before proceeding'
  },
  DUPLICATE_CLAIM: {
    code: 'E005',
    message: 'Duplicate claim submission detected',
    suggestion: 'Check existing claims with same reference number'
  },
  INVALID_DIAGNOSIS: {
    code: 'E006',
    message: 'Invalid or outdated diagnosis code',
    suggestion: 'Use current ICD-10 diagnosis codes'
  },
  SERVICE_DATE_INVALID: {
    code: 'E007',
    message: 'Service date is outside coverage period',
    suggestion: 'Verify service date falls within policy coverage period'
  },
  MISSING_DOCUMENTATION: {
    code: 'E008',
    message: 'Required documentation is missing',
    suggestion: 'Attach all required supporting documents for this service type'
  }
} as const