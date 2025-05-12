import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertCustomerSchema, Customer } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

type CustomerFormProps = {
  customer?: Customer;
  isEdit?: boolean;
};

const customerSchema = insertCustomerSchema;
type CustomerFormValues = z.infer<typeof customerSchema>;

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, isEdit = false }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const defaultValues: Partial<CustomerFormValues> = {
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    notes: ''
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || defaultValues,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      return apiRequest('POST', '/api/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });
      navigate('/customers');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create customer: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      return apiRequest('PATCH', `/api/customers/${customer?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customer?.id}`] });
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
      navigate('/customers');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update customer: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: CustomerFormValues) {
    if (isEdit && customer) {
      updateCustomerMutation.mutate(values);
    } else {
      createCustomerMutation.mutate(values);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional information about the customer..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate('/customers')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}>
              {createCustomerMutation.isPending || updateCustomerMutation.isPending ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default CustomerForm;
