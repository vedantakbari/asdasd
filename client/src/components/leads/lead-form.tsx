import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertLeadSchema, Lead, LeadStatus } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

type LeadFormProps = {
  lead?: Lead;
  isEdit?: boolean;
  isClient?: boolean;
};

const leadSchema = insertLeadSchema.extend({
  value: z.string().optional().transform(val => (val === '' ? undefined : parseFloat(val))),
  isClient: z.boolean().optional(),
  kanbanLane: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const LeadForm: React.FC<LeadFormProps> = ({ lead, isEdit = false, isClient = false }) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check URL for isClient parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isClientParam = urlParams.get('isClient') === 'true' || isClient;
  const queryClient = useQueryClient();

  const defaultValues: Partial<LeadFormValues> = lead
    ? {
        ...lead,
        value: lead.value !== null ? String(lead.value) : '',
      }
    : {
        status: isClientParam ? LeadStatus.CLIENT : LeadStatus.NEW,
        isClient: isClientParam,
        kanbanLane: isClientParam ? 'NEW_CLIENT' : undefined,
        source: '',
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        value: '',
        nextActivity: '',
        nextActivityDate: '',
      };

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      return apiRequest('POST', '/api/leads', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/clients'] });
      toast({
        title: 'Success',
        description: isClientParam ? 'Client created successfully' : 'Lead created successfully',
      });
      navigate(isClientParam ? '/clients' : '/leads');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create ${isClientParam ? 'client' : 'lead'}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      return apiRequest('PATCH', `/api/leads/${lead?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}`] });
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
      navigate('/leads');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update lead: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: LeadFormValues) {
    if (isEdit && lead) {
      updateLeadMutation.mutate(values);
    } else {
      createLeadMutation.mutate(values);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Lead' : 'Create New Lead'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Anytown, CA 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Website, Referral, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeadStatus.NEW}>New</SelectItem>
                        <SelectItem value={LeadStatus.CONTACTED}>Contacted</SelectItem>
                        <SelectItem value={LeadStatus.QUALIFIED}>Qualified</SelectItem>
                        <SelectItem value={LeadStatus.PROPOSAL}>Proposal</SelectItem>
                        <SelectItem value={LeadStatus.WON}>Won</SelectItem>
                        <SelectItem value={LeadStatus.LOST}>Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value ($)</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nextActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Activity</FormLabel>
                    <FormControl>
                      <Input placeholder="Follow-up call, Send proposal, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextActivityDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Activity Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details about this lead..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate('/leads')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLeadMutation.isPending || updateLeadMutation.isPending}>
              {createLeadMutation.isPending || updateLeadMutation.isPending ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default LeadForm;
