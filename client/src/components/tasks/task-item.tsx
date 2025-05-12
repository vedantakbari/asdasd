import React from 'react';
import { Task, TaskStatus } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { useLocation } from 'wouter';

interface TaskItemProps {
  task: Task;
  onEdit?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit }) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tasks/${id}`);
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

  const handleToggleComplete = () => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/tasks/${task.id}/edit`);
    }
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate(task.id);
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'task-priority-high';
      case 'medium':
        return 'task-priority-medium';
      case 'low':
        return 'task-priority-low';
      default:
        return 'task-priority-medium';
    }
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return 'Due today';
    } else if (isTomorrow(date)) {
      return 'Due tomorrow';
    } else if (isPast(date)) {
      return `Overdue by ${Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))} days`;
    } else {
      const daysFromNow = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysFromNow <= 7) {
        return `Due in ${daysFromNow} days`;
      } else {
        return `Due on ${format(date, 'MMM d, yyyy')}`;
      }
    }
  };

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return 'text-gray-500';
    
    const date = new Date(dueDate);
    
    if (isPast(date)) {
      return 'text-red-500';
    } else if (isToday(date) || isTomorrow(date)) {
      return 'text-amber-500';
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <li className={`px-6 py-4 border-b border-gray-100 ${task.status === TaskStatus.COMPLETED ? 'bg-gray-50' : ''}`}>
      <div className="flex items-center">
        <Checkbox 
          id={`task-${task.id}`}
          checked={task.status === TaskStatus.COMPLETED}
          onCheckedChange={handleToggleComplete}
          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label 
          htmlFor={`task-${task.id}`}
          className={`ml-3 block text-sm font-medium ${
            task.status === TaskStatus.COMPLETED 
              ? 'text-gray-400 line-through' 
              : 'text-gray-700'
          }`}
        >
          {task.title}
        </label>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-1 ml-7">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {task.status === TaskStatus.COMPLETED ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-400">Completed</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className={`mr-1 h-3 w-3 ${getDueDateColor(task.dueDate)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={getDueDateColor(task.dueDate)}>
                {formatDueDate(task.dueDate)}
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className={getPriorityClass(task.priority)}>{task.priority} Priority</span>
            </>
          )}
          {task.description && (
            <>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-gray-500 truncate max-w-xs">{task.description}</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default TaskItem;
