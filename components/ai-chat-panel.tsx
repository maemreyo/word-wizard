// AI Chat Panel - Full-featured AI chat interface
// Modern chat UI with streaming support and conversation management

import { formatDistanceToNow } from 'date-fns'
import { Bot, Copy, Plus, RefreshCw, Send, Settings, User, X } from 'lucide-react'
import { marked } from 'marked'
import React, { useEffect, useRef, useState } from 'react'
import { AIService } from '../lib/services/ai-service'
import { useActiveConversation, useAIActions, useAIProviders, useAIStore } from '../lib/stores/ai-store'
import type { ChatMessage } from '../lib/types'

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

interface AIChatPanelProps {
  className?: string
  selectedText?: string
  onClose?: () => void
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  className = '',
  selectedText = '',
  onClose
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const [aiService, setAIService] = useState<AIService | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { conversations, isProcessing, streamingContent } = useAIStore()
  const { providers, activeProvider } = useAIProviders()
  const activeConversation = useActiveConversation()
  
  const {
    createConversation,
    deleteConversation,
    setActiveConversation,
    addMessage,
    updateConversation,
    startProcessing,
    stopProcessing,
    setStreamingContent,
    clearStreamingContent
  } = useAIActions()

  // Initialize AI service when provider changes
  useEffect(() => {
    const providerConfig = providers[activeProvider]
    if (providerConfig) {
      try {
        const service = new AIService(providerConfig)
        setAIService(service)
      } catch (error) {
        console.error('Failed to initialize AI service:', error)
      }
    }
  }, [providers, activeProvider])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, streamingContent])

  // Pre-fill with selected text
  useEffect(() => {
    if (selectedText && !inputMessage) {
      setInputMessage(`Please help me with this text: "${selectedText}"`)
    }
  }, [selectedText])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !aiService || isProcessing) return

    let conversationId = activeConversation?.id
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation()
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim()
    }

    addMessage(conversationId, userMessage)
    setInputMessage('')
    startProcessing()

    try {
      const messages = activeConversation?.messages || []
      const fullMessages = [...messages, userMessage]

      const response = await aiService.chat(fullMessages, {
        stream: false // We'll add streaming later
      })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content
      }

      addMessage(conversationId, assistantMessage)
      
      // Update conversation title if it's the first exchange
      if (fullMessages.length <= 2) {
        const title = inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : '')
        updateConversation(conversationId, { title })
      }

    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Failed to get AI response'}`
      }
      addMessage(conversationId, errorMessage)
    } finally {
      stopProcessing()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'
    
    return (
      <div
        key={index}
        className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {isAssistant && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot size={16} />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <Card className={`${isUser ? 'ml-auto bg-primary text-primary-foreground' : ''}`}>
            <CardContent className="p-3">
              {isAssistant && message.content.includes('```') ? (
                <div 
                  className="prose dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: String(typeof marked.parse === 'function' ? marked.parse(message.content) : marked(message.content))
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {message.timestamp && (
              <span>
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            )}
            
            {isAssistant && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
                className="h-6 w-6 p-0"
                title="Copy message"
              >
                <Copy size={12} />
              </Button>
            )}
          </div>
        </div>

        {isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-secondary">
              <User size={16} />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Bot className="text-primary" size={24} />
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {activeProvider}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {providers[activeProvider]?.model || 'No model'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createConversation()}
            title="New conversation"
          >
            <Plus size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            title="Settings"
          >
            <Settings size={16} />
          </Button>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Conversation List */}
      {conversations.length > 1 && (
        <>
          <div className="px-4 pb-2">
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {conversations.slice(0, 5).map((conv) => (
                  <Button
                    key={conv.id}
                    variant={activeConversation?.id === conv.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveConversation(conv.id)}
                    className="flex-shrink-0 max-w-32 truncate text-xs"
                  >
                    {conv.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <Separator />
        </>
      )}

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div className="max-w-sm space-y-4">
                <Bot size={48} className="mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Start a conversation</h3>
                  <p className="text-muted-foreground text-sm">
                    Ask me anything! I can help with text analysis, summarization, translation, and more.
                  </p>
                </div>
                {selectedText && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Selected text ready to analyze
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {activeConversation.messages.map(renderMessage)}
              
              {/* Streaming content */}
              {isProcessing && streamingContent && (
                <div className="flex gap-3 p-4">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot size={16} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%]">
                    <Card>
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">{streamingContent}</div>
                        <div className="mt-2 flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {isProcessing && !streamingContent && (
                <div className="flex gap-3 p-4">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <RefreshCw size={16} className="animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center text-muted-foreground text-sm">
                    AI is thinking...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="p-4">
        <Separator className="mb-4" />
        <div className="flex gap-3">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 resize-none min-h-[44px] max-h-[120px]"
            disabled={isProcessing}
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing || !aiService}
            size="sm"
            className="px-3"
          >
            <Send size={16} />
          </Button>
        </div>
        
        {!providers[activeProvider] && (
          <Alert className="mt-3">
            <AlertDescription className="text-sm">
              ⚠️ Please configure your AI provider in settings
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  )
}