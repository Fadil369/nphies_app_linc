import { useState, useEffect, useCallback, FormEvent } from 'react'
import { CopilotKit } from '@copilotkit/react-core'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatCircle, Shield, FileText, User, Plus, Clock, Bell, Settings, SignOut } from '@phosphor-icons/react'

// Import components (fallback to original if enhanced not available)
import EnhancedChatInterface from '@/components/EnhancedChatInterface'
import CoverageComparison from '@/components/CoverageComparison'
import EnhancedClaimsTracker from '@/components/EnhancedClaimsTracker'
import PolicyManagement from '@/components/PolicyManagement'
import EnrollmentAssistant from '@/components/EnrollmentAssistant'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useNPHIESAuth } from '@/lib/nphies-api'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState(3)
  const [credentials, setCredentials] = useState({
    username: 'demo@healthcare.sa',
    password: 'demo123',
  })
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showUnauthorizedHint, setShowUnauthorizedHint] = useState(false)

  const publicApiKey = (import.meta as any).env?.VITE_COPILOT_API_KEY ?? 'demo'
  const isDev = (import.meta as any).env?.MODE === 'development'

  const { isAuthenticated, login, logout, loading: authLoading, user, lastReason } = useNPHIESAuth()

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (lastReason === 'unauthorized') {
      setShowUnauthorizedHint(true)
    }
  }, [lastReason])

  useEffect(() => {
    const handler = () => setShowUnauthorizedHint(true)
    if (typeof document !== 'undefined') {
      document.addEventListener('nphies:unauthorized', handler)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('nphies:unauthorized', handler)
      }
    }
  }, [])

  const handleLogin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    const result = await login(credentials.username, credentials.password)
    if (!result.success) {
      setLoginError(result.error ?? 'Unable to authenticate. Please try again.')
    } else {
      setShowUnauthorizedHint(false)
    }
  }, [credentials.username, credentials.password, login])

  const handleLogout = useCallback(() => {
    logout()
    setActiveTab('chat')
    setNotifications(0)
  }, [logout])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background/90 to-muted flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_45%)] opacity-40" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">
          <Card className="card-enhanced overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-background px-6 py-8">
              <div className="flex items-center gap-3">
                <Shield weight="duotone" size={32} className="text-primary" />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Healthcare Assistant Access</h1>
                  <p className="text-sm text-muted-foreground">Secure login for NPHIES operations</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {showUnauthorizedHint && (
                <Alert variant="destructive">
                  <AlertTitle>Session expired</AlertTitle>
                  <AlertDescription>
                    Your session ended due to inactivity or an authorization change. Please sign in again to continue.
                  </AlertDescription>
                </Alert>
              )}

              {loginError && (
                <Alert variant="destructive">
                  <AlertTitle>Authentication failed</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Work Email</Label>
                  <Input
                    id="username"
                    type="email"
                    autoComplete="username"
                    required
                    value={credentials.username}
                    onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
                    className="focus-enhanced"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="px-0 text-xs" type="button" onClick={() => setCredentials({ username: 'demo@healthcare.sa', password: 'demo123' })}>
                      Use demo credentials
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                    className="focus-enhanced"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={authLoading}>
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <div className="text-xs text-muted-foreground text-center">
                Protected NPHIES environment • Compliant with Saudi healthcare data policies
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <CopilotKit
      publicApiKey={publicApiKey}
      showDevConsole={isDev}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield weight="duotone" size={32} className="text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">HealthCare Assistant</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">AI-Powered NPHIES Support</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end mr-2 text-right">
                  <span className="text-xs text-muted-foreground">Signed in as</span>
                  <span className="text-sm font-medium text-foreground">{user?.username ?? 'Healthcare Provider'}</span>
                </div>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell size={18} />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                      {notifications}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings size={18} />
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <SignOut size={16} />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Main Content */}
        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6">
              <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-muted/50">
                <TabsTrigger 
                  value="chat" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <ChatCircle size={16} />
                  <span className="hidden sm:inline font-medium">AI Chat</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="coverage" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Shield size={16} />
                  <span className="hidden sm:inline font-medium">Coverage</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="claims" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Clock size={16} />
                  <span className="hidden sm:inline font-medium">Claims</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="policies" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline font-medium">Policies</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="enrollment" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline font-medium">Enroll</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="animate-in fade-in-50 duration-200">
              <TabsContent value="chat" className="mt-0 space-y-0">
                <EnhancedChatInterface />
              </TabsContent>

              <TabsContent value="coverage" className="mt-0 space-y-0">
                <CoverageComparison />
              </TabsContent>

              <TabsContent value="claims" className="mt-0 space-y-0">
                <EnhancedClaimsTracker />
              </TabsContent>

              <TabsContent value="policies" className="mt-0 space-y-0">
                <PolicyManagement />
              </TabsContent>

              <TabsContent value="enrollment" className="mt-0 space-y-0">
                <EnrollmentAssistant />
              </TabsContent>
            </div>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-muted/30 mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield size={16} className="text-primary" />
                <span>Powered by NPHIES AI Assistant</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>© 2024 Healthcare Assistant</span>
                <span>•</span>
                <span>CCHI Compliant</span>
                <span>•</span>
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CopilotKit>
  )
}

export default App
