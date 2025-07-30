import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  MagnifyingGlass, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  CalendarBlank,
  CurrencyDollar 
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface Claim {
  id: string
  claimNumber: string
  serviceDate: Date | string
  provider: string
  serviceType: string
  claimedAmount: number
  approvedAmount: number
  patientResponsibility: number
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Paid' | 'Denied' | 'Appeal'
  statusDate: Date | string
  description: string
  timeline: Array<{
    status: string
    date: Date | string
    description: string
  }>
}

const SAMPLE_CLAIMS: Claim[] = [
  {
    id: '1',
    claimNumber: 'CLM-2024-001',
    serviceDate: new Date('2024-01-15'),
    provider: 'City Medical Center',
    serviceType: 'Routine Checkup',
    claimedAmount: 250,
    approvedAmount: 200,
    patientResponsibility: 25,
    status: 'Paid',
    statusDate: new Date('2024-01-22'),
    description: 'Annual physical examination and routine blood work',
    timeline: [
      { status: 'Submitted', date: new Date('2024-01-16'), description: 'Claim submitted by provider' },
      { status: 'Under Review', date: new Date('2024-01-18'), description: 'Medical necessity review in progress' },
      { status: 'Approved', date: new Date('2024-01-20'), description: 'Claim approved for payment' },
      { status: 'Paid', date: new Date('2024-01-22'), description: 'Payment processed to provider' }
    ]
  },
  {
    id: '2',
    claimNumber: 'CLM-2024-002',
    serviceDate: new Date('2024-01-28'),
    provider: 'Downtown Orthopedics',
    serviceType: 'MRI Scan',
    claimedAmount: 1200,
    approvedAmount: 950,
    patientResponsibility: 150,
    status: 'Under Review',
    statusDate: new Date('2024-02-01'),
    description: 'MRI of left knee following injury',
    timeline: [
      { status: 'Submitted', date: new Date('2024-01-30'), description: 'Claim submitted by provider' },
      { status: 'Under Review', date: new Date('2024-02-01'), description: 'Prior authorization verification in progress' }
    ]
  },
  {
    id: '3',
    claimNumber: 'CLM-2024-003',
    serviceDate: new Date('2024-02-05'),
    provider: 'QuickCare Urgent Care',
    serviceType: 'Urgent Care Visit',
    claimedAmount: 180,
    approvedAmount: 160,
    patientResponsibility: 35,
    status: 'Approved',
    statusDate: new Date('2024-02-08'),
    description: 'Treatment for minor laceration and tetanus shot',
    timeline: [
      { status: 'Submitted', date: new Date('2024-02-06'), description: 'Claim submitted by provider' },
      { status: 'Under Review', date: new Date('2024-02-07'), description: 'Standard review process' },
      { status: 'Approved', date: new Date('2024-02-08'), description: 'Claim approved for payment' }
    ]
  }
]

export default function ClaimsTracker() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [claims, setClaims] = useKV<Claim[]>('user-claims', SAMPLE_CLAIMS)

  const filteredClaims = claims.filter(claim => 
    claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200'
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
      case 'Under Review': return <Clock className="text-yellow-600" size={16} />
      case 'Submitted': return <FileText className="text-gray-600" size={16} />
      case 'Denied': return <XCircle className="text-red-600" size={16} />
      case 'Appeal': return <Clock className="text-purple-600" size={16} />
      default: return <Clock className="text-gray-600" size={16} />
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'Submitted': return 25
      case 'Under Review': return 50
      case 'Approved': return 75
      case 'Paid': return 100
      case 'Denied': return 100
      case 'Appeal': return 60
      default: return 0
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
      <div>
        <h2 className="text-2xl font-bold">Claims Status Tracker</h2>
        <p className="text-muted-foreground">
          Track your insurance claims and view payment status
        </p>
      </div>

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
          <h3 className="text-lg font-semibold">Your Claims</h3>
          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <Card 
                key={claim.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedClaim?.id === claim.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedClaim(claim)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(claim.status)}
                      <span className="font-medium">{claim.claimNumber}</span>
                    </div>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{claim.serviceType}</p>
                    <p className="text-sm text-muted-foreground">{claim.provider}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Date:</span>
                      <span>{formatDate(claim.serviceDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Claimed Amount:</span>
                      <span className="font-medium">{formatCurrency(claim.claimedAmount)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{getProgressValue(claim.status)}%</span>
                      </div>
                      <Progress value={getProgressValue(claim.status)} className="h-2" />
                    </div>
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
                  </CardTitle>
                  <Badge className={getStatusColor(selectedClaim.status)}>
                    {selectedClaim.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{selectedClaim.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Claim Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarBlank size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Service Date:</span>
                      <span>{formatDate(selectedClaim.serviceDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Provider:</span>
                      <span>{selectedClaim.provider}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CurrencyDollar size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Service Type:</span>
                      <span>{selectedClaim.serviceType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Status Date:</span>
                      <span>{formatDate(selectedClaim.statusDate)}</span>
                    </div>
                  </div>
                </div>

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
                      <span className="text-primary">{formatCurrency(selectedClaim.approvedAmount - selectedClaim.patientResponsibility)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-3">Claim Timeline</h4>
                  <div className="space-y-3">
                    {selectedClaim.timeline.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            index === selectedClaim.timeline.length - 1 ? 'bg-primary' : 'bg-muted-foreground'
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
                    Select a claim to view detailed information
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}