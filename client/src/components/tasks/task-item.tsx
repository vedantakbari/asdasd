import React from 'react';
import { Task, TaskPriority, TaskStatus, TaskActionType } from '@shared/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, CheckCircle, Clock, Mail, FileText, CreditCard, MoreVertical, Pencil, Trash, UserCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
  showRelatedEntity?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onEdit,
  showRelatedEntity = true
}) => {
  const { toast } = useToast();

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest('PATCH', `/api/tasks/${task.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Success',
        description: 'Task status updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update task status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const markAsCompleted = () => {
    updateStatusMutation.mutate(TaskStatus.COMPLETED);
  };

  const markAsInProgress = () => {
    updateStatusMutation.mutate(TaskStatus.IN_PROGRESS);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate();
    }
  };

  const renderActionTypeIcon = () => {
    switch (task.actionType) {
      case TaskActionType.FOLLOW_UP_EMAIL:
        return <Mail className="h-4 w-4 mr-2" />;
      case TaskActionType.SCHEDULE_APPOINTMENT:
        return <Calendar className="h-4 w-4 mr-2" />;
      case TaskActionType.SEND_QUOTE:
        return <FileText className="h-4 w-4 mr-2" />;
      case TaskActionType.SEND_INVOICE:
        return <CreditCard className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatActionType = (actionType: string | null, customType: string | null): string => {
    if (actionType === TaskActionType.CUSTOM && customType) {
      return customType;
    } else if (actionType) {
      // Convert snake_case to Title Case
      return actionType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Task';
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  const isScheduledSoon = task.scheduledFor && 
    new Date(task.scheduledFor) > new Date() && 
    new Date(task.scheduledFor) < new Date(Date.now() + 24 * 60 * 60 * 1000); // Within 24 hours

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={getPriorityColor()}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor()}>
                {task.status}
              </Badge>
              {isOverdue && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Overdue
                </Badge>
              )}
              {isScheduledSoon && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Coming Up
                </Badge>
              )}
              {task.addToCalendar && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  Calendar Event
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit && onEdit(task)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={markAsInProgress}>
                <Clock className="h-4 w-4 mr-2" /> Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={markAsCompleted}>
                <CheckCircle className="h-4 w-4 mr-2" /> Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-4">
              {renderActionTypeIcon()}
              <span>{formatActionType(task.actionType, task.customActionType)}</span>
            </div>
          </div>
          
          {task.scheduledFor && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {format(new Date(task.scheduledFor), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          )}
        </div>

        {showRelatedEntity && (
          <div className="mt-2 text-sm text-gray-500">
            {task.relatedLeadId && (
              <div className="flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                <span>Related to Lead #{task.relatedLeadId}</span>
              </div>
            )}
            {task.relatedCustomerId && (
              <div className="flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                <span>Related to Customer #{task.relatedCustomerId}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full text-xs text-gray-500">
          <div>
            {task.dueDate && (
              <span>
                Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <div>
            Assignee: #{task.assigneeId || 'Unassigned'}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskItem;