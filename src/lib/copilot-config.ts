/**
 * CopilotKit Configuration for NPHIES Healthcare Assistant
 * Provides AI agents for Saudi Arabian healthcare compliance and error reduction
 */

export const COPILOT_CONFIG = {
  // NPHIES API endpoints (would be configured based on environment)
  nphiesApiUrl: process.env.VITE_NPHIES_API_URL || 'https://api.nphies.sa',
  
  // Agent configurations
  agents: {
    eligibility: {
      name: 'NPHIES Eligibility Agent',
      description: 'Validates patient eligibility and insurance coverage according to NPHIES standards',
      instructions: `You are an expert NPHIES eligibility validation agent. You help healthcare providers:
        - Check patient eligibility status
        - Validate insurance coverage details
        - Ensure compliance with CCHI regulations
        - Prevent eligibility-related errors before claims submission
        - Guide users through pre-authorization requirements`
    },
    
    claimsValidation: {
      name: 'Claims Validation Agent',
      description: 'AI-powered validation of healthcare claims before NPHIES submission',
      instructions: `You are a specialized claims validation agent for NPHIES compliance. You:
        - Validate claim data format and completeness
        - Check diagnosis codes (ICD-10) and procedure codes (CPT/HCPCS)
        - Ensure compliance with CCHI claim submission requirements
        - Identify potential rejection reasons before submission
        - Suggest corrections for common claim errors`
    },
    
    preAuthorization: {
      name: 'Pre-Authorization Agent',
      description: 'Intelligent assistant for NPHIES pre-authorization workflows',
      instructions: `You are a pre-authorization specialist agent. You assist with:
        - Determining when pre-authorization is required
        - Preparing pre-authorization requests with complete documentation
        - Tracking pre-authorization status and expiration dates
        - Handling advanced pre-authorization scenarios
        - Managing nullification and cancellation processes`
    },
    
    errorPrevention: {
      name: 'Error Prevention Agent',
      description: 'Proactive error detection and prevention for NPHIES communications',
      instructions: `You are an error prevention specialist for NPHIES systems. You:
        - Analyze data patterns to identify potential errors
        - Provide real-time validation feedback
        - Suggest best practices for NPHIES compliance
        - Alert users to common submission pitfalls
        - Monitor system status and connectivity issues`
    }
  },
  
  // Common NPHIES validation schemas
  validationSchemas: {
    eligibilityRequest: {
      required: ['patientId', 'insuranceId', 'providerId', 'serviceDate'],
      formats: {
        patientId: /^[0-9]{10}$/, // Saudi National ID format
        insuranceId: /^[A-Z0-9]{8,12}$/, // Insurance policy format
        providerId: /^[0-9]{7}$/ // Healthcare provider ID format
      }
    },
    
    claimRequest: {
      required: ['patientInfo', 'providerInfo', 'services', 'diagnosis'],
      serviceCodeFormat: /^[A-Z0-9]{3,8}$/, // CPT/HCPCS codes
      diagnosisCodeFormat: /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/ // ICD-10 format
    }
  }
}

// NPHIES service types for intelligent routing
export const NPHIES_SERVICES = {
  ELIGIBILITY: 'eligibility',
  PRE_AUTHORIZATION: 'preauth',
  CLAIMS: 'claims',
  PAYMENT: 'payment',
  REPORTS: 'reports'
} as const

// Common NPHIES error codes and their solutions
export const NPHIES_ERROR_SOLUTIONS = {
  'E001': 'Invalid patient ID format. Ensure 10-digit Saudi National ID.',
  'E002': 'Insurance policy not active. Verify policy status and dates.',
  'E003': 'Provider not registered with insurance network.',
  'E004': 'Service requires pre-authorization. Submit pre-auth request first.',
  'E005': 'Duplicate claim submission. Check claim reference number.',
  'E006': 'Invalid diagnosis code. Use current ICD-10 codes.',
  'E007': 'Service date outside coverage period.',
  'E008': 'Missing required documentation for this service type.'
}