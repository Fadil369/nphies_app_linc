import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageCircle, Shield, FileText, User, Plus, Clock } from '@phosphor-icons/react'
import ChatInterface from '@/components/ChatInterface'
import CoverageComparison from '@/components/CoverageComparison'
import ClaimsTracker from '@/components/ClaimsTracker'
import PolicyManagement from '@/components/PolicyManagement'
import EnrollmentAssistant from '@/components/EnrollmentAssistant'

function App() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield weight="duotone" size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">HealthCare Assistant</h1>
                <p className="text-sm text-muted-foreground">24/7 Insurance Support</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="coverage" className="flex items-center gap-2">
              <Shield size={16} />
              <span className="hidden sm:inline">Coverage</span>
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <Clock size={16} />
              <span className="hidden sm:inline">Claims</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText size={16} />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="enrollment" className="flex items-center gap-2">
              <Plus size={16} />
              <span className="hidden sm:inline">Enroll</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="coverage" className="mt-0">
            <CoverageComparison />
          </TabsContent>

          <TabsContent value="claims" className="mt-0">
            <ClaimsTracker />
          </TabsContent>

          <TabsContent value="policies" className="mt-0">
            <PolicyManagement />
          </TabsContent>

          <TabsContent value="enrollment" className="mt-0">
            <EnrollmentAssistant />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App