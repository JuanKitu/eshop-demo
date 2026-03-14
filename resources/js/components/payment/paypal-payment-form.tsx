import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';

interface PayPalPaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: string;
  paypalClientId: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PayPalPaymentForm({ 
  planId, 
  planPrice,
  couponCode, 
  billingCycle, 
  paypalClientId,
  currency,
  onSuccess, 
  onCancel 
}: PayPalPaymentFormProps) {
  const { t } = useTranslation();
  const paypalRef = useRef<HTMLDivElement>(null);
  
  const { processPayment } = usePaymentProcessor({
    onSuccess,
    onError: (error) => toast.error(error)
  });

  useEffect(() => {
    if (!paypalClientId || !paypalRef.current) return;

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency.toUpperCase()}&disable-funding=credit,card`;
    script.async = true;
    
    script.onload = () => {
      if (window.paypal && paypalRef.current) {
        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            // Hide parent modal temporarily and enable pointer events on body
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => {
              (overlay as HTMLElement).style.display = 'none';
            });
            document.body.style.pointerEvents = 'auto';
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: planPrice.toString(),
                  currency_code: currency.toUpperCase()
                }
              }]
            });
          },
          onApprove: (data: any, actions: any) => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => {
              (overlay as HTMLElement).style.display = '';
            });
            document.body.style.pointerEvents = '';
            return actions.order.capture().then((details: any) => {
              processPayment('paypal', {
                planId,
                billingCycle,
                couponCode,
                paymentMethod: 'paypal',
                order_id: data.orderID,
                payment_id: details.id,
              });
            });
          },
          onError: (err: any) => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => {
              (overlay as HTMLElement).style.display = '';
            });
            document.body.style.pointerEvents = '';
            console.error('PayPal error:', err);
            if (err.message && err.message.includes('declined')) {
              toast.error(t('Card was declined. Please try a different payment method.'));
            } else {
              toast.error(t('Payment failed. Please try again.'));
            }
          },
          onCancel: () => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => {
              (overlay as HTMLElement).style.display = '';
            });
            document.body.style.pointerEvents = '';
            onCancel();
          }
        }).render(paypalRef.current);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [paypalClientId, planId, billingCycle, couponCode, currency]);

  if (!paypalClientId) {
    return <div className="p-4 text-center text-red-500">{t('PayPal not configured')}</div>;
  }

  return (
    <div className="space-y-4">
      <div ref={paypalRef}></div>
    </div>
  );
}

// Extend window object for PayPal
declare global {
  interface Window {
    paypal?: any;
  }
}