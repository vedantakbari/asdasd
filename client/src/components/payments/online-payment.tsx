import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import StripePayment from './stripe-payment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnlinePaymentProps {
  amount: number;
  customerId: number;
  dealId?: number;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const OnlinePayment: React.FC<OnlinePaymentProps> = ({
  amount,
  customerId,
  dealId,
  description,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Check if Stripe is configured
    const checkStripeStatus = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/stripe-status');
        const data = await response.json();
        setStripeConfigured(data.configured);
        
        // If Stripe is configured, create a payment intent
        if (data.configured) {
          try {
            const intentResponse = await apiRequest('POST', '/api/create-payment-intent', {
              amount,
              customerId,
              dealId,
              description
            });
            
            const intentData = await intentResponse.json();
            setClientSecret(intentData.clientSecret);
          } catch (err) {
            console.error('Error creating payment intent:', err);
            setError('Failed to initialize payment. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error checking Stripe status:', err);
        setError('Failed to check payment configuration. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkStripeStatus();
  }, [amount, customerId, dealId, description]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
          <CardDescription>There was a problem initializing the payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onCancel}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use placeholder component since we don't have Stripe configured yet
  return (
    <StripePayment
      amount={amount}
      dealId={dealId}
      customerId={customerId}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};

export default OnlinePayment;