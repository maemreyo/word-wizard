// Upgrade Modal - Subscription upgrade interface
// Beautiful pricing modal with feature comparison

import {
    BarChart3,
    Check,
    CreditCard,
    Crown,
    Loader2,
    Shield,
    Star,
    Users,
    Zap
} from 'lucide-react'
import React, { useState } from 'react'
import { usePaymentActions, usePaymentStore, useSubscription } from '../lib/stores/payment-store'
import type { SubscriptionPlan } from '../lib/types/payment-types'

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedPlan?: string
  featureId?: string
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  preselectedPlan,
  featureId
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(preselectedPlan || '')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  
  const { availablePlans } = useSubscription()
  const { createCheckout, clearError } = usePaymentActions()
  const { error } = usePaymentStore()

  const handleUpgrade = async () => {
    if (!selectedPlan) return

    setIsLoading(true)
    try {
      const checkoutUrl = await createCheckout(selectedPlan, billingPeriod)
      
      // Open checkout in new tab
      chrome.tabs.create({ url: checkoutUrl })
      onClose()
    } catch (error) {
      console.error('Checkout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'basic':
      case 'starter':
        return <Zap className="w-6 h-6" />
      case 'pro':
      case 'professional':
        return <Crown className="w-6 h-6" />
      case 'enterprise':
      case 'business':
        return <Users className="w-6 h-6" />
      default:
        return <Star className="w-6 h-6" />
    }
  }

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly
    const suffix = billingPeriod === 'monthly' ? '/month' : '/year'
    
    if (billingPeriod === 'yearly') {
      const monthlyEquivalent = price / 12
      return {
        main: `$${price}${suffix}`,
        sub: `$${monthlyEquivalent.toFixed(0)}/month billed annually`
      }
    }
    
    return {
      main: `$${price}${suffix}`,
      sub: null
    }
  }

  const getYearlySavings = (plan: SubscriptionPlan) => {
    const yearlyPrice = plan.priceYearly
    const monthlyYearlyPrice = plan.priceMonthly * 12
    const savings = monthlyYearlyPrice - yearlyPrice
    const percentage = Math.round((savings / monthlyYearlyPrice) * 100)
    
    return { amount: savings, percentage }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade Your Plan</DialogTitle>
          {featureId && (
            <p className="text-sm text-muted-foreground">
              Unlock "{featureId}" and many more premium features
            </p>
          )}
        </DialogHeader>

        {/* Billing Period Toggle */}
        <div className="flex justify-center py-4">
          <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'yearly')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                Yearly
                <Badge className="absolute -top-2 -right-2 text-xs bg-green-500">
                  Save 25%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Separator />

        {/* Plans */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const pricing = formatPrice(plan)
              const savings = getYearlySavings(plan)
              const isSelected = selectedPlan === plan.id
              const isPopular = plan.popular

              return (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3 text-primary">
                      {getPlanIcon(plan.id)}
                    </div>
                    
                    <CardTitle className="text-xl mb-2">
                      {plan.displayName}
                    </CardTitle>
                    
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>

                    {/* Pricing */}
                    <div className="mb-2">
                      <span className="text-3xl font-bold">
                        {pricing.main}
                      </span>
                      {billingPeriod === 'yearly' && savings.amount > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          Save ${savings.amount}/year ({savings.percentage}% off)
                        </div>
                      )}
                    </div>
                    
                    {pricing.sub && (
                      <p className="text-sm text-muted-foreground">
                        {pricing.sub}
                      </p>
                    )}

                    {plan.trialDays && (
                      <Badge variant="secondary" className="mt-2">
                        {plan.trialDays}-day free trial
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.slice(0, 5).map((feature) => (
                        <div key={feature.id} className="flex items-center">
                          <Check 
                            size={16} 
                            className={`mr-3 flex-shrink-0 ${
                              feature.included 
                                ? 'text-green-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                          <span className={`text-sm ${
                            feature.included 
                              ? '' 
                              : 'text-muted-foreground line-through'
                          }`}>
                            {feature.name}
                            {feature.limit && feature.limit > 0 && (
                              <span className="text-muted-foreground">
                                {` (${feature.limit.toLocaleString()})`}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Key Limits */}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BarChart3 size={14} className="mr-2" />
                        <span>
                          {plan.limits.aiRequests === -1 
                            ? 'Unlimited AI requests'
                            : `${plan.limits.aiRequests.toLocaleString()} AI requests/month`
                          }
                        </span>
                      </div>
                      
                      {plan.limits.prioritySupport && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Shield size={14} className="mr-2" />
                          <span>Priority support</span>
                        </div>
                      )}
                    </div>

                    {/* Select Button */}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      size="lg"
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 space-y-4">
          <Separator />
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <Shield size={16} className="mr-2" />
              <span>Secure payment powered by Stripe</span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  clearError()
                  onClose()
                }}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleUpgrade}
                disabled={!selectedPlan || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Trust indicators */}
          <Separator />
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Shield size={14} className="mr-1" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center">
              <CreditCard size={14} className="mr-1" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center">
              <Check size={14} className="mr-1" />
              <span>30-day Guarantee</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}