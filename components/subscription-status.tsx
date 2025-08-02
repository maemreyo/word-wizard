// Subscription Status - Shows current subscription details and management
// Billing portal access and subscription controls

import { format, formatDistanceToNow } from 'date-fns'
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    CreditCard,
    Crown,
    ExternalLink,
    Loader2,
    RefreshCw,
    Settings,
    XCircle
} from 'lucide-react'
import React, { useState } from 'react'
import { useAuth, usePaymentActions, useSubscription } from '../lib/stores/payment-store'

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface SubscriptionStatusProps {
  className?: string
  showDetails?: boolean
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  className = '',
  showDetails = true
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { subscription, plan, isLoading: storeLoading } = useSubscription()
  const { isAuthenticated } = useAuth()
  const { 
    openBillingPortal, 
    cancelSubscription, 
    reactivateSubscription,
    loadSubscription,
    showUpgrade
  } = usePaymentActions()

  const handleBillingPortal = async () => {
    setIsLoading('portal')
    try {
      const portalUrl = await openBillingPortal()
      chrome.tabs.create({ url: portalUrl })
    } catch (error) {
      console.error('Failed to open billing portal:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setIsLoading('cancel')
    try {
      await cancelSubscription()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleReactivateSubscription = async () => {
    setIsLoading('reactivate')
    try {
      await reactivateSubscription()
    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleRefresh = async () => {
    setIsLoading('refresh')
    try {
      await loadSubscription()
    } catch (error) {
      console.error('Failed to refresh subscription:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusInfo = () => {
    if (!subscription) {
      return {
        status: 'Free',
        variant: 'secondary' as const,
        icon: XCircle,
        description: 'No active subscription'
      }
    }

    switch (subscription.status) {
      case 'active':
        return {
          status: 'Active',
          variant: 'default' as const,
          icon: CheckCircle,
          description: 'Your subscription is active'
        }
      case 'trialing':
        return {
          status: 'Trial',
          variant: 'secondary' as const,
          icon: Crown,
          description: 'Free trial active'
        }
      case 'canceled':
        return {
          status: 'Canceled',
          variant: 'outline' as const,
          icon: AlertTriangle,
          description: 'Canceled - active until period ends'
        }
      case 'past_due':
        return {
          status: 'Past Due',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          description: 'Payment failed - please update billing'
        }
      case 'unpaid':
        return {
          status: 'Unpaid',
          variant: 'destructive' as const,
          icon: XCircle,
          description: 'Payment required'
        }
      default:
        return {
          status: subscription.status,
          variant: 'secondary' as const,
          icon: XCircle,
          description: 'Unknown status'
        }
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please sign in to view subscription status
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  const now = Date.now()
  const isExpiringSoon = subscription && subscription.currentPeriodEnd - now < 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              <StatusIcon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">Subscription Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading === 'refresh'}
          title="Refresh subscription status"
        >
          <RefreshCw 
            size={16} 
            className={isLoading === 'refresh' ? 'animate-spin' : ''} 
          />
        </Button>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-4">
        {subscription && plan ? (
          <>
            {/* Plan Info */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{plan.displayName}</h4>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <Badge variant={statusInfo.variant}>
                {statusInfo.status}
              </Badge>
            </div>

            {showDetails && (
              <>
                <Separator />
                
                {/* Billing Period */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    <span>Current period</span>
                  </div>
                  <div className="text-sm">
                    {format(subscription.currentPeriodStart, 'MMM d')} - {format(subscription.currentPeriodEnd, 'MMM d, yyyy')}
                  </div>
                </div>

                {/* Next billing */}
                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard size={14} />
                      <span>Next billing</span>
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(subscription.currentPeriodEnd, { addSuffix: true })}
                    </div>
                  </div>
                )}

                {/* Trial end */}
                {subscription.status === 'trialing' && subscription.trialEnd && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Crown size={14} />
                      <span>Trial ends</span>
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(subscription.trialEnd, { addSuffix: true })}
                    </div>
                  </div>
                )}

                {/* Cancellation notice */}
                {subscription.cancelAtPeriodEnd && (
                  <Alert>
                    <AlertTriangle size={14} />
                    <AlertDescription>
                      Your subscription will end on {format(subscription.currentPeriodEnd, 'MMM d, yyyy')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Expiring soon notice */}
                {isExpiringSoon && !subscription.cancelAtPeriodEnd && (
                  <Alert>
                    <AlertTriangle size={14} />
                    <AlertDescription>
                      Your subscription renews in {formatDistanceToNow(subscription.currentPeriodEnd)}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Payment issue notice */}
                {(subscription.status === 'past_due' || subscription.status === 'unpaid') && (
                  <Alert variant="destructive">
                    <AlertTriangle size={14} />
                    <AlertDescription>
                      Please update your payment method to continue using premium features
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex gap-3">
              <Button
                onClick={handleBillingPortal}
                disabled={isLoading === 'portal'}
                className="flex items-center gap-2"
              >
                {isLoading === 'portal' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    Manage Billing
                    <ExternalLink size={14} />
                  </>
                )}
              </Button>

              {subscription.cancelAtPeriodEnd ? (
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={isLoading === 'reactivate'}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {isLoading === 'reactivate' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Reactivate
                    </>
                  )}
                </Button>
              ) : subscription.status === 'active' ? (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={isLoading === 'cancel'}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {isLoading === 'cancel' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Cancel
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          // No subscription
          <div className="text-center py-6">
            <Avatar className="w-16 h-16 mx-auto mb-4">
              <AvatarFallback className="bg-muted">
                <Crown className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <h4 className="font-medium mb-2">No Active Subscription</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to unlock premium features and unlimited usage
            </p>
            <Button onClick={() => showUpgrade()}>
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}