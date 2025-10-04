import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, RefreshCw } from '@phosphor-icons/react'
import { useNPHIESHealth } from '@/lib/nphies-api'

export function HealthCheck() {
  const { status, lastCheck, checkHealth } = useNPHIESHealth()
  const [checking, setChecking] = useState(false)

  const handleRefresh = async () => {
    setChecking(true)
    await checkHealth()
    setTimeout(() => setChecking(false), 500)
  }

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={checking}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              size={14}
              className={checking ? 'animate-spin' : ''}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">NPHIES Service</span>
          <Badge
            variant={status === 'online' ? 'default' : status === 'checking' ? 'secondary' : 'destructive'}
            className="flex items-center gap-1"
          >
            {status === 'online' && <CheckCircle size={12} weight="fill" />}
            {status === 'offline' && <XCircle size={12} weight="fill" />}
            {status === 'checking' && <Clock size={12} />}
            {status === 'online' ? 'Online' : status === 'checking' ? 'Checking' : 'Offline'}
          </Badge>
        </div>
        {lastCheck && (
          <p className="text-xs text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}
        {status === 'offline' && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle className="text-xs">Service Unavailable</AlertTitle>
            <AlertDescription className="text-xs">
              Unable to connect to NPHIES backend. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
