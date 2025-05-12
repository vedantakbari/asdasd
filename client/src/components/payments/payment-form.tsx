import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertPaymentSchema, Payment } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import OnlinePayment from './online-payment';

interface PaymentFormProps {
  payment?: Payment;
  isEdit?: boolean;
  dealId?: number;
  customerId?: number;
  onSuccess?: () => void;
}

const paymentSchema = insertPaymentSchema.extend({
  amount: z.string().transform(val => parseFloat(val)),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
  dealId: z.number().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  payment, 
  isEdit = false, 
  dealId, 
  customerId,
  onSuccess 
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showOnlinePayment, setShowOnlinePayment] = useState(false);
  const [paymentData, setPaymentData] = useState<{ amount: number; customerId: number; dealId?: number; description?: string } | null>(null);

  // Fetch customers for select dropdown
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch deals for select dropdown
  const { data: deals = [] } = useQuery<any[]>({
    queryKey: ['/api/deals'],
  });

  const defaultValues: Partial<PaymentFormValues> = payment
    ? {
        amount: payment.amount.toString(),
        method: payment.method,
        status: payment.status,
        dealId: payment.dealId ? Number(payment.dealId) : undefined,
        customerId: payment.customerId,
        description: payment.description || '',
        receiptUrl: payment.receiptUrl || '',
      }
    : {
        amount: '',
        method: 'Credit Card',
        status: 'paid',
        dealId: dealId,
        customerId: customerId || 0,
        description: '',
        receiptUrl: '',
      };

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return apiRequest('POST', '/api/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/payments');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create payment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: PaymentFormValues) {
    // If the payment method is "Online Payment", show the online payment component
    if (values.method === 'Online Payment') {
      setPaymentData({
        amount: parseFloat(values.amount as unknown as string),
        customerId: values.customerId,
        dealId: values.dealId,
        description: values.description
      });
      setShowOnlinePayment(true);
    } else {
      // Otherwise, just create the payment record
      createPaymentMutation.mutate(values);
    }
  }
  
  const handleOnlinePaymentSuccess = () => {
    // After online payment is successful, create a payment record
    if (paymentData) {
      const paymentValues = {
        ...form.getValues(),
        amount: paymentData.amount,
        method: 'Credit Card (Online)',
        status: 'paid',
      };
      createPaymentMutation.mutate(paymentValues);
    }
  };

  // If showing the online payment form
  if (showOnlinePayment && paymentData) {
    return (
      <OnlinePayment
        amount={paymentData.amount}
        customerId={paymentData.customerId}
        dealId={paymentData.dealId}
        description={paymentData.description}
        onSuccess={handleOnlinePaymentSuccess}
        onCancel={() => setShowOnlinePayment(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Payment' : 'Process New Payment'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)*</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Online Payment">Online Payment</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer*</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                      disabled={!!customerId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(customers) && customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dealId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Deal</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ""}
                      disabled={!!dealId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select deal (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {Array.isArray(deals) && deals
                          .filter((deal) => !customerId || deal.customerId === customerId)
                          .map((deal) => (
                            <SelectItem key={deal.id} value={deal.id.toString()}>
                              {deal.title} (${deal.value})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Payment description or notes" 
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/receipts/123" 
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('method') === 'Online Payment' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-blue-800 font-medium mb-2">💳 Online Payment</p>
                <p className="text-blue-700 text-sm">
                  When you click "Process Payment", you'll be taken to a secure payment form where the customer can enter their payment details.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => onSuccess ? onSuccess() : navigate('/payments')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default PaymentForm;
