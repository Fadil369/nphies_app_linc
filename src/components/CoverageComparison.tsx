import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, XCircle, Shield, Heart, Eye, Tooth } from '@phosphor-icons/react'

interface HealthPlan {
  id: string
  name: string
  type: string
  monthlyPremium: number
  deductible: number
  outOfPocketMax: number
  coPayPCP: number
  coPaySpecialist: number
  coPayER: number
  prescriptionCoverage: 'Full' | 'Partial' | 'None'
  dentalIncluded: boolean
  visionIncluded: boolean
  networkSize: 'Large' | 'Medium' | 'Small'
  rating: number
  features: string[]
}

const SAMPLE_PLANS: HealthPlan[] = [
  {
    id: '1',
    name: 'HealthGuard Premium',
    type: 'PPO',
    monthlyPremium: 450,
    deductible: 1000,
    outOfPocketMax: 8000,
    coPayPCP: 25,
    coPaySpecialist: 50,
    coPayER: 200,
    prescriptionCoverage: 'Full',
    dentalIncluded: true,
    visionIncluded: true,
    networkSize: 'Large',
    rating: 4.8,
    features: ['Worldwide coverage', 'Telehealth included', 'Wellness programs', 'Mental health support']
  },
  {
    id: '2',
    name: 'EssentialCare Basic',
    type: 'HMO',
    monthlyPremium: 280,
    deductible: 2500,
    outOfPocketMax: 7000,
    coPayPCP: 15,
    coPaySpecialist: 35,
    coPayER: 150,
    prescriptionCoverage: 'Partial',
    dentalIncluded: false,
    visionIncluded: false,
    networkSize: 'Medium',
    rating: 4.2,
    features: ['Preventive care covered', 'Primary care focus', 'Local network']
  },
  {
    id: '3',
    name: 'FlexHealth Choice',
    type: 'EPO',
    monthlyPremium: 380,
    deductible: 1500,
    outOfPocketMax: 6500,
    coPayPCP: 20,
    coPaySpecialist: 40,
    coPayER: 175,
    prescriptionCoverage: 'Full',
    dentalIncluded: true,
    visionIncluded: false,
    networkSize: 'Large',
    rating: 4.5,
    features: ['No referrals needed', 'Specialist access', 'Urgent care coverage']
  }
]

export default function CoverageComparison() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['1', '2'])
  const [showRecommendation, setShowRecommendation] = useState(false)

  const handlePlanSelection = (planId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlans(prev => [...prev, planId])
    } else {
      setSelectedPlans(prev => prev.filter(id => id !== planId))
    }
  }

  const getRecommendation = () => {
    const selected = SAMPLE_PLANS.filter(plan => selectedPlans.includes(plan.id))
    if (selected.length === 0) return null
    
    // Simple recommendation logic based on overall value
    const bestPlan = selected.reduce((best, current) => {
      const currentValue = (current.rating * 100) - (current.monthlyPremium * 12 / 100) - (current.deductible / 100)
      const bestValue = (best.rating * 100) - (best.monthlyPremium * 12 / 100) - (best.deductible / 100)
      return currentValue > bestValue ? current : best
    })
    
    return bestPlan
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compare Health Plans</h2>
          <p className="text-muted-foreground">
            Select up to 3 plans to compare side by side
          </p>
        </div>
        <Button 
          onClick={() => setShowRecommendation(!showRecommendation)}
          variant="outline"
        >
          {showRecommendation ? 'Hide' : 'Show'} Recommendation
        </Button>
      </div>

      {showRecommendation && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-accent" size={20} />
              Recommended Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getRecommendation() ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{getRecommendation()?.name}</h3>
                  <p className="text-muted-foreground">
                    Best overall value based on your selected plans with {getRecommendation()?.rating}/5 rating
                  </p>
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  Best Value
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Select plans to see recommendation</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        {SAMPLE_PLANS.map((plan) => (
          <Card key={plan.id} className={`cursor-pointer transition-all ${selectedPlans.includes(plan.id) ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedPlans.includes(plan.id)}
                    onCheckedChange={(checked) => handlePlanSelection(plan.id, checked as boolean)}
                  />
                  <Badge variant="outline">{plan.type}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{plan.rating}</span>
                  <span className="text-xs text-muted-foreground">★</span>
                </div>
              </div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(plan.monthlyPremium)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deductible:</span>
                  <span>{formatCurrency(plan.deductible)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Out-of-pocket max:</span>
                  <span>{formatCurrency(plan.outOfPocketMax)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {plan.dentalIncluded && <Tooth size={16} className="text-accent" />}
                {plan.visionIncluded && <Eye size={16} className="text-accent" />}
                <Heart size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground ml-auto">
                  {plan.networkSize} Network
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      {selectedPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">Feature</th>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <th key={planId} className="text-left p-3 font-medium">
                          {plan?.name}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Monthly Premium</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          {formatCurrency(plan?.monthlyPremium || 0)}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Annual Deductible</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          {formatCurrency(plan?.deductible || 0)}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">PCP Co-pay</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          {formatCurrency(plan?.coPayPCP || 0)}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Specialist Co-pay</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          {formatCurrency(plan?.coPaySpecialist || 0)}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Prescription Coverage</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          <Badge variant={plan?.prescriptionCoverage === 'Full' ? 'default' : 'secondary'}>
                            {plan?.prescriptionCoverage}
                          </Badge>
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 font-medium">Dental Included</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          {plan?.dentalIncluded ? (
                            <CheckCircle className="text-green-500" size={20} />
                          ) : (
                            <XCircle className="text-muted-foreground" size={20} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Vision Included</td>
                    {selectedPlans.map(planId => {
                      const plan = SAMPLE_PLANS.find(p => p.id === planId)
                      return (
                        <td key={planId} className="p-3">
                          {plan?.visionIncluded ? (
                            <CheckCircle className="text-green-500" size={20} />
                          ) : (
                            <XCircle className="text-muted-foreground" size={20} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}