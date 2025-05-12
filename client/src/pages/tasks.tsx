import React, { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import TaskForm from '@/components/tasks/task-form';
import TaskItem from '@/components/tasks/task-item';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle, Clock, Mail, FileText, CreditCard, PlusCircle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskActionType } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

const Tasks: React.FC = () => {
  const [location] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [actionTypeFilter, setActionTypeFilter] = useState<string | null>(null);
  const [customActionTypes, setCustomActionTypes] = useState<string[]>([]);
  
  // Load saved custom action types on component mount
  useEffect(() => {
    const savedCustomTypes = localStorage.getItem('customActionTypes');
    if (savedCustomTypes) {
      setCustomActionTypes(JSON.parse(savedCustomTypes));
    }
  }, []);
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });
  
  // Filter tasks based on search term, status, priority, and action type
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter ? task.status === statusFilter : true;
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    
    let matchesActionType = true;
    if (actionTypeFilter) {
      if (actionTypeFilter === 'custom') {
        // For custom action types, check if the task uses any custom action
        matchesActionType = task.actionType === TaskActionType.CUSTOM;
      } else if (actionTypeFilter === 'scheduled') {
        // For scheduled tasks, check if they have a scheduled time
        matchesActionType = !!task.scheduledFor;
      } else if (actionTypeFilter === 'calendar') {
        // For calendar tasks, check if they're added to the calendar
        matchesActionType = !!task.addToCalendar;
      } else {
        // For standard action types, check if the action type matches
        matchesActionType = task.actionType === actionTypeFilter;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesActionType;
  });
  
  // Group tasks by status
  const todoTasks = filteredTasks.filter((task: Task) => task.status === TaskStatus.TODO);
  const inProgressTasks = filteredTasks.filter((task: Task) => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = filteredTasks.filter((task: Task) => task.status === TaskStatus.COMPLETED);
  
  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateDialogOpen(true);
  };
  
  // Close dialog and reset selected task
  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setTimeout(() => setEditingTask(null), 300); // wait for dialog animation to finish
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Tasks" 
        description="Manage your tasks and to-dos"
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select 
              value={statusFilter || ''} 
              onValueChange={(value) => setStatusFilter(value || null)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All Statuses</SelectItem>
                <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={priorityFilter || ''} 
              onValueChange={(value) => setPriorityFilter(value || null)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_priorities">All Priorities</SelectItem>
                <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={actionTypeFilter || ''} 
              onValueChange={(value) => setActionTypeFilter(value || null)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_action_types">All Action Types</SelectItem>
                
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
                
                <SelectItem value="custom">
                  <div className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Custom Action</span>
                  </div>
                </SelectItem>
                
                <SelectItem value="scheduled">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Scheduled</span>
                  </div>
                </SelectItem>
                
                <SelectItem value="calendar">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Calendar Events</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
              </CardHeader>
              {isLoading ? (
                <CardContent className="flex justify-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                </CardContent>
              ) : filteredTasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredTasks.map((task: Task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onEdit={() => handleEditTask(task)}
                    />
                  ))}
                </ul>
              ) : (
                <CardContent className="text-center py-6">
                  <p className="text-gray-500">No tasks found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    Create your first task
                  </Button>
                </CardContent>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="todo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>To Do ({todoTasks.length})</CardTitle>
              </CardHeader>
              {isLoading ? (
                <CardContent className="flex justify-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                </CardContent>
              ) : todoTasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {todoTasks.map((task: Task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onEdit={() => handleEditTask(task)}
                    />
                  ))}
                </ul>
              ) : (
                <CardContent className="text-center py-6">
                  <p className="text-gray-500">No to-do tasks found.</p>
                </CardContent>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>In Progress ({inProgressTasks.length})</CardTitle>
              </CardHeader>
              {isLoading ? (
                <CardContent className="flex justify-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                </CardContent>
              ) : inProgressTasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {inProgressTasks.map((task: Task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onEdit={() => handleEditTask(task)}
                    />
                  ))}
                </ul>
              ) : (
                <CardContent className="text-center py-6">
                  <p className="text-gray-500">No in-progress tasks found.</p>
                </CardContent>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed ({completedTasks.length})</CardTitle>
              </CardHeader>
              {isLoading ? (
                <CardContent className="flex justify-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                </CardContent>
              ) : completedTasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {completedTasks.map((task: Task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onEdit={() => handleEditTask(task)}
                    />
                  ))}
                </ul>
              ) : (
                <CardContent className="text-center py-6">
                  <p className="text-gray-500">No completed tasks found.</p>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Create/Edit Task Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>
            <TaskForm 
              task={editingTask || undefined}
              isEdit={!!editingTask}
              onSuccess={handleCloseDialog}
              inline
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default Tasks;
