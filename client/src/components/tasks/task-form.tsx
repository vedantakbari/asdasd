import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertTaskSchema, Task, TaskPriority, TaskStatus, TaskActionType } from '@shared/schema';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Calendar, FileText, CreditCard, PlusCircle } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  isEdit?: boolean;
  onSuccess?: () => void;
  inline?: boolean;
}

const formatDateToDateLocal = (date?: Date | string): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const taskSchema = insertTaskSchema;
type TaskFormValues = z.infer<typeof taskSchema>;

const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  isEdit = false, 
  onSuccess,
  inline = false
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch users for assignee dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    // If this fails, it will just show an empty dropdown which is fine for now
    enabled: false,
  });

  // Fetch leads, deals, and customers for related entity dropdowns
  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['/api/deals'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // For storing custom action types that the user has created
  const [customActionTypes, setCustomActionTypes] = useState<string[]>([]);
  // For when user wants to create a new custom action type
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newCustomType, setNewCustomType] = useState('');

  // Load saved custom action types on component mount
  useEffect(() => {
    const savedCustomTypes = localStorage.getItem('customActionTypes');
    if (savedCustomTypes) {
      setCustomActionTypes(JSON.parse(savedCustomTypes));
    }
  }, []);
  
  const defaultValues: Partial<TaskFormValues> = task
    ? {
        ...task,
        dueDate: task.dueDate ? formatDateToDateLocal(task.dueDate) : undefined,
        scheduledFor: task.scheduledFor ? formatDateToDateLocal(task.scheduledFor) : undefined,
      }
    : {
        title: '',
        description: '',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        actionType: TaskActionType.FOLLOW_UP_EMAIL, // Default action type
        customActionType: '',
        dueDate: formatDateToDateLocal(new Date(Date.now() + 86400000)), // tomorrow
        scheduledFor: formatDateToDateLocal(new Date(Date.now() + 3600000)), // in 1 hour
        assigneeId: 1, // Default to admin user for now
        relatedLeadId: undefined,
        relatedDealId: undefined,
        relatedCustomerId: undefined,
        addToCalendar: true, // Default to add to calendar
      };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      return apiRequest('POST', '/api/tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/tasks');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      return apiRequest('PATCH', `/api/tasks/${task?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}`] });
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/tasks');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Function to save a new custom action type
  const saveCustomActionType = () => {
    if (newCustomType && !customActionTypes.includes(newCustomType)) {
      const updatedTypes = [...customActionTypes, newCustomType];
      setCustomActionTypes(updatedTypes);
      localStorage.setItem('customActionTypes', JSON.stringify(updatedTypes));
      setNewCustomType('');
      setIsAddingCustomType(false);
      
      // Update the form with the new custom action type
      form.setValue('actionType', TaskActionType.CUSTOM);
      form.setValue('customActionType', newCustomType);
    }
  };

  // Watch for actionType changes to show custom type field when needed
  const actionType = form.watch('actionType');

  function onSubmit(values: TaskFormValues) {
    // Format dates if provided
    const formattedValues = {
      ...values,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      scheduledFor: values.scheduledFor ? new Date(values.scheduledFor).toISOString() : undefined,
    };
    
    // Generate a title based on action type if not provided
    if (!formattedValues.title || formattedValues.title.trim() === '') {
      let actionName = '';
      
      if (formattedValues.actionType === TaskActionType.CUSTOM && formattedValues.customActionType) {
        actionName = formattedValues.customActionType;
      } else if (formattedValues.actionType) {
        // Convert snake_case to Title Case
        actionName = formattedValues.actionType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      // Get the related entity name (lead, deal, customer)
      let entityName = '';
      if (formattedValues.relatedLeadId && leads) {
        const lead = leads.find((l: any) => l.id === formattedValues.relatedLeadId);
        if (lead) entityName = lead.name;
      } else if (formattedValues.relatedCustomerId && customers) {
        const customer = customers.find((c: any) => c.id === formattedValues.relatedCustomerId);
        if (customer) entityName = customer.name;
      }
      
      formattedValues.title = entityName ? 
        `${actionName} for ${entityName}` : 
        actionName || 'Untitled Task';
    }

    // If this task should be added to the calendar and it has a scheduled time,
    // we could create a calendar event here (or set a flag for backend to do it)

    if (isEdit && task) {
      updateTaskMutation.mutate(formattedValues as any);
    } else {
      createTaskMutation.mutate(formattedValues as any);
    }
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title or leave blank for auto-generation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Type Selection */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="actionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action Type*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TaskActionType.FOLLOW_UP_EMAIL}>
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Follow Up Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskActionType.SCHEDULE_APPOINTMENT}>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Schedule Appointment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskActionType.SEND_QUOTE}>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Send Quote</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskActionType.SEND_INVOICE}>
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Send Invoice</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskActionType.CUSTOM}>
                      <div className="flex items-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Custom Action</span>
                      </div>
                    </SelectItem>
                    
                    {/* Show saved custom action types */}
                    {customActionTypes.length > 0 && (
                      <>
                        <div className="py-2 px-2 text-xs text-gray-500 border-t">Saved Custom Actions</div>
                        {customActionTypes.map((type, idx) => (
                          <SelectItem key={idx} value={`custom:${type}`}>
                            {type}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Custom Action Type Field */}
          {(actionType === TaskActionType.CUSTOM || actionType?.startsWith('custom:')) && (
            <div className="pl-4 border-l-2 border-primary-100">
              {isAddingCustomType ? (
                <div className="space-y-2">
                  <FormLabel>New Custom Action Type</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new action type"
                      value={newCustomType}
                      onChange={(e) => setNewCustomType(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={saveCustomActionType}
                      disabled={!newCustomType}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingCustomType(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : actionType?.startsWith('custom:') ? (
                <FormField
                  control={form.control}
                  name="customActionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Action Type</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || actionType.substring(7)}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : (
                <div className="flex flex-col space-y-2">
                  <FormField
                    control={form.control}
                    name="customActionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Action Type</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter custom action type"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="self-start text-xs"
                    onClick={() => setIsAddingCustomType(true)}
                  >
                    <PlusCircle className="mr-1 h-3 w-3" />
                    Save for future use
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scheduling Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduledFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled For*</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Add to Calendar Option */}
        <FormField
          control={form.control}
          name="addToCalendar"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Add to Calendar</FormLabel>
                <p className="text-sm text-gray-500">
                  Creates a calendar event for this task at the scheduled time
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
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
                  placeholder="Enter task description" 
                  {...field} 
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Michael Scott (Admin)</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
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
            name="relatedLeadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Lead</FormLabel>
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
                    <SelectItem value="none_lead">None</SelectItem>
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
            name="relatedDealId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Deal</FormLabel>
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
                    <SelectItem value="none_deal">None</SelectItem>
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => inline ? onSuccess?.() : navigate('/tasks')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
          >
            {createTaskMutation.isPending || updateTaskMutation.isPending 
              ? 'Saving...' 
              : isEdit ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (inline) {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
};

export default TaskForm;
