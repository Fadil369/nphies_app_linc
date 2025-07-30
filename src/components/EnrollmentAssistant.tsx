import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  User, 
  Shield, 
  CreditCard,
  FileText,
  Upload,
  AlertCircle
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface EnrollmentData {
  step: number
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    ssn: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  eligibility: {
    employmentStatus: string
    hasCurrentInsurance: boolean
    qualifyingEvent: string
    householdSize: number
    estimatedIncome: number
  }
  planSelection: {
    selectedPlan: string
    addOns: string[]
  }
  dependents: Array<{
    firstName: string
    lastName: string
    dateOfBirth: string
    relationship: string
    ssn: string
  }>
  paymentInfo: {
    paymentMethod: string
    accountNumber: string
    routingNumber: string
  }
}

const ENROLLMENT_STEPS = [
  { id: 1, title: 'Personal Information', icon: User },
  { id: 2, title: 'Eligibility Check', icon: CheckCircle },
  { id: 3, title: 'Plan Selection', icon: Shield },
  { id: 4, title: 'Payment Setup', icon: CreditCard },
  { id: 5, title: 'Review & Submit', icon: FileText }
]

const AVAILABLE_PLANS = [
  {
    id: 'basic',
    name: 'EssentialCare Basic',
    type: 'HMO',
    premium: 280,
    deductible: 2500,
    features: ['Basic coverage', 'Primary care focus', 'Local network']
  },
  {
    id: 'standard',
    name: 'FlexHealth Choice',
    type: 'EPO',
    premium: 380,
    deductible: 1500,
    features: ['No referrals needed', 'Specialist access', 'Urgent care']
  },
  {
    id: 'premium',
    name: 'HealthGuard Premium',
    type: 'PPO',
    premium: 450,
    deductible: 1000,
    features: ['Worldwide coverage', 'Telehealth', 'Wellness programs']
  }
]

const ADD_ONS = [
  { id: 'dental', name: 'Dental Coverage', price: 35 },
  { id: 'vision', name: 'Vision Coverage', price: 15 },
  { id: 'life', name: 'Life Insurance', price: 25 }
]

export default function EnrollmentAssistant() {
  const [enrollmentData, setEnrollmentData] = useKV<EnrollmentData>('enrollment-data', {
    step: 1,
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ssn: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    eligibility: {
      employmentStatus: '',
      hasCurrentInsurance: false,
      qualifyingEvent: '',
      householdSize: 1,
      estimatedIncome: 0
    },
    planSelection: {
      selectedPlan: '',
      addOns: []
    },
    dependents: [],
    paymentInfo: {
      paymentMethod: '',
      accountNumber: '',
      routingNumber: ''
    }
  })

  const updateData = (field: string, value: any) => {
    setEnrollmentData(prev => ({
      ...prev,
      [field]: typeof prev[field as keyof EnrollmentData] === 'object' && prev[field as keyof EnrollmentData] !== null
        ? { ...prev[field as keyof EnrollmentData] as object, ...value }
        : value
    }))
  }

  const nextStep = () => {
    if (enrollmentData.step < 5) {
      updateData('step', enrollmentData.step + 1)
    }
  }

  const prevStep = () => {
    if (enrollmentData.step > 1) {
      updateData('step', enrollmentData.step - 1)
    }
  }

  const calculateProgress = () => {
    return (enrollmentData.step / 5) * 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const renderStepContent = () => {
    switch (enrollmentData.step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="text-muted-foreground">
                Please provide your basic information to get started with your enrollment.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={enrollmentData.personalInfo.firstName}
                  onChange={(e) => updateData('personalInfo', { firstName: e.target.value })}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={enrollmentData.personalInfo.lastName}
                  onChange={(e) => updateData('personalInfo', { lastName: e.target.value })}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={enrollmentData.personalInfo.dateOfBirth}
                  onChange={(e) => updateData('personalInfo', { dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ssn">Social Security Number</Label>
                <Input
                  id="ssn"
                  value={enrollmentData.personalInfo.ssn}
                  onChange={(e) => updateData('personalInfo', { ssn: e.target.value })}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={enrollmentData.personalInfo.email}
                  onChange={(e) => updateData('personalInfo', { email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={enrollmentData.personalInfo.phone}
                  onChange={(e) => updateData('personalInfo', { phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={enrollmentData.personalInfo.address}
                onChange={(e) => updateData('personalInfo', { address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={enrollmentData.personalInfo.city}
                  onChange={(e) => updateData('personalInfo', { city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select onValueChange={(value) => updateData('personalInfo', { state: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="fl">Florida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={enrollmentData.personalInfo.zipCode}
                  onChange={(e) => updateData('personalInfo', { zipCode: e.target.value })}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Eligibility Check</h3>
              <p className="text-muted-foreground">
                Help us determine your eligibility for health insurance coverage.
              </p>
            </div>

            <div>
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Select onValueChange={(value) => updateData('eligibility', { employmentStatus: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self-employed">Self-Employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasInsurance"
                checked={enrollmentData.eligibility.hasCurrentInsurance}
                onCheckedChange={(checked) => updateData('eligibility', { hasCurrentInsurance: checked })}
              />
              <Label htmlFor="hasInsurance">I currently have health insurance</Label>
            </div>

            <div>
              <Label htmlFor="qualifyingEvent">Qualifying Life Event (if applicable)</Label>
              <Select onValueChange={(value) => updateData('eligibility', { qualifyingEvent: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select qualifying event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No qualifying event</SelectItem>
                  <SelectItem value="marriage">Recent marriage</SelectItem>
                  <SelectItem value="birth">Birth or adoption of child</SelectItem>
                  <SelectItem value="job-loss">Loss of job-based coverage</SelectItem>
                  <SelectItem value="divorce">Divorce or separation</SelectItem>
                  <SelectItem value="move">Permanent move</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="householdSize">Household Size</Label>
                <Input
                  id="householdSize"
                  type="number"
                  min="1"
                  value={enrollmentData.eligibility.householdSize}
                  onChange={(e) => updateData('eligibility', { householdSize: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="estimatedIncome">Estimated Annual Income</Label>
                <Input
                  id="estimatedIncome"
                  type="number"
                  value={enrollmentData.eligibility.estimatedIncome}
                  onChange={(e) => updateData('eligibility', { estimatedIncome: parseInt(e.target.value) })}
                  placeholder="50000"
                />
              </div>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Eligibility Confirmed</p>
                    <p className="text-sm text-green-700">
                      You're eligible for health insurance coverage. You may qualify for premium tax credits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Plan Selection</h3>
              <p className="text-muted-foreground">
                Choose the health insurance plan that best fits your needs and budget.
              </p>
            </div>

            <div className="space-y-4">
              {AVAILABLE_PLANS.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all ${
                    enrollmentData.planSelection.selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => updateData('planSelection', { selectedPlan: plan.id })}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{plan.name}</h4>
                        <Badge variant="outline">{plan.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(plan.premium)}
                        </p>
                        <p className="text-sm text-muted-foreground">/month</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Deductible:</span> {formatCurrency(plan.deductible)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Optional Add-ons</h4>
              <div className="space-y-3">
                {ADD_ONS.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={enrollmentData.planSelection.addOns.includes(addon.id)}
                        onCheckedChange={(checked) => {
                          const currentAddOns = enrollmentData.planSelection.addOns
                          const newAddOns = checked 
                            ? [...currentAddOns, addon.id]
                            : currentAddOns.filter(id => id !== addon.id)
                          updateData('planSelection', { addOns: newAddOns })
                        }}
                      />
                      <span className="font-medium">{addon.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(addon.price)}/month</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Payment Setup</h3>
              <p className="text-muted-foreground">
                Set up your payment method for monthly premium payments.
              </p>
            </div>

            <div>
              <Label>Payment Method</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="bank-account"
                    name="paymentMethod"
                    value="bank"
                    checked={enrollmentData.paymentInfo.paymentMethod === 'bank'}
                    onChange={(e) => updateData('paymentInfo', { paymentMethod: e.target.value })}
                  />
                  <Label htmlFor="bank-account">Bank Account (ACH)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="credit-card"
                    name="paymentMethod"
                    value="credit"
                    checked={enrollmentData.paymentInfo.paymentMethod === 'credit'}
                    onChange={(e) => updateData('paymentInfo', { paymentMethod: e.target.value })}
                  />
                  <Label htmlFor="credit-card">Credit/Debit Card</Label>
                </div>
              </div>
            </div>

            {enrollmentData.paymentInfo.paymentMethod === 'bank' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={enrollmentData.paymentInfo.routingNumber}
                    onChange={(e) => updateData('paymentInfo', { routingNumber: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={enrollmentData.paymentInfo.accountNumber}
                    onChange={(e) => updateData('paymentInfo', { accountNumber: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
              </div>
            )}

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Secure Payment Processing</p>
                    <p className="text-sm text-blue-700">
                      Your payment information is encrypted and secure. Payments will be automatically processed monthly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 5:
        const selectedPlan = AVAILABLE_PLANS.find(p => p.id === enrollmentData.planSelection.selectedPlan)
        const selectedAddOns = ADD_ONS.filter(addon => enrollmentData.planSelection.addOns.includes(addon.id))
        const totalMonthly = (selectedPlan?.premium || 0) + selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Review & Submit</h3>
              <p className="text-muted-foreground">
                Please review your information before submitting your enrollment application.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Enrollment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <p className="text-sm">
                    {enrollmentData.personalInfo.firstName} {enrollmentData.personalInfo.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {enrollmentData.personalInfo.email} • {enrollmentData.personalInfo.phone}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Selected Plan</h4>
                  {selectedPlan && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{selectedPlan.name}</p>
                        <Badge variant="outline" className="mt-1">{selectedPlan.type}</Badge>
                      </div>
                      <p className="font-semibold text-primary">
                        {formatCurrency(selectedPlan.premium)}/month
                      </p>
                    </div>
                  )}
                </div>

                {selectedAddOns.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Add-ons</h4>
                      {selectedAddOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between items-center">
                          <span className="text-sm">{addon.name}</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(addon.price)}/month
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total Monthly Premium</span>
                  <span className="text-primary">{formatCurrency(totalMonthly)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Ready to Submit</p>
                    <p className="text-sm text-green-700">
                      Your application is complete and ready for submission.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enrollment Assistant</h2>
        <p className="text-muted-foreground">
          Let us guide you through the enrollment process step by step
        </p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{enrollmentData.step} of 5 steps</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            
            <div className="flex justify-between">
              {ENROLLMENT_STEPS.map((step) => {
                const Icon = step.icon
                const isCompleted = enrollmentData.step > step.id
                const isCurrent = enrollmentData.step === step.id
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100 text-green-600' :
                      isCurrent ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                    </div>
                    <span className={`text-xs text-center max-w-20 ${
                      isCurrent ? 'font-medium' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={enrollmentData.step === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Previous
        </Button>

        {enrollmentData.step < 5 ? (
          <Button onClick={nextStep} className="flex items-center gap-2">
            Next
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Upload size={16} />
            Submit Application
          </Button>
        )}
      </div>
    </div>
  )
}