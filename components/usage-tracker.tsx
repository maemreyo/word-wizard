// Usage Tracker - Shows current usage and limits
// Visual progress bars and upgrade prompts

import { formatDistanceToNow } from 'date-fns'
import {
    AlertTriangle,
    BarChart3,
    Clock,
    Crown,
    MessageSquare,
    Zap
} from 'lucide-react'
import React from 'react'
import { usePaymentActions, useSubscription, useUsage } from '../lib/stores/payment-store'

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface UsageTrackerProps {
  className?: string
  showDetails?: boolean
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({
  className = '',
  showDetails = true
}) => {
  const { usage, featureAccess } = useUsage()
  const { plan, subscription } = useSubscription()
  const { showUpgrade } = usePaymentActions()

  const isActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing'

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500 bg-red-500'
    if (percentage >= 75) return 'text-yellow-500 bg-yellow-500'
    return 'text-green-500 bg-green-500'
  }

  const formatUsage = (used: number, limit: number) => {
    if (limit === -1) return `${used.toLocaleString()} (Unlimited)`
    return `${used.toLocaleString()} / ${limit.toLocaleString()}`
  }

  const usageItems = [
    {
      id: 'ai_requests',
      name: 'AI Requests',
      icon: Zap,
      used: usage?.aiRequests || 0,
      limit: plan?.limits.aiRequests || 0,
      description: 'Monthly AI processing requests'
    },
    {
      id: 'conversations',
      name: 'Conversations',
      icon: MessageSquare,
      used: usage?.conversations || 0,
      limit: plan?.limits.conversations || 0,
      description: 'Active chat conversations'
    },
    {
      id: 'tokens',
      name: 'Tokens Used',
      icon: BarChart3,
      used: usage?.tokensUsed || 0,
      limit: -1, // Usually unlimited or very high
      description: 'Total tokens processed this month'
    }
  ]

  if (!plan || !usage) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-24">
          <div className="text-muted-foreground text-sm">
            Usage data not available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">Usage Overview</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{plan.displayName} Plan</span>
              <Badge variant={isActiveSubscription ? "default" : "secondary"}>
                {isActiveSubscription ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {!isActiveSubscription && (
          <Button
            onClick={() => showUpgrade()}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            size="sm"
          >
            <Crown size={16} />
            Upgrade
          </Button>
        )}
      </CardHeader>

      {/* Usage Metrics */}
      <CardContent className="space-y-6">
        {usageItems.map((item) => {
          const percentage = getUsagePercentage(item.used, item.limit)
          const isNearLimit = percentage >= 75 && item.limit !== -1
          const Icon = item.icon

          return (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-muted-foreground" />
                  <span className="font-medium">{item.name}</span>
                  {isNearLimit && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      <AlertTriangle size={12} className="mr-1" />
                      Near Limit
                    </Badge>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="font-semibold">
                    {formatUsage(item.used, item.limit)}
                  </div>
                  {item.limit !== -1 && (
                    <div className="text-sm text-muted-foreground">
                      {percentage.toFixed(0)}% used
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {item.limit !== -1 && (
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
              )}

              {showDetails && (
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}

              {/* Near limit warning */}
              {isNearLimit && (
                <Alert>
                  <AlertTriangle size={14} />
                  <AlertDescription className="text-sm">
                    You're approaching your {item.name.toLowerCase()} limit. 
                    {item.limit - item.used} remaining.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )
        })}

        {/* Usage Period */}
        {usage.lastUpdated && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Current billing period</span>
              </div>
              <span>
                Updated {formatDistanceToNow(usage.lastUpdated, { addSuffix: true })}
              </span>
            </div>
          </>
        )}

        {/* Upgrade prompt for free users */}
        {!isActiveSubscription && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium mb-1">Unlock More Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to get unlimited AI requests and advanced features
                  </p>
                </div>
                <Button onClick={() => showUpgrade()}>
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Access Status */}
        {showDetails && Object.keys(featureAccess).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Feature Access</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(featureAccess).map(([featureId, access]) => (
                  <Card
                    key={featureId}
                    className={access.hasAccess ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {featureId.replace('_', ' ')}
                        </span>
                        <Badge 
                          variant={access.hasAccess ? "default" : "destructive"}
                          className="h-2 w-2 p-0 rounded-full"
                        />
                      </div>
                      {access.limit && access.used !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {access.used}/{access.limit} used
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}