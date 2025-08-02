// Quota Indicator Component - Show user's usage and plan status
// Clean React component following separation of concerns

import type { UserPlanType } from '../../lib/types'

// shadcn/ui components
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface QuotaIndicatorProps {
  remaining: number
  limit: number
  plan: UserPlanType
  isLow?: boolean
  compact?: boolean
}

export function QuotaIndicator({ 
  remaining, 
  limit, 
  plan, 
  isLow = false,
  compact = false 
}: QuotaIndicatorProps) {
  const usagePercentage = limit > 0 ? ((limit - remaining) / limit) * 100 : 0
  const isUnlimited = plan !== 'free' && limit < 0

  // Plan display configuration
  const planConfig = {
    free: { color: '#6b7280', emoji: '🆓', name: 'Free' },
    pro: { color: '#2563eb', emoji: '⭐', name: 'Pro' },
    premium: { color: '#7c3aed', emoji: '💎', name: 'Premium' },
    enterprise: { color: '#059669', emoji: '🏢', name: 'Enterprise' }
  }

  const currentPlan = planConfig[plan] || planConfig.free

  const getPlanVariant = (planType: UserPlanType) => {
    switch (planType) {
      case 'pro': return 'default'
      case 'premium': return 'secondary'
      case 'enterprise': return 'outline'
      default: return 'secondary'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={getPlanVariant(plan)} className="text-xs">
          {currentPlan.emoji} {currentPlan.name}
        </Badge>
        {!isUnlimited && (
          <span className={`font-medium ${isLow ? 'text-destructive' : 'text-foreground'}`}>
            {remaining}/{limit}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 text-xs ${isLow ? 'text-destructive' : ''}`}>
      <div className="flex justify-between items-center gap-2">
        <Badge variant={getPlanVariant(plan)} className="text-xs">
          {currentPlan.emoji} {currentPlan.name}
        </Badge>
        {!isUnlimited && (
          <span className="font-medium text-foreground">
            {remaining} / {limit}
          </span>
        )}
      </div>
      
      {!isUnlimited && (
        <div className="flex flex-col gap-1">
          <Progress 
            value={usagePercentage} 
            className={`h-1 ${isLow ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
          />
          <div className="text-xs">
            {isLow ? (
              <span className="text-destructive font-medium">⚠️ Running low</span>
            ) : (
              <span className="text-muted-foreground">Lookups remaining</span>
            )}
          </div>
        </div>
      )}

      {isUnlimited && (
        <div className="text-center py-1">
          <span className="text-green-600 font-medium text-xs">♾️ Unlimited</span>
        </div>
      )}
    </div>
  )
}