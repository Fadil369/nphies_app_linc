import { useState, useRef, useEffect } from 'react'
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  PaperPlaneRight, 
  User, 
  Robot, 
  Shield, 
  CheckCircle, 
  Warning,
  FileText,
  ClockCounterClockwise
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { 
  NPHIESValidator, 
  NPHIESEligibilityRequest, 
  NPHIESClaimRequest,
  NPHIESPreAuthRequest,
  NPHIES_ERROR_CODES
} from '@/lib/nphies-types'

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date | string
  type?: 'text' | 'quick-action' | 'nphies-result'
  actions?: Array<{ label: string; action: string }>
  nphiesData?: any
}

interface NPHIESState {
  lastEligibilityCheck?: NPHIESEligibilityRequest & { result?: any }
  pendingClaims: NPHIESClaimRequest[]
  preAuthRequests: NPHIESPreAuthRequest[]
  validationErrors: string[]
}

const NPHIES_QUICK_ACTIONS = [
  { label: 'Check Patient Eligibility', action: 'eligibility-check' },
  { label: 'Validate Claim Data', action: 'validate-claim' },
  { label: 'Submit Pre-Authorization', action: 'pre-auth' },
  { label: 'Check NPHIES Status', action: 'system-status' },
  { label: 'Validate Diagnosis Codes', action: 'validate-diagnosis' },
]

export default function EnhancedChatInterface() {
  const [messages, setMessages] = useKV<ChatMessage[]>('enhanced-chat-messages', [])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [nphiesState, setNphiesState] = useKV<NPHIESState>('nphies-state', {
    pendingClaims: [],
    preAuthRequests: [],
    validationErrors: []
  })
  const [activeTab, setActiveTab] = useState('chat')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})

  // Make NPHIES state readable by CopilotKit
  useCopilotReadable({
    description: 'Current NPHIES system state including pending claims, pre-auth requests, and validation errors',
    value: nphiesState,
  })

  // NPHIES Eligibility Check Action
  useCopilotAction({
    name: 'checkNphiesEligibility',
    description: 'Check patient eligibility through NPHIES system with real-time validation',
    parameters: [
      {
        name: 'patientId',
        type: 'string',
        description: 'Saudi National ID (10 digits)',
        required: true,
      },
      {
        name: 'insuranceId',
        type: 'string', 
        description: 'Insurance policy ID',
        required: true,
      },
      {
        name: 'providerId',
        type: 'string',
        description: 'Healthcare provider ID (7 digits)',
        required: true,
      },
      {
        name: 'serviceDate',
        type: 'string',
        description: 'Service date in YYYY-MM-DD format',
        required: true,
      },
    ],
    handler: async ({ patientId, insuranceId, providerId, serviceDate }) => {
      const request: NPHIESEligibilityRequest = {
        patientId,
        insuranceId,
        providerId,
        serviceDate,
      }
      
      const validation = NPHIESValidator.validateEligibilityRequest(request)
      
      if (!validation.isValid) {
        setNphiesState(prev => ({
          ...prev,
          validationErrors: validation.errors
        }))
        
        addMessage(`❌ Eligibility check failed due to validation errors:\\n\\n${validation.errors.join('\\n')}`, 'assistant', 'nphies-result')
        return `Validation failed: ${validation.errors.join(', ')}`
      }
      
      // Simulate NPHIES API call (in real app, this would call actual NPHIES API)
      const mockResult = {
        eligible: Math.random() > 0.3,
        coverageDetails: {
          policyId: insuranceId,
          coveragePercentage: 80,
          deductible: 500,
          copayment: 50,
          maxBenefit: 100000
        },
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      setNphiesState(prev => ({
        ...prev,
        lastEligibilityCheck: { ...request, result: mockResult },
        validationErrors: []
      }))
      
      const resultMessage = mockResult.eligible 
        ? `✅ **Patient Eligible**\\n\\n**Coverage Details:**\\n- Policy ID: ${mockResult.coverageDetails.policyId}\\n- Coverage: ${mockResult.coverageDetails.coveragePercentage}%\\n- Deductible: ${mockResult.coverageDetails.deductible} SAR\\n- Copayment: ${mockResult.coverageDetails.copayment} SAR\\n- Max Benefit: ${mockResult.coverageDetails.maxBenefit} SAR\\n- Valid Until: ${new Date(mockResult.expiryDate).toLocaleDateString()}`
        : `❌ **Patient Not Eligible**\\n\\nPlease verify:\\n- Insurance policy status\\n- Policy coverage dates\\n- Network participation`
      
      addMessage(resultMessage, 'assistant', 'nphies-result', { nphiesData: mockResult })
      
      return mockResult.eligible ? 'Patient is eligible for services' : 'Patient eligibility verification failed'
    },
  })

  // Claims Validation Action
  useCopilotAction({
    name: 'validateNphiesClaim',
    description: 'validate healthcare claim data before NPHIES submission to prevent errors',
    parameters: [
      {
        name: 'claimData',
        type: 'object',
        description: 'Complete claim data including patient, provider, services, and diagnosis information',
        required: true,
      },
    ],
    handler: async ({ claimData }) => {
      try {
        const validation = NPHIESValidator.validateClaimRequest(claimData as NPHIESClaimRequest)
        
        if (!validation.isValid) {
          setNphiesState(prev => ({
            ...prev,
            validationErrors: validation.errors
          }))
          
          addMessage(`❌ **Claim Validation Failed**\\n\\n**Errors Found:**\\n${validation.errors.map(err => `• ${err}`).join('\\n')}\\n\\n**Please correct these issues before submission.**`, 'assistant', 'nphies-result')
          return `Claim validation failed: ${validation.errors.length} errors found`
        }
        
        // Add to pending claims if valid
        setNphiesState(prev => ({
          ...prev,
          pendingClaims: [...prev.pendingClaims, claimData as NPHIESClaimRequest],
          validationErrors: []
        }))
        
        addMessage(`✅ **Claim Validated Successfully**\\n\\n**Summary:**\\n- Patient: ${claimData.patientInfo?.name || 'N/A'}\\n- Services: ${claimData.services?.length || 0} items\\n- Total Amount: ${claimData.totalAmount || 0} SAR\\n- Claim Type: ${claimData.claimType || 'N/A'}\\n\\n**Ready for NPHIES submission.**`, 'assistant', 'nphies-result')
        
        return 'Claim validation successful - ready for submission'
      } catch (error) {
        addMessage(`❌ **Validation Error**\\n\\nUnable to validate claim data. Please check the format and try again.`, 'assistant', 'nphies-result')
        return 'Claim validation error occurred'
      }
    },
  })

  // Error Prevention Action
  useCopilotAction({
    name: 'analyzeNphiesErrors',
    description: 'Analyze common NPHIES submission errors and provide prevention strategies',
    parameters: [
      {
        name: 'errorType',
        type: 'string',
        description: 'Type of error to analyze (eligibility, claim, preauth, or general)',
        required: false,
      },
    ],
    handler: async ({ errorType = 'general' }) => {
      const errorAnalysis = {
        eligibility: {
          common: ['Invalid patient ID format', 'Inactive insurance policy', 'Provider not in network'],
          prevention: ['Validate 10-digit Saudi National ID', 'Check policy expiration dates', 'Verify network participation']
        },
        claim: {
          common: ['Missing diagnosis codes', 'Invalid service codes', 'Duplicate submissions'],
          prevention: ['Use current ICD-10 codes', 'Validate CPT/HCPCS codes', 'Check claim reference numbers']
        },
        preauth: {
          common: ['Insufficient medical justification', 'Missing documentation', 'Invalid urgency level'],
          prevention: ['Provide detailed medical necessity', 'Attach required documents', 'Use correct urgency classification']
        },
        general: {
          common: ['Network connectivity issues', 'Authentication failures', 'Data format errors'],
          prevention: ['Monitor system status', 'Verify credentials', 'Follow NPHIES data standards']
        }
      }
      
      const analysis = errorAnalysis[errorType as keyof typeof errorAnalysis] || errorAnalysis.general
      
      const message = `🔍 **NPHIES Error Analysis - ${errorType.toUpperCase()}**\\n\\n**Common Issues:**\\n${analysis.common.map(issue => `• ${issue}`).join('\\n')}\\n\\n**Prevention Strategies:**\\n${analysis.prevention.map(strategy => `✓ ${strategy}`).join('\\n')}`
      
      addMessage(message, 'assistant', 'nphies-result')
      return `Analysis complete for ${errorType} errors`
    },
  })

  // Note: useCopilotChatSuggestions removed because it's not exported by the installed CopilotKit package.

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        content: `Hello! I'm your enhanced NPHIES Healthcare Assistant. I can help with eligibility checks, claims validation, pre-authorization assistance, and NPHIES compliance guidance. How can I assist you today?`,
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
        actions: NPHIES_QUICK_ACTIONS
      }
      setMessages([welcomeMessage])
    }
  }, [messages, setMessages])

  const addMessage = (content: string, sender: 'user' | 'assistant', type: string = 'text', additionalData?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      type: type as any,
      ...additionalData
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleQuickAction = async (action: string) => {
    const actionMap: Record<string, string> = {
      'eligibility-check': "I need to check a patient's eligibility status through NPHIES",
      'validate-claim': 'Please help me validate claim data before NPHIES submission',
      'pre-auth': 'I need assistance with a pre-authorization request',
      'system-status': 'What is the current NPHIES system status?',
      'validate-diagnosis': 'Help me validate diagnosis and procedure codes'
    }

    const message = actionMap[action] || action
    // also pre-fill the input so users can edit before sending
    setInputValue(message)
    addMessage(message, 'user')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    addMessage(inputValue, 'user')
    setInputValue('')
  }

  return (
    <div className="min-h-[600px] md:h-[700px] flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
          <TabsTrigger value="chat" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="copilot" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            CopilotKit
          </TabsTrigger>
          <TabsTrigger value="nphies" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            NPHIES Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <Card className="flex-1 flex flex-col card-enhanced">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Robot size={24} className="text-primary" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">NPHIES Assistant</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    {isTyping ? (
                      <>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        Analyzing your request...
                      </>
                    ) : (
                      'AI-Powered Healthcare Support'
                    )}
                  </p>
                </div>
                {nphiesState.validationErrors.length > 0 && (
                  <Badge variant="destructive" className="ml-auto animate-bounce">
                    {nphiesState.validationErrors.length} Errors
                  </Badge>
                )}
              </div>
            </CardHeader>

            <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-6">
              <div className="space-y-6 pb-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`flex gap-3 max-w-[90%] md:max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                          : 'bg-gradient-to-br from-accent/20 to-primary/20'
                      }`}>
                        {message.sender === 'user' ? (
                          <User size={18} />
                        ) : (
                          <Robot size={18} className="text-primary" />
                        )}
                      </div>
                      <div className="space-y-3 flex-1">
                        <div
                          className={`p-4 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto'
                              : message.type === 'nphies-result'
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800'
                              : 'bg-card/80 backdrop-blur-sm border border-border/50'
                          }`}
                        >
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                            {message.type === 'nphies-result' && (
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-200/50 text-xs text-blue-600 dark:text-blue-400">
                                <Shield size={14} />
                                <span className="font-medium">NPHIES Verified</span>
                                <div className="ml-auto flex items-center gap-2">
                                  <button
                                    type="button"
                                    data-testid={`copy-nphies-${message.id}`}
                                    onClick={async () => {
                                      try {
                                        if (navigator?.clipboard?.writeText) {
                                          await navigator.clipboard.writeText(message.content)
                                        } else {
                                          // fallback
                                          const ta = document.createElement('textarea')
                                          ta.value = message.content
                                          document.body.appendChild(ta)
                                          ta.select()
                                          document.execCommand('copy')
                                          document.body.removeChild(ta)
                                        }
                                        setCopiedMap(prev => ({ ...prev, [message.id]: true }))
                                        setTimeout(() => setCopiedMap(prev => ({ ...prev, [message.id]: false })), 2000)
                                      } catch (e) {
                                        // ignore clipboard failures in tests/environments
                                      }
                                    }}
                                    className="text-xs underline"
                                  >
                                    {copiedMap[message.id] ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                        {message.actions && (
                          <div className="flex flex-wrap gap-2">
                            {message.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAction(action.action)}
                                className="text-xs hover:scale-105 transition-transform"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1 h-1 bg-muted-foreground/50 rounded-full inline-block" />
                          {(() => {
                            const dateObj = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp
                            return isNaN(dateObj.getTime()) ? 'Invalid time' : dateObj.toLocaleTimeString()
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 md:p-6 border-t border-border/50 bg-muted/20">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about NPHIES eligibility, claims validation, or compliance..."
                    className="pr-12 h-12 rounded-xl border-border/50 focus-enhanced bg-background/80 backdrop-blur-sm"
                    disabled={isTyping}
                  />
                  {isTyping && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || isTyping}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all hover:scale-105 disabled:hover:scale-100"
                >
                  <PaperPlaneRight size={18} />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="copilot" className="flex-1 mt-0">
          <CopilotChat
            instructions="You are an expert NPHIES healthcare assistant. Help users with Saudi Arabian healthcare insurance processes, eligibility checks, claims validation, and error prevention. Always prioritize accuracy and compliance with CCHI regulations."
            labels={{
              title: "NPHIES Healthcare Assistant",
              initial: "How can I help you with NPHIES today?",
            }}
          />
        </TabsContent>

        <TabsContent value="nphies" className="flex-1 mt-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>NPHIES API</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Eligibility Service</span>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Claims Service</span>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Pre-Auth Service</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockCounterClockwise className="text-blue-500" size={20} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Pending Claims</span>
                    <span className="font-medium">{nphiesState.pendingClaims.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pre-Auth Requests</span>
                    <span className="font-medium">{nphiesState.preAuthRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Errors</span>
                    <span className={`font-medium ${nphiesState.validationErrors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {nphiesState.validationErrors.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {nphiesState.validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Warning size={20} />
                  Validation Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {nphiesState.validationErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {nphiesState.lastEligibilityCheck && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-blue-500" size={20} />
                  Last Eligibility Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Patient ID</span>
                    <span className="font-mono">{nphiesState.lastEligibilityCheck.patientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance ID</span>
                    <span className="font-mono">{nphiesState.lastEligibilityCheck.insuranceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Result</span>
                    <Badge className={nphiesState.lastEligibilityCheck.result?.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {nphiesState.lastEligibilityCheck.result?.eligible ? 'Eligible' : 'Not Eligible'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
