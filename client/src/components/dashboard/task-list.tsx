import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Task, TaskPriority } from '@shared/schema';
import { Link } from 'wouter';
import { format } from 'date-fns';

const TaskList: React.FC = () => {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'status-pill status-new';
      case TaskPriority.MEDIUM:
        return 'status-pill status-new';
      case TaskPriority.LOW:
        return 'status-pill status-new';
      default:
        return 'status-pill status-new';
    }
  };

  const getDueDisplay = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDateTime = new Date(dueDate);
    dueDateTime.setHours(0, 0, 0, 0);
    
    if (dueDateTime.getTime() === today.getTime()) {
      return 'Due today';
    } else if (dueDateTime.getTime() === tomorrow.getTime()) {
      return 'Due tomorrow';
    } else if (dueDateTime < today) {
      return `Overdue by ${Math.floor((today.getTime() - dueDateTime.getTime()) / (1000 * 60 * 60 * 24))} days`;
    } else {
      return `Due in ${Math.floor((dueDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days`;
    }
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">Tasks</CardTitle>
          <button 
            type="button" 
            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </CardHeader>
      
      {isLoading ? (
        <div className="divide-y divide-gray-200">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="animate-pulse flex space-x-3">
                <div className="rounded-full bg-gray-200 h-4 w-4"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tasks.slice(0, 4).map((task: Task) => (
            <li key={task.id} className="px-6 py-4">
              <div className="flex items-center">
                <Checkbox 
                  id={`task-${task.id}`}
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label 
                  htmlFor={`task-${task.id}`}
                  className={`ml-3 block text-sm font-medium ${
                    task.status === 'completed' 
                      ? 'text-gray-400 line-through' 
                      : 'text-gray-700'
                  }`}
                >
                  {task.title}
                </label>
              </div>
              <div className="mt-1 ml-7">
                <div className="flex items-center text-xs text-gray-500">
                  {task.status === 'completed' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-400">Completed</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{getDueDisplay(task.dueDate)}</span>
                      <span className="mx-2">•</span>
                      <span className={getPriorityClass(task.priority)}>{task.priority} Priority</span>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <CardFooter className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <Link href="/tasks">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all tasks
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default TaskList;
