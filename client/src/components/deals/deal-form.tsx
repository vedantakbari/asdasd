import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertDealSchema, Deal, DealStage } from '@shared/schema';
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

type DealFormProps = {
  deal?: Deal;
  isEdit?: boolean;
  leadId?: number;
};

const dealSchema = insertDealSchema.extend({
  value: z.string().transform(val => parseFloat(val)),
  startDate: z.string().optional().transform(val => val === '' ? undefined : val),
  endDate: z.string().optional().transform(val => val === '' ? undefined : val),
  customerId: z.number(),
});

type DealFormValues = z.infer<typeof dealSchema>;

const DealForm: React.FC<DealFormProps> = ({ deal, isEdit = false, leadId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch customers for select dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Fetch lead data if converting from lead
  const { data: lead } = useQuery({
    queryKey: leadId ? [`/api/leads/${leadId}`] : null,
    enabled: !!leadId
  });

  const defaultValues: Partial<DealFormValues> = {
    title: '',
    value: '0',
    stage: DealStage.PLANNING,
    customerId: undefined,
    description: '',
    startDate: '',
    endDate: '',
  };

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: deal
      ? {
          ...deal,
          value: String(deal.value),
          startDate: deal.startDate ? new Date(deal.startDate).toISOString().split('T')[0] : undefined,
          endDate: deal.endDate ? new Date(deal.endDate).toISOString().split('T')[0] : undefined,
        }
      : defaultValues,
  });

  // If converting from lead, pre-fill the form
  useEffect(() => {
    if (lead && !isEdit) {
      // Set form values from lead
      form.setValue('title', lead.name ? `Project for ${lead.name}` : 'New Project');
      form.setValue('value', lead.value ? String(lead.value) : '0');
      form.setValue('description', lead.notes || '');
      
      // If we have customers, try to find a matching one or set to the first one
      if (customers.length > 0) {
        // Try to find a customer with matching name/email to the lead
        const matchingCustomer = customers.find(
          (c: any) => c.name === lead.name || c.email === lead.email
        );
        
        if (matchingCustomer) {
          form.setValue('customerId', matchingCustomer.id);
        } else {
          // Default to first customer if no match found
          form.setValue('customerId', customers[0].id);
        }
      }
    }
  }, [lead, form, isEdit, customers]);

  const createDealMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      return apiRequest('POST', '/api/deals', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
      navigate('/deals');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create deal: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      return apiRequest('PATCH', `/api/deals/${deal?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${deal?.id}`] });
      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
      navigate('/deals');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update deal: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: DealFormValues) {
    if (isEdit && deal) {
      updateDealMutation.mutate(values);
    } else {
      createDealMutation.mutate(values);
      
      // If converting from lead, you might want to update the lead status to 'won'
      if (leadId) {
        apiRequest('PATCH', `/api/leads/${leadId}`, { status: 'won' })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
          })
          .catch(error => {
            console.error('Failed to update lead status:', error);
          });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Deal' : leadId ? 'Convert Lead to Deal' : 'Create New Deal'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Kitchen Remodel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer*</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer: any) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value ($)*</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={DealStage.PLANNING}>Planning</SelectItem>
                        <SelectItem value={DealStage.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={DealStage.INSTALLATION}>Installation</SelectItem>
                        <SelectItem value={DealStage.REVIEW}>Review</SelectItem>
                        <SelectItem value={DealStage.COMPLETED}>Completed</SelectItem>
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Project details, notes, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate('/deals')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDealMutation.isPending || updateDealMutation.isPending}>
              {createDealMutation.isPending || updateDealMutation.isPending ? 'Saving...' : isEdit ? 'Update Deal' : 'Create Deal'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default DealForm;
