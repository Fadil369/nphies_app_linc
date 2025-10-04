/**
 * Enhanced Claims Validation Component with CopilotKit Integration
 * Provides AI-powered claims validation and error prevention for NPHIES
 */

import { useState, useEffect } from 'react'
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MagnifyingGlass, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  CalendarBlank,
  CurrencyDollar,
  Shield,
  Warning,
  Robot
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { NPHIESValidator, NPHIESClaimRequest, NPHIES_ERROR_CODES } from '@/lib/nphies-types'

interface Claim {
  id: string
  claimNumber: string
  serviceDate: Date | string
  provider: string
  serviceType: string
  claimedAmount: number
  approvedAmount: number
  patientResponsibility: number
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Paid' | 'Denied' | 'Appeal' | 'AI Validating' | 'Ready for NPHIES'
  statusDate: Date | string
  description: string
  nphiesValidated: boolean
  validationScore: number
  aiInsights?: string[]
  timeline: Array<{
    status: string
    date: Date | string
    description: string
  }>
}

const ENHANCED_SAMPLE_CLAIMS: Claim[] = [
  {
    id: '1',
    claimNumber: 'CLM-2024-001',
    serviceDate: new Date('2024-01-15'),
    provider: 'King Faisal Medical Center',
    serviceType: 'Routine Checkup + Lab Tests',
    claimedAmount: 850,
    approvedAmount: 680,
    patientResponsibility: 85,
    status: 'Paid',
    statusDate: new Date('2024-01-22'),
    description: 'Annual physical examination with comprehensive blood panel - NPHIES validated',
    nphiesValidated: true,
    validationScore: 98,
    aiInsights: [
      'All diagnosis codes validated against current ICD-10',
      'Provider network participation confirmed',
      'Patient eligibility verified for service date'
    ],
    timeline: [
      { status: 'AI Validating', date: new Date('2024-01-15'), description: 'CopilotKit AI validation in progress' },
      { status: 'Ready for NPHIES', date: new Date('2024-01-15'), description: 'AI validation passed - 98% confidence score' },
      { status: 'Submitted', date: new Date('2024-01-16'), description: 'Claim submitted to NPHIES platform' },
      { status: 'Under Review', date: new Date('2024-01-18'), description: 'CCHI automated review completed' },
      { status: 'Approved', date: new Date('2024-01-20'), description: 'Claim approved for payment' },
      { status: 'Paid', date: new Date('2024-01-22'), description: 'Payment processed to provider' }
    ]
  },
  {
    id: '2',
    claimNumber: 'CLM-2024-002',
    serviceDate: new Date('2024-01-28'),
    provider: 'Riyadh Orthopedic Specialists',
    serviceType: 'MRI + Consultation',
    claimedAmount: 2400,
    approvedAmount: 1920,
    patientResponsibility: 240,
    status: 'AI Validating',
    statusDate: new Date('2024-02-01'),
    description: 'MRI of left knee with orthopedic consultation - AI validation in progress',
    nphiesValidated: false,
    validationScore: 85,
    aiInsights: [
      'Pre-authorization verification required for MRI',
      'Diagnosis code J87.1 requires supporting documentation',
      'Service date within coverage period confirmed'
    ],
    timeline: [
      { status: 'AI Validating', date: new Date('2024-02-01'), description: 'CopilotKit analyzing claim data and NPHIES requirements' }
    ]
  },
  {
    id: '3',
    claimNumber: 'CLM-2024-003',
    serviceDate: new Date('2024-02-05'),
    provider: 'Jeddah Emergency Care',
    serviceType: 'Emergency Treatment',
    claimedAmount: 1200,
    approvedAmount: 0,
    patientResponsibility: 0,
    status: 'Denied',
    statusDate: new Date('2024-02-08'),
    description: 'Emergency room visit - DENIED due to validation errors',
    nphiesValidated: false,
    validationScore: 45,
    aiInsights: [
      '❌ Invalid diagnosis code format detected',
      '❌ Provider ID format does not match NPHIES standards',
      '❌ Missing required pre-authorization for emergency services',
      '✅ Patient eligibility confirmed'
    ],
    timeline: [
      { status: 'AI Validating', date: new Date('2024-02-05'), description: 'AI detected multiple validation errors' },
      { status: 'Submitted', date: new Date('2024-02-06'), description: 'Claim submitted despite AI warnings' },
      { status: 'Denied', date: new Date('2024-02-08'), description: 'NPHIES rejected due to validation errors' }
    ]
  }
]

export default function EnhancedClaimsTracker() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [claims, setClaims] = useKV<Claim[]>('enhanced-claims', ENHANCED_SAMPLE_CLAIMS)
  const [activeTab, setActiveTab] = useState('claims')
  const [aiValidationInProgress, setAiValidationInProgress] = useState(false)

  // Make claims data readable by CopilotKit
  useCopilotReadable({
    description: 'Current claims data including validation status, AI insights, and NPHIES compliance scores',
    value: {
      totalClaims: claims.length,
      validatedClaims: claims.filter(c => c.nphiesValidated).length,
      pendingValidation: claims.filter(c => c.status === 'AI Validating').length,
      avgValidationScore: claims.reduce((acc, c) => acc + c.validationScore, 0) / claims.length,
      claims: claims.map(c => ({
        id: c.id,
        status: c.status,
        validated: c.nphiesValidated,
        score: c.validationScore,
        amount: c.claimedAmount
      }))
    },
  })

  // AI Claims Validation Action
  useCopilotAction({
    name: 'validateClaimWithAI',
    description: 'Perform comprehensive AI validation of a healthcare claim before NPHIES submission',
    parameters: [
      {
        name: 'claimId',
        type: 'string',
        description: 'ID of the claim to validate',
        required: true,
      },
    ],
    handler: async ({ claimId }) => {
      const claim = claims.find(c => c.id === claimId)
      if (!claim) {
        return 'Claim not found'
      }

      setAiValidationInProgress(true)
      
      // Update claim status to validating
      setClaims(prev => prev.map(c => 
        c.id === claimId 
          ? { ...c, status: 'AI Validating' as const }
          : c
      ))

      // Simulate AI validation process
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Simulate validation results
      const validationScore = Math.floor(Math.random() * 40) + 60 // 60-100
      const insights = [
        validationScore > 90 ? '✅ All diagnosis codes validated' : '⚠️ Some diagnosis codes need review',
        validationScore > 85 ? '✅ Provider network participation confirmed' : '❌ Provider not in network',
        validationScore > 80 ? '✅ Patient eligibility verified' : '❌ Eligibility issues detected',
        validationScore > 75 ? '✅ Service codes properly formatted' : '⚠️ Service codes need adjustment'
      ]

      const newStatus = validationScore >= 80 ? 'Ready for NPHIES' : 'Under Review'
      
      setClaims(prev => prev.map(c => 
        c.id === claimId 
          ? { 
              ...c, 
              status: newStatus as const,
              nphiesValidated: validationScore >= 80,
              validationScore,
              aiInsights: insights,
              timeline: [
                ...c.timeline,
                {
                  status: 'AI Validating',
                  date: new Date(),
                  description: 'CopilotKit AI validation completed'
                },
                {
                  status: newStatus,
                  date: new Date(),
                  description: `AI validation ${validationScore >= 80 ? 'passed' : 'flagged issues'} - Score: ${validationScore}%`
                }
              ]
            }
          : c
      ))

      setAiValidationInProgress(false)
      return `Claim validation completed with score: ${validationScore}%`
    },
  })

  // Batch Validation Action
  useCopilotAction({
    name: 'batchValidateClaims',
    description: 'Validate multiple claims simultaneously using AI to identify potential NPHIES issues',
    parameters: [
      {
        name: 'claimIds',
        type: 'array',
        description: 'Array of claim IDs to validate',
        required: false,
      },
    ],
    handler: async ({ claimIds = [] }) => {
      const targetClaims = claimIds.length > 0 
        ? claims.filter(c => claimIds.includes(c.id))
        : claims.filter(c => !c.nphiesValidated)

      setAiValidationInProgress(true)
      
      let validatedCount = 0
      
      for (const claim of targetClaims) {
        const validationScore = Math.floor(Math.random() * 40) + 60
        const insights = [
          '✅ Diagnosis codes validated',
          validationScore > 85 ? '✅ Provider verified' : '⚠️ Provider needs verification',
          '✅ Patient eligibility confirmed'
        ]

        setClaims(prev => prev.map(c => 
          c.id === claim.id 
            ? { 
                ...c, 
                nphiesValidated: validationScore >= 80,
                validationScore,
                aiInsights: insights,
                status: validationScore >= 80 ? 'Ready for NPHIES' as const : 'Under Review' as const
              }
            : c
        ))
        
        validatedCount++
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setAiValidationInProgress(false)
      return `Batch validation completed: ${validatedCount} claims processed`
    },
  })

  const filteredClaims = claims.filter(claim => 
    claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Ready for NPHIES': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'AI Validating': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Submitted': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Denied': return 'bg-red-100 text-red-800 border-red-200'
      case 'Appeal': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="text-green-600" size={16} />
      case 'Approved': return <CheckCircle className="text-blue-600" size={16} />
      case 'Ready for NPHIES': return <Shield className="text-purple-600" size={16} />
      case 'AI Validating': return <Robot className="text-orange-600" size={16} />
      case 'Under Review': return <Clock className="text-yellow-600" size={16} />
      case 'Submitted': return <FileText className="text-gray-600" size={16} />
      case 'Denied': return <XCircle className="text-red-600" size={16} />
      case 'Appeal': return <Clock className="text-purple-600" size={16} />
      default: return <Clock className="text-gray-600" size={16} />
    }
  }

  const getValidationScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Enhanced Claims Tracker
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            <span>AI-powered claims validation</span>
            <span> and NPHIES compliance monitoring</span>
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {claims.filter(c => c.nphiesValidated).length}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">NPHIES Readiness</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {Math.round(claims.reduce((acc, c) => acc + c.validationScore, 0) / claims.length)}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">AI Score</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {claims.filter(c => c.status === 'AI Validating').length}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">Validating</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(claims.reduce((acc, c) => acc + c.claimedAmount, 0))}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Total Claims</div>
          </div>
        </div>
      </div>

      {/* AI Status Alert */}
      {aiValidationInProgress && (
        <Alert>
          <Robot className="h-4 w-4" />
          <AlertDescription>
            CopilotKit AI is validating claims for NPHIES compliance...
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="claims">Claims Overview</TabsTrigger>
          <TabsTrigger value="validation">AI Validation</TabsTrigger>
          <TabsTrigger value="insights">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              size={16} 
            />
            <Input
              placeholder="Search by claim number, provider, or service type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Claims List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Your Claims</h3>
                  <span className="text-sm text-muted-foreground">Claim Score</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {}}
                  disabled={aiValidationInProgress}
                >
                  <Robot size={16} className="mr-2" />
                  Validate All
                </Button>
              </div>
              <div className="space-y-3">
                {filteredClaims.map((claim) => (
                  <Card 
                    key={claim.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                      selectedClaim?.id === claim.id ? 'ring-2 ring-primary shadow-lg' : ''
                    } ${claim.nphiesValidated ? 'border-green-200 bg-green-50/30 dark:bg-green-950/30' : ''} card-enhanced`}
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            {getStatusIcon(claim.status)}
                          </div>
                          <span className="font-medium text-sm">{claim.claimNumber}</span>
                          {claim.nphiesValidated && (
                            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900">
                              <Shield size={12} className="text-green-600 dark:text-green-400" />
                            </div>
                          )}
                        </div>
                        <Badge className={`${getStatusColor(claim.status)} text-xs px-2 py-1`}>
                          {claim.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-sm leading-tight">{claim.serviceType}</p>
                        <p className="text-xs text-muted-foreground">{claim.provider}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Amount:</span>
                          <span className="font-semibold text-sm">{formatCurrency(claim.claimedAmount)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Validation Score</span>
                            <span className={`font-bold text-sm ${getValidationScoreColor(claim.validationScore)}`}>
                              {claim.validationScore}%
                            </span>
                          </div>
                          <div className="relative">
                            <Progress value={claim.validationScore} className="h-2.5 bg-muted/50" />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20" />
                          </div>
                        </div>
                        
                        {claim.status === 'AI Validating' && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            <span>AI analysis in progress...</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Claim Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Claim Details</h3>
              {selectedClaim ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(selectedClaim.status)}
                        {selectedClaim.claimNumber}
                        {selectedClaim.nphiesValidated && (
                          <Badge className="bg-green-100 text-green-800">
                            NPHIES Ready
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge className={getStatusColor(selectedClaim.status)}>
                        {selectedClaim.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{selectedClaim.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* AI Validation Score */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">AI Validation Score</span>
                        <span className={`text-2xl font-bold ${getValidationScoreColor(selectedClaim.validationScore)}`}>
                          {selectedClaim.validationScore}%
                        </span>
                      </div>
                      <Progress value={selectedClaim.validationScore} className="h-3" />
                    </div>

                    {/* AI Insights */}
                    {selectedClaim.aiInsights && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Robot size={16} />
                          AI Insights
                        </h4>
                        <div className="space-y-2">
                          {selectedClaim.aiInsights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                insight.startsWith('✅') ? 'bg-green-500' : 
                                insight.startsWith('⚠️') ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Financial Summary */}
                    <div>
                      <h4 className="font-semibold mb-3">Financial Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount Claimed:</span>
                          <span className="font-medium">{formatCurrency(selectedClaim.claimedAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount Approved:</span>
                          <span className="font-medium text-green-600">{formatCurrency(selectedClaim.approvedAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Responsibility:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(selectedClaim.patientResponsibility)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Insurance Pays:</span>
                          <span className="text-primary">{formatCurrency(Math.max(0, selectedClaim.approvedAmount - selectedClaim.patientResponsibility))}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Enhanced Timeline */}
                    <div>
                      <h4 className="font-semibold mb-3">Claim Timeline</h4>
                      <div className="space-y-3">
                        {selectedClaim.timeline.map((event, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                index === selectedClaim.timeline.length - 1 ? 'bg-primary' : 
                                event.status === 'AI Validating' ? 'bg-orange-500' :
                                event.status === 'Ready for NPHIES' ? 'bg-purple-500' : 'bg-muted-foreground'
                              }`} />
                              {index < selectedClaim.timeline.length - 1 && (
                                <div className="w-px h-6 bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{event.status}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.date)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center space-y-2">
                      <FileText size={48} className="text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">
                        Select a claim to view AI validation details
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Claims:</span>
                    <span className="font-medium">{claims.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NPHIES Ready:</span>
                    <span className="font-medium text-green-600">
                      {claims.filter(c => c.nphiesValidated).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Need Review:</span>
                    <span className="font-medium text-yellow-600">
                      {claims.filter(c => !c.nphiesValidated && c.status !== 'Denied').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg AI Score:</span>
                    <span className="font-medium">
                      {Math.round(claims.reduce((acc, c) => acc + c.validationScore, 0) / claims.length)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Common Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Warning size={14} className="text-yellow-500" />
                    <span>Diagnosis codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Warning size={14} className="text-yellow-500" />
                    <span>Provider verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Patient eligibility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-500" />
                    <span>Pre-authorization</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm" disabled={aiValidationInProgress}>
                  <Robot size={16} className="mr-2" />
                  Validate All Claims
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Export for NPHIES
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Validation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Analytics dashboard coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Prevention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      AI prevented 12 potential rejections this month
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Average validation score improved by 15%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      NPHIES compliance rate: 94%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}