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
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Compare Health Plans
          </h2>
          <p className="text-muted-foreground mt-2">
            Select up to 3 plans to compare side by side
          </p>
        </div>
        <Button 
          onClick={() => setShowRecommendation(!showRecommendation)}
          variant="outline"
          className="hover:scale-105 transition-transform"
        >
          {showRecommendation ? 'Hide' : 'Show'} AI Recommendation
        </Button>
      </div>

      {showRecommendation && (
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 card-enhanced animate-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
                <Shield className="text-accent" size={24} />
              </div>
              <div>
                <span className="text-lg font-semibold">AI Recommendation</span>
                <p className="text-sm text-muted-foreground font-normal">Based on value analysis</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getRecommendation() ? (
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-xl text-accent">{getRecommendation()?.name}</h3>
                  <p className="text-muted-foreground mt-1">
                    Best overall value with {getRecommendation()?.rating}/5 rating and comprehensive coverage
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Monthly: </span>
                      <span className="font-semibold">{formatCurrency(getRecommendation()?.monthlyPremium || 0)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Deductible: </span>
                      <span className="font-semibold">{formatCurrency(getRecommendation()?.deductible || 0)}</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-accent to-primary text-white border-0 px-4 py-2">
                  ⭐ Best Value
                </Badge>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield size={48} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Select plans to see AI recommendation</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        {SAMPLE_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 card-enhanced ${
              selectedPlans.includes(plan.id) ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''
            }`}
            onClick={() => handlePlanSelection(plan.id, !selectedPlans.includes(plan.id))}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedPlans.includes(plan.id)}
                    onCheckedChange={(checked) => handlePlanSelection(plan.id, checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Badge variant="outline" className="bg-muted/50">{plan.type}</Badge>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950 px-2 py-1 rounded-lg">
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{plan.rating}</span>
                  <span className="text-yellow-500">★</span>
                </div>
              </div>
              <CardTitle className="text-lg mb-2">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {formatCurrency(plan.monthlyPremium)}
                </p>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Deductible</span>
                  <div className="font-semibold">{formatCurrency(plan.deductible)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Max Out-of-Pocket</span>
                  <div className="font-semibold">{formatCurrency(plan.outOfPocketMax)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {plan.dentalIncluded && (
                    <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
                      <Tooth size={14} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  {plan.visionIncluded && (
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Eye size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900">
                    <Heart size={14} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {plan.networkSize} Network
                </Badge>
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
