// AI Quick Actions - Quick AI processing buttons for selected text
// Provides instant AI features without opening full chat interface

import {
    BarChart3,
    Check,
    Copy,
    FileText,
    Hash,
    Languages,
    Lightbulb,
    Loader2,
    Mail
} from 'lucide-react'
import React, { useState } from 'react'
import { AIService } from '../lib/services/ai-service'
import { useAIActions, useAIProviders, useAIStore, useEnabledFeatures } from '../lib/stores/ai-store'
import type { AIProcessingResult } from '../lib/types'

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface AIQuickActionsProps {
  selectedText: string
  onResult?: (result: string) => void
  className?: string
}

export const AIQuickActions: React.FC<AIQuickActionsProps> = ({
  selectedText,
  onResult,
  className = ''
}) => {
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})
  const [copiedAction, setCopiedAction] = useState<string | null>(null)
  
  const { isProcessing } = useAIStore()
  const { providers, activeProvider } = useAIProviders()
  const enabledFeatures = useEnabledFeatures()
  const { addProcessingResult } = useAIActions()

  const isConfigured = providers[activeProvider] !== null

  const quickActions = [
    {
      id: 'summarize',
      name: 'Summarize',
      icon: FileText,
      description: 'Create a concise summary',
      variant: 'default' as const,
      enabled: enabledFeatures.some(f => f.id === 'summarize')
    },
    {
      id: 'translate',
      name: 'Translate',
      icon: Languages,
      description: 'Translate to English',
      variant: 'secondary' as const,
      enabled: enabledFeatures.some(f => f.id === 'translate')
    },
    {
      id: 'explain',
      name: 'Explain',
      icon: Lightbulb,
      description: 'Get an explanation',
      variant: 'outline' as const,
      enabled: enabledFeatures.some(f => f.id === 'explain')
    },
    {
      id: 'analyze_sentiment',
      name: 'Sentiment',
      icon: BarChart3,
      description: 'Analyze sentiment',
      variant: 'default' as const,
      enabled: enabledFeatures.some(f => f.id === 'analyze_sentiment')
    },
    {
      id: 'generate_email',
      name: 'Email',
      icon: Mail,
      description: 'Generate email',
      variant: 'secondary' as const,
      enabled: enabledFeatures.some(f => f.id === 'generate_email')
    },
    {
      id: 'extract_keywords',
      name: 'Keywords',
      icon: Hash,
      description: 'Extract keywords',
      variant: 'outline' as const,
      enabled: enabledFeatures.some(f => f.id === 'extract_keywords')
    }
  ]

  const processWithAI = async (actionId: string) => {
    if (!isConfigured || !selectedText.trim() || isProcessing) return

    const providerConfig = providers[activeProvider]!
    setProcessingAction(actionId)

    try {
      const aiService = new AIService(providerConfig)
      let result: string

      switch (actionId) {
        case 'summarize':
          result = await aiService.summarizeText(selectedText, 200)
          break
        case 'translate':
          result = await aiService.translateText(selectedText, 'English')
          break
        case 'explain':
          result = await aiService.explainText(selectedText, 'simple')
          break
        case 'analyze_sentiment':
          result = await aiService.analyzeText(selectedText, 'sentiment')
          break
        case 'generate_email':
          result = await aiService.generateContent(selectedText, 'email')
          break
        case 'extract_keywords':
          result = await aiService.analyzeText(selectedText, 'keywords')
          break
        default:
          throw new Error(`Unknown action: ${actionId}`)
      }

      // Update results
      setResults(prev => ({ ...prev, [actionId]: result }))
      
      // Add to processing history
      const processingResult: AIProcessingResult = {
        id: `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        input: selectedText,
        output: result,
        feature: actionId,
        provider: activeProvider,
        model: providerConfig.model,
        usage: { totalTokens: 0, promptTokens: 0, completionTokens: 0 }, // Simplified for quick actions
        timestamp: Date.now(),
        success: true
      }
      addProcessingResult(processingResult)

      onResult?.(result)

    } catch (error: any) {
      const errorMessage = `Error: ${error.message || 'Processing failed'}`
      setResults(prev => ({ ...prev, [actionId]: errorMessage }))
      
      // Add error to history
      const processingResult: AIProcessingResult = {
        id: `quick_error_${Date.now()}`,
        input: selectedText,
        output: '',
        feature: actionId,
        provider: activeProvider,
        model: providerConfig.model,
        usage: { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
        timestamp: Date.now(),
        success: false,
        error: error.message
      }
      addProcessingResult(processingResult)

    } finally {
      setProcessingAction(null)
    }
  }

  const copyResult = async (actionId: string) => {
    const result = results[actionId]
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)
      setCopiedAction(actionId)
      setTimeout(() => setCopiedAction(null), 2000)
    } catch (error) {
      console.error('Failed to copy result:', error)
    }
  }

  if (!selectedText.trim()) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Lightbulb size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Select text to see AI quick actions</p>
        </CardContent>
      </Card>
    )
  }

  if (!isConfigured) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Alert>
            <AlertDescription>
              ⚠️ Please configure your AI provider in settings to use quick actions
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">AI Quick Actions</CardTitle>
        <p className="text-xs text-muted-foreground">
          Selected: "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {quickActions
            .filter(action => action.enabled)
            .map((action) => {
              const Icon = action.icon
              const isProcessing = processingAction === action.id
              const hasResult = results[action.id]

              return (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={() => processWithAI(action.id)}
                  disabled={isProcessing || processingAction !== null}
                  className={`relative h-auto p-3 ${hasResult ? 'ring-2 ring-green-500' : ''}`}
                  title={action.description}
                >
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Icon size={16} />
                    )}
                    <span className="text-xs">{action.name}</span>
                  </div>
                  
                  {hasResult && !isProcessing && (
                    <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-green-500">
                      <Check size={8} />
                    </Badge>
                  )}
                </Button>
              )
            })}
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="text-sm font-medium">Results</h4>
            
            {Object.entries(results).map(([actionId, result]) => {
              const action = quickActions.find(a => a.id === actionId)
              const isCopied = copiedAction === actionId
              
              return (
                <Card key={actionId} className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {action && <action.icon size={14} />}
                        <span className="text-sm font-medium">
                          {action?.name}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyResult(actionId)}
                        className="h-6 w-6 p-0"
                        title="Copy result"
                      >
                        {isCopied ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-sm whitespace-pre-wrap">
                      {result}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {processingAction && (
          <Alert>
            <Loader2 size={16} className="animate-spin" />
            <AlertDescription>
              Processing with {activeProvider}...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}