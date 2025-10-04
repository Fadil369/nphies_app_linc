import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  CalendarBlank, 
  CurrencyDollar, 
  Users, 
  Heart,
  Eye,
  Tooth,
  Phone,
  MapPin,
  Download,
  PencilSimple,
  WarningCircle
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface Policy {
  id: string
  planName: string
  policyNumber: string
  type: string
  status: 'Active' | 'Pending' | 'Expired' | 'Cancelled'
  effectiveDate: Date | string
  renewalDate: Date | string
  monthlyPremium: number
  deductible: number
  deductibleUsed: number
  outOfPocketMax: number
  outOfPocketUsed: number
  coverage: {
    medical: boolean
    dental: boolean
    vision: boolean
    prescription: boolean
  }
  dependents: Array<{
    name: string
    relationship: string
    dateOfBirth: Date | string
  }>
  primaryCareProvider?: {
    name: string
    phone: string
    address: string
  }
}

const SAMPLE_POLICIES: Policy[] = [
  {
    id: '1',
    planName: 'HealthGuard Premium PPO',
    policyNumber: 'HG-2024-001234',
    type: 'PPO',
    status: 'Active',
    effectiveDate: new Date('2024-01-01'),
    renewalDate: new Date('2024-12-31'),
    monthlyPremium: 450,
    deductible: 1000,
    deductibleUsed: 350,
    outOfPocketMax: 8000,
    outOfPocketUsed: 1200,
    coverage: {
      medical: true,
      dental: true,
      vision: true,
      prescription: true
    },
    dependents: [
      {
        name: 'Sarah Johnson',
        relationship: 'Spouse',
        dateOfBirth: new Date('1985-06-15')
      },
      {
        name: 'Mike Johnson',
        relationship: 'Child',
        dateOfBirth: new Date('2010-03-22')
      }
    ],
    primaryCareProvider: {
      name: 'Dr. Emily Chen',
      phone: '(555) 123-4567',
      address: '123 Medical Center Dr, City, ST 12345'
    }
  }
]

export default function PolicyManagement() {
  const [policies, setPolicies] = useKV<Policy[]>('user-policies', SAMPLE_POLICIES)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy>(policies[0])
  const [editingProvider, setEditingProvider] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200'
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateDeductibleProgress = (used: number, total: number) => {
    return Math.min((used / total) * 100, 100)
  }

  const getDaysUntilRenewal = (renewalDate: Date | string) => {
    const dateObj = typeof renewalDate === 'string' ? new Date(renewalDate) : renewalDate
    if (isNaN(dateObj.getTime())) {
      return 0
    }
    const today = new Date()
    const diffTime = dateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Policy Management
          </h2>
          <p className="text-muted-foreground mt-2">
            View and manage your insurance policies and coverage details
          </p>
        </div>
        
        {/* Policy Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-200 dark:bg-green-800">
                <Shield size={20} className="text-green-700 dark:text-green-300" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">Active</div>
                <div className="text-xs text-green-600 dark:text-green-400">Policy Status</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
                <Users size={20} className="text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{selectedPolicy.dependents.length + 1}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Covered Members</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800">
                <CalendarBlank size={20} className="text-purple-700 dark:text-purple-300" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{getDaysUntilRenewal(selectedPolicy.renewalDate)}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Days to Renewal</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Policy Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Policy Card */}
          <Card className="card-enhanced">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Shield size={28} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedPolicy.planName}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">
                      Policy #{selectedPolicy.policyNumber}
                    </p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(selectedPolicy.status)} px-3 py-1`}>
                  {selectedPolicy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Policy Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarBlank size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Effective Date:</span>
                  </div>
                  <p className="font-medium">{formatDate(selectedPolicy.effectiveDate)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarBlank size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Renewal Date:</span>
                  </div>
                  <p className="font-medium">{formatDate(selectedPolicy.renewalDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDaysUntilRenewal(selectedPolicy.renewalDate)} days remaining
                  </p>
                </div>
              </div>

              <Separator />

              {/* Coverage Details */}
              <div>
                <h4 className="font-semibold mb-3">Coverage Included</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Heart size={16} className={selectedPolicy.coverage.medical ? 'text-green-600' : 'text-muted-foreground'} />
                    <span className={`text-sm ${selectedPolicy.coverage.medical ? '' : 'text-muted-foreground'}`}>
                      Medical
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooth size={16} className={selectedPolicy.coverage.dental ? 'text-green-600' : 'text-muted-foreground'} />
                    <span className={`text-sm ${selectedPolicy.coverage.dental ? '' : 'text-muted-foreground'}`}>
                      Dental
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} className={selectedPolicy.coverage.vision ? 'text-green-600' : 'text-muted-foreground'} />
                    <span className={`text-sm ${selectedPolicy.coverage.vision ? '' : 'text-muted-foreground'}`}>
                      Vision
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CurrencyDollar size={16} className={selectedPolicy.coverage.prescription ? 'text-green-600' : 'text-muted-foreground'} />
                    <span className={`text-sm ${selectedPolicy.coverage.prescription ? '' : 'text-muted-foreground'}`}>
                      Prescription
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Summary */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <CurrencyDollar size={18} className="text-primary" />
                  Financial Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Monthly Premium</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {formatCurrency(selectedPolicy.monthlyPremium)}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-muted/30">
                    <p className="text-sm text-muted-foreground">Annual Cost</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(selectedPolicy.monthlyPremium * 12)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deductible Progress */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Annual Deductible</span>
                    <span>
                      {formatCurrency(selectedPolicy.deductibleUsed)} / {formatCurrency(selectedPolicy.deductible)}
                    </span>
                  </div>
                  <Progress 
                    value={calculateDeductibleProgress(selectedPolicy.deductibleUsed, selectedPolicy.deductible)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(selectedPolicy.deductible - selectedPolicy.deductibleUsed)} remaining
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Out-of-Pocket Maximum</span>
                    <span>
                      {formatCurrency(selectedPolicy.outOfPocketUsed)} / {formatCurrency(selectedPolicy.outOfPocketMax)}
                    </span>
                  </div>
                  <Progress 
                    value={calculateDeductibleProgress(selectedPolicy.outOfPocketUsed, selectedPolicy.outOfPocketMax)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(selectedPolicy.outOfPocketMax - selectedPolicy.outOfPocketUsed)} remaining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dependents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Covered Dependents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPolicy.dependents.length > 0 ? (
                <div className="space-y-3">
                  {selectedPolicy.dependents.map((dependent, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{dependent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dependent.relationship} • Born {formatDate(dependent.dateOfBirth)}
                        </p>
                      </div>
                      <Badge variant="outline">Covered</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    Add Dependent
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users size={48} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No dependents added</p>
                  <Button variant="outline" className="mt-3">
                    Add Dependent
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <PencilSimple size={16} className="text-primary" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start hover:scale-105 transition-transform" variant="outline">
                <Download size={16} className="mr-2" />
                Download Policy Documents
              </Button>
              <Button className="w-full justify-start hover:scale-105 transition-transform" variant="outline">
                <PencilSimple size={16} className="mr-2" />
                Update Contact Information
              </Button>
              <Button className="w-full justify-start hover:scale-105 transition-transform" variant="outline">
                <CalendarBlank size={16} className="mr-2" />
                Schedule Renewal Review
              </Button>
            </CardContent>
          </Card>

          {/* Primary Care Provider */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Primary Care Provider</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PencilSimple size={14} className="mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Primary Care Provider</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="provider-name">Provider Name</Label>
                        <Input 
                          id="provider-name" 
                          defaultValue={selectedPolicy.primaryCareProvider?.name}
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider-phone">Phone Number</Label>
                        <Input 
                          id="provider-phone" 
                          defaultValue={selectedPolicy.primaryCareProvider?.phone}
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider-address">Address</Label>
                        <Input 
                          id="provider-address" 
                          defaultValue={selectedPolicy.primaryCareProvider?.address}
                        />
                      </div>
                      <Button className="w-full">Save Changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPolicy.primaryCareProvider ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{selectedPolicy.primaryCareProvider.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} />
                    <span>{selectedPolicy.primaryCareProvider.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{selectedPolicy.primaryCareProvider.address}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No provider selected</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Select Provider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Renewal Alert */}
          {getDaysUntilRenewal(selectedPolicy.renewalDate) <= 60 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <WarningCircle size={20} />
                  Renewal Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700 mb-3">
                  Your policy renews in {getDaysUntilRenewal(selectedPolicy.renewalDate)} days. 
                  Review your coverage and make any necessary changes.
                </p>
                <Button size="sm" className="w-full">
                  Review Renewal Options
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
