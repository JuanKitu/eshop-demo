import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, CreditCard, Circle, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: number;
  name: string;
  monthly_price: string;
  yearly_price: string;
  duration?: string;
  description?: string;
  features?: string[];
  is_active?: boolean;
  is_current?: boolean;
}

interface CompanyData {
  id: number;
  name: string;
  current_plan_id?: number;
  current_plan_duration?: string | null;
}

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (planId: number, billingCycle?: 'monthly' | 'yearly') => void;
  plans: Plan[];
  currentPlanId?: number;
  companyName: string;
  companyCurrentPlanDuration?: string | null;
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  onConfirm,
  plans,
  currentPlanId,
  companyName,
  companyCurrentPlanDuration
}: UpgradePlanModalProps) {
  const { t } = useTranslation();
  const page = usePage<any>();
  const auth = page.props?.auth;
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Get currency settings once at component level (not during render)
  const superadminSettings = auth?.superadminSettings || {};
  const globalSettings = auth?.globalSettings || {};
  const settings = { ...globalSettings, ...superadminSettings };
  const decimalPlaces = parseInt(settings.decimalFormat || '2');
  const decimalSeparator = settings.decimalSeparator || '.';
  const thousandsSeparator = settings.thousandsSeparator || ',';
  const currencySymbolSpace = settings.currencySymbolSpace === '1' || settings.currencySymbolSpace === 'true' || settings.currencySymbolSpace === true;
  const currencySymbolPosition = settings.currencySymbolPosition || 'before';
  const symbol = superadminSettings?.currencySymbol || globalSettings?.currencySymbol || '$';
  const space = currencySymbolSpace ? ' ' : '';
  
  // Format currency helper function (no hooks called here)
  const formatCurrency = (amount: number | string): string => {
    const num = Number(amount) || 0;
    const parts = Number(num).toFixed(decimalPlaces).split('.');
    
    if (thousandsSeparator !== 'none') {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    }
    
    const formattedNumber = parts.join(decimalSeparator);
    
    return currencySymbolPosition === 'before'
      ? `${symbol}${space}${formattedNumber}`
      : `${formattedNumber}${space}${symbol}`;
  };
  
  // Initialize with current plan ID and billing cycle when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state when modal closes
    if (!plans || plans.length === 0) {
      return;
    }
    
    // Find the current plan
    const currentPlan = plans.find(plan => plan.is_current === true);
    
    // If there's a current plan, select it and set the correct billing cycle
    if (currentPlan) {
      setSelectedPlanId(currentPlan.id);
      // Use the plan's duration from the API response
      const detectedCycle = currentPlan.duration === 'yearly' ? 'yearly' : 'monthly';
      setBillingCycle(detectedCycle);
    } else if (companyCurrentPlanDuration) {
      // Fallback: use the company's current plan duration from props
      setSelectedPlanId(currentPlanId || plans[0].id);
      const detectedCycle = companyCurrentPlanDuration === 'yearly' ? 'yearly' : 'monthly';
      setBillingCycle(detectedCycle);
    } else if (currentPlanId) {
      setSelectedPlanId(currentPlanId);
      setBillingCycle('monthly');
    } else {
      setSelectedPlanId(plans[0].id);
      setBillingCycle('monthly');
    }
  }, [isOpen, plans, currentPlanId, companyCurrentPlanDuration]);
  
  const handleConfirm = () => {
    if (selectedPlanId) {
      onConfirm(selectedPlanId, billingCycle);
    }
  };
  
  const getPriceForSelectedCycle = (plan: Plan) => {
    const priceValue = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
    // Extract numeric value from formatted price (e.g., "$99.99" -> 99.99)
    const numericPrice = parseFloat(priceValue.replace(/[^0-9.-]+/g, ''));
    return isNaN(numericPrice) ? priceValue : formatCurrency(numericPrice);
  };
  
  const getDurationLabel = () => {
    return billingCycle === 'yearly' ? t('Yearly') : t('Monthly');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("Upgrade Plan for")} {companyName}</DialogTitle>
          <DialogDescription>
            {t("Select a new plan for this company")}
          </DialogDescription>
        </DialogHeader>
        
        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 py-4 border-b">
          <Label className="text-sm font-medium">{t('Monthly')}</Label>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label className="text-sm font-medium">{t('Yearly')}</Label>
        </div>
        
        <div className="py-4 flex-1 overflow-y-auto -mx-6 px-6">
          <RadioGroup 
            value={selectedPlanId?.toString() || ""} 
            onValueChange={(value) => setSelectedPlanId(parseInt(value))}
            className="space-y-4"
          >
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex items-center space-x-3 rounded-lg border p-4 ${
                    selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                  } ${plan.is_current ? 'bg-blue-50' : ''}`}
                >
                  <div className="relative">
                    <RadioGroupItem 
                      value={plan.id.toString()} 
                      id={`plan-${plan.id}`} 
                      className="h-5 w-5"
                    />
                    {selectedPlanId === plan.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                      </div>
                    )}
                  </div>
                  <Label
                    htmlFor={`plan-${plan.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <p className="text-base font-medium">{plan.name}</p>
                        {plan.is_current && (
                          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                            {t("Current")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="mr-1.5 h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {getPriceForSelectedCycle(plan)} / {getDurationLabel().toLowerCase()}
                        </p>
                        {billingCycle === 'yearly' && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-orange-100 text-orange-800">
                            {t('Best Value')}
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}
                      {plan.features && plan.features.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-xs text-muted-foreground">
                              <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedPlanId || selectedPlanId === currentPlanId}
          >
            {t("Upgrade Plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}