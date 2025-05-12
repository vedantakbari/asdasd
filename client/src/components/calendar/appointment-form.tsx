import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAppointmentSchema, Appointment } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AppointmentFormProps {
  appointment?: Appointment;
  isEdit?: boolean;
  onClose: () => void;
  initialStartTime?: Date;
  initialEndTime?: Date;
  customerId?: number;
  dealId?: number;
  leadId?: number;
}

const formatDateToDateTimeLocal = (date?: Date | string): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const appointmentSchema = insertAppointmentSchema;
type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  appointment, 
  isEdit = false, 
  onClose,
  initialStartTime,
  initialEndTime,
  customerId,
  dealId,
  leadId
}) => {
  const { toast } = useToast();

  // Fetch customers for select dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Fetch leads for select dropdown
  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
  });

  // Fetch deals for select dropdown
  const { data: deals = [] } = useQuery({
    queryKey: ['/api/deals'],
  });

  // Set default values
  const defaultStartTime = initialStartTime || new Date();
  const defaultEndTime = initialEndTime || new Date(defaultStartTime.getTime() + 60 * 60 * 1000); // 1 hour later

  const defaultValues: Partial<AppointmentFormValues> = appointment
    ? {
        ...appointment,
        startTime: formatDateToDateTimeLocal(appointment.startTime),
        endTime: formatDateToDateTimeLocal(appointment.endTime),
      }
    : {
        title: '',
        startTime: formatDateToDateTimeLocal(defaultStartTime),
        endTime: formatDateToDateTimeLocal(defaultEndTime),
        location: '',
        description: '',
        customerId: customerId || undefined,
        leadId: leadId || undefined,
        dealId: dealId || undefined,
      };

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      return apiRequest('POST', '/api/appointments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create appointment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      return apiRequest('PATCH', `/api/appointments/${appointment?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
      toast({
        title: 'Success',
        description: 'Appointment updated successfully',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update appointment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!appointment?.id) return;
      return apiRequest('DELETE', `/api/appointments/${appointment.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
      toast({
        title: 'Success',
        description: 'Appointment deleted successfully',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete appointment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: AppointmentFormValues) {
    // Convert string dates to ISO strings
    const formattedValues = {
      ...values,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    };

    if (isEdit && appointment) {
      updateAppointmentMutation.mutate(formattedValues);
    } else {
      createAppointmentMutation.mutate(formattedValues);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Title*</FormLabel>
              <FormControl>
                <Input placeholder="Enter appointment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time*</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time*</FormLabel>
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
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter appointment location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
          
          <FormField
            control={form.control}
            name="leadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.name}
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
                <FormLabel>Deal</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {deals.map((deal: any) => (
                      <SelectItem key={deal.id} value={deal.id.toString()}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Textarea 
                  placeholder="Enter appointment description" 
                  {...field} 
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {isEdit && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => deleteAppointmentMutation.mutate()}
              disabled={deleteAppointmentMutation.isPending}
            >
              {deleteAppointmentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending || updateAppointmentMutation.isPending 
              ? 'Saving...' 
              : isEdit ? 'Update Appointment' : 'Create Appointment'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AppointmentForm;
