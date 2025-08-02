// Quota Indicator Component - Show user's usage and plan status
// Clean React component following separation of concerns

import React from 'react'
import type { UserPlanType } from '../../lib/types'

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

  if (compact) {
    return (
      <div className="quota-indicator compact">
        <span className={`plan-badge plan-${plan}`}>
          {currentPlan.emoji} {currentPlan.name}
        </span>
        {!isUnlimited && (
          <span className={`quota-text ${isLow ? 'low' : ''}`}>
            {remaining}/{limit}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`quota-indicator ${isLow ? 'low' : ''}`}>
      <div className="quota-header">
        <span className={`plan-badge plan-${plan}`}>
          {currentPlan.emoji} {currentPlan.name}
        </span>
        {!isUnlimited && (
          <span className="quota-numbers">
            {remaining} / {limit}
          </span>
        )}
      </div>
      
      {!isUnlimited && (
        <div className="quota-bar-container">
          <div className="quota-bar">
            <div 
              className={`quota-fill ${isLow ? 'low' : ''}`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <div className="quota-label">
            {isLow ? (
              <span className="warning-text">⚠️ Running low</span>
            ) : (
              <span className="normal-text">Lookups remaining</span>
            )}
          </div>
        </div>
      )}

      {isUnlimited && (
        <div className="unlimited-indicator">
          <span className="unlimited-text">♾️ Unlimited</span>
        </div>
      )}
    </div>
  )
}

// CSS styles for the component
const styles = `
.quota-indicator {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.quota-indicator.compact {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.quota-indicator.low {
  color: var(--warning-color, #dc2626);
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.plan-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-badge.plan-free {
  background: var(--free-bg, #f3f4f6);
  color: var(--free-text, #6b7280);
}

.plan-badge.plan-pro {
  background: var(--pro-bg, #eff6ff);
  color: var(--pro-text, #2563eb);
}

.plan-badge.plan-premium {
  background: var(--premium-bg, #f3e8ff);
  color: var(--premium-text, #7c3aed);
}

.plan-badge.plan-enterprise {
  background: var(--enterprise-bg, #ecfdf5);
  color: var(--enterprise-text, #059669);
}

.quota-numbers {
  font-weight: 500;
  color: var(--text-color, #374151);
}

.quota-text {
  font-weight: 500;
  color: var(--text-color, #374151);
}

.quota-text.low {
  color: var(--warning-color, #dc2626);
}

.quota-bar-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quota-bar {
  width: 100%;
  height: 3px;
  background: var(--quota-bg, #e5e7eb);
  border-radius: 2px;
  overflow: hidden;
}

.quota-fill {
  height: 100%;
  background: var(--quota-fill, #10b981);
  border-radius: 2px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.quota-fill.low {
  background: var(--warning-color, #dc2626);
}

.quota-label {
  font-size: 10px;
  color: var(--secondary-text, #6b7280);
}

.warning-text {
  color: var(--warning-color, #dc2626);
  font-weight: 500;
}

.normal-text {
  color: var(--secondary-text, #6b7280);
}

.unlimited-indicator {
  text-align: center;
  padding: 4px 0;
}

.unlimited-text {
  color: var(--success-color, #10b981);
  font-weight: 500;
  font-size: 11px;
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .quota-indicator:not(.compact) {
    font-size: 11px;
  }
  
  .plan-badge {
    font-size: 9px;
    padding: 1px 4px;
  }
}
`