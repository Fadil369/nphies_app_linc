import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { PaperPlaneRight, User, Robot } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date | string
  type?: 'text' | 'quick-action'
  actions?: Array<{ label: string; action: string }>
}

const QUICK_ACTIONS = [
  { label: 'Check claim status', action: 'claim-status' },
  { label: 'Compare health plans', action: 'compare-plans' },
  { label: 'Find network doctors', action: 'find-doctors' },
  { label: 'Understand my benefits', action: 'benefits-info' },
]

export default function ChatInterface() {
  const [messages, setMessages] = useKV<ChatMessage[]>('chat-messages', [])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        content: "Hello! I'm your HealthCare Assistant. I'm here to help you with your insurance questions 24/7. How can I assist you today?",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
        actions: QUICK_ACTIONS
      }
      setMessages([welcomeMessage])
    }
  }, [messages, setMessages])

  const generateResponse = async (userMessage: string): Promise<string> => {
    setIsTyping(true)
    
    try {
      const prompt = spark.llmPrompt`You are a helpful health insurance virtual assistant. The user asked: "${userMessage}". 

      Provide a helpful, accurate response about health insurance topics including:
      - Coverage explanations
      - Claims processing
      - Policy benefits
      - Network providers
      - Enrollment assistance
      
      Keep responses concise but informative. If you need more information to help properly, ask specific follow-up questions.`
      
      const response = await spark.llm(prompt)
      return response
    } catch (error) {
      return "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team for immediate assistance."
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async (content: string, isQuickAction = false) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    const assistantResponse = await generateResponse(content)
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: assistantResponse,
      sender: 'assistant',
      timestamp: new Date(),
      type: 'text',
      actions: Math.random() > 0.7 ? QUICK_ACTIONS.slice(0, 2) : undefined
    }

    setMessages(prev => [...prev, assistantMessage])
  }

  const handleQuickAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'claim-status': 'I need help checking my claim status',
      'compare-plans': 'Can you help me compare different health plans?',
      'find-doctors': 'I need to find doctors in my network',
      'benefits-info': 'Can you explain my benefits and coverage?'
    }
    
    handleSendMessage(actionMap[action] || action, true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Robot size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">HealthCare Assistant</h3>
            <p className="text-sm text-muted-foreground">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {message.sender === 'user' ? (
                    <User size={16} className="text-primary" />
                  ) : (
                    <Robot size={16} className="text-primary" />
                  )}
                </div>
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-card border border-border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.actions && (
                    <div className="flex flex-wrap gap-2">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action.action)}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Robot size={16} className="text-primary" />
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your insurance coverage, claims, or benefits..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" disabled={!inputValue.trim() || isTyping}>
            <PaperPlaneRight size={16} />
          </Button>
        </form>
      </div>
    </Card>
  )
}