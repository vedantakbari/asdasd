import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, KanbanLane, Pipeline, Activity as ActivityType } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Phone, 
  Mail, 
  MoreVertical, 
  Filter, 
  CalendarPlus,
  PencilLine,
  DollarSign,
  History,
  Activity,
  MessageSquare,
  Calendar,
  CheckCircle,
  MailPlus,
  ListPlus,
  CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface KanbanColumn {
  id: string;
  title: string;
  items: Lead[];
}

interface DetailModalState {
  isOpen: boolean;
  client: Lead | null;
}

// Activity History Component
const ActivityHistory = ({ clientId }: { clientId: number }) => {
  // Fetch activities related to this client
  const { data: activities = [], isLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activities', clientId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/activities/entity/lead/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      return await response.json();
    },
    // If the API doesn't exist yet, just return empty array
    onError: () => {
      return [];
    }
  });

  if (isLoading) {
    return <div className="py-2 text-sm text-gray-500">Loading activity history...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic mt-2">No activity history yet</div>
    );
  }

  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'email_initiated':
        return <MailPlus className="h-4 w-4 text-blue-400" />;
      case 'note_added':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'task_completed': 
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'task_created':
        return <ListPlus className="h-4 w-4 text-indigo-500" />;
      case 'appointment_scheduled':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'call_completed':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format the display of activity details based on type
  const getActivityDetails = (activity: ActivityType) => {
    // Render different activity types differently
    if (activity.activityType === 'email_sent' && activity.metadata) {
      // If this is an email activity and has metadata
      const metadata = activity.metadata as any;
      
      return (
        <>
          <p className="text-sm font-medium">{activity.description}</p>
          {metadata?.subject && (
            <div className="bg-gray-50 text-xs p-2 rounded mt-1 border border-gray-100">
              <p className="text-gray-700"><span className="font-medium">Subject:</span> {metadata.subject}</p>
              {metadata.preview && (
                <p className="text-gray-500 mt-1 line-clamp-2">{metadata.preview}</p>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {format(new Date(activity.createdAt), 'MMMM d, yyyy h:mm a')}
          </p>
        </>
      );
    }
    
    // Default rendering for other activity types
    return (
      <>
        <p className="text-sm font-medium">{activity.description}</p>
        <p className="text-xs text-gray-500">
          {format(new Date(activity.createdAt), 'MMMM d, yyyy h:mm a')}
        </p>
      </>
    );
  };
  
  return (
    <div className="space-y-4 mt-2">
      <h3 className="font-semibold text-sm mb-2">
        Activity History <span className="text-gray-500 font-normal">({activities.length})</span>
      </h3>
      
      {activities.map((activity, index) => (
        <div key={index} className="relative">
          <div className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-indigo-400"></div>
          <div className="flex items-start">
            <div className="mr-2 mt-0.5">
              {getActivityIcon(activity.activityType)}
            </div>
            <div className="flex-1">
              {getActivityDetails(activity)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Clients: React.FC = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [draggingClient, setDraggingClient] = useState<Lead | null>(null);
  const [location] = useLocation();
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [renameLaneDialog, setRenameLaneDialog] = useState<{isOpen: boolean, pipelineId: number | null, laneId: string | null, currentName: string}>({
    isOpen: false,
    pipelineId: null,
    laneId: null,
    currentName: ''
  });
  const [newLaneName, setNewLaneName] = useState('');
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    isOpen: false,
    client: null
  });
  const [createPipelineDialog, setCreatePipelineDialog] = useState<boolean>(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // If on the new client page, redirect to the leads form with isClient=true
  if (location === '/clients/new') {
    window.location.href = '/leads/new?isClient=true';
    return null;
  }
  
  // Fetch clients (leads with isClient = true)
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Lead[]>({
    queryKey: ['/api/leads/clients'],
  });
  
  // Fetch pipelines
  const { data: pipelines = [], isLoading: isLoadingPipelines } = useQuery<Pipeline[]>({
    queryKey: ['/api/pipelines'],
  });
  
  // Fetch the default pipeline
  const { data: defaultPipeline, isLoading: isLoadingDefaultPipeline } = useQuery<Pipeline>({
    queryKey: ['/api/pipelines/default'],
    onSuccess: (data) => {
      if (data && selectedPipelineId === null) {
        setSelectedPipelineId(data.id);
      }
    },
    // Don't show error if no default pipeline exists
    onError: () => {}
  });
  
  // Use selected pipeline or default pipeline or first pipeline
  useEffect(() => {
    if (!selectedPipelineId && pipelines.length > 0) {
      // If default pipeline exists, use it
      const defaultPipe = pipelines.find(p => p.isDefault);
      if (defaultPipe) {
        setSelectedPipelineId(defaultPipe.id);
      } else if (pipelines[0]) {
        // Otherwise use the first pipeline
        setSelectedPipelineId(pipelines[0].id);
      }
    }
  }, [pipelines, selectedPipelineId]);
  
  // Mutation for moving clients between lanes
  const moveClientMutation = useMutation({
    mutationFn: async ({clientId, laneId, pipelineId}: {clientId: number, laneId: string, pipelineId?: number}) => {
      return apiRequest('PATCH', `/api/clients/${clientId}/move`, { laneId, pipelineId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads/clients'] });
      toast({
        title: "Success",
        description: "Client moved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to move client. Please try again.",
        variant: "destructive"
      });
      console.error("Error moving client:", error);
    }
  });
  
  // Mutation for creating a new pipeline
  const createPipelineMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/pipelines', {
        name,
        description: `Pipeline for ${name}`,
        lanes: Object.values(KanbanLane).map(lane => ({
          id: lane,
          name: lane
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }))
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
      setSelectedPipelineId(data.id);
      setCreatePipelineDialog(false);
      setNewPipelineName('');
      toast({
        title: "Success",
        description: "New pipeline created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create pipeline. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating pipeline:", error);
    }
  });
  
  // Mutation for renaming a lane
  const renameLaneMutation = useMutation({
    mutationFn: async ({pipelineId, laneId, name}: {pipelineId: number, laneId: string, name: string}) => {
      return apiRequest('PATCH', `/api/pipelines/${pipelineId}/lanes/${laneId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
      setRenameLaneDialog({isOpen: false, pipelineId: null, laneId: null, currentName: ''});
      setNewLaneName('');
      toast({
        title: "Success",
        description: "Lane renamed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to rename lane. Please try again.",
        variant: "destructive"
      });
      console.error("Error renaming lane:", error);
    }
  });
  
  // Mutation for setting a pipeline as default
  const setDefaultPipelineMutation = useMutation({
    mutationFn: async (pipelineId: number) => {
      return apiRequest('POST', `/api/pipelines/${pipelineId}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines/default'] });
      toast({
        title: "Success",
        description: "Default pipeline updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set default pipeline. Please try again.",
        variant: "destructive"
      });
      console.error("Error setting default pipeline:", error);
    }
  });
  
  // Filter clients if needed
  const filteredClients = filter 
    ? clients.filter(client => client.source === filter || client.ownerId === Number(filter))
    : clients;
  
  // Get selected pipeline
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId) || defaultPipeline;
  
  // Group clients by kanban lane
  const kanbanLanes: KanbanColumn[] = selectedPipeline?.lanes 
    ? selectedPipeline.lanes.map(lane => ({
        id: lane.id,
        title: lane.name || lane.id
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        items: filteredClients.filter(client => 
          // Check for exact lane id match
          (client.kanbanLane === lane.id) && 
          // Include clients that belong to this pipeline or clients without a pipelineId if this is the default pipeline
          (client.pipelineId === selectedPipelineId || (!client.pipelineId && selectedPipeline.isDefault))
        )
      }))
    : Object.values(KanbanLane).map(lane => ({
        id: lane,
        title: lane
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        // For fallback behavior, just show any clients with matching kanban lane
        items: filteredClients.filter(client => client.kanbanLane === lane)
      }));
      
  // Debug client data
  console.log("Selected Pipeline ID:", selectedPipelineId);
  console.log("Filtered Clients:", filteredClients.map(c => ({
    name: c.name, 
    isClient: c.isClient, 
    kanbanLane: c.kanbanLane,
    pipelineId: c.pipelineId
  })));
  
  // Handle drag start
  const handleDragStart = (client: Lead) => {
    setDraggingClient(client);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent, laneId: string) => {
    e.preventDefault();
    if (draggingClient) {
      console.log(`Moving client ${draggingClient.id} to lane ${laneId}`);
      
      // Call the API to update the client's lane
      moveClientMutation.mutate({
        clientId: draggingClient.id,
        laneId,
        pipelineId: selectedPipelineId || undefined
      });
      
      setDraggingClient(null);
    }
  };
  
  // Client card component with simplified display (only name and next action)
  const ClientCard = ({ client }: { client: Lead }) => (
    <Card 
      className="mb-3 cursor-pointer" 
      draggable
      onDragStart={() => handleDragStart(client)}
      onClick={() => setDetailModal({ isOpen: true, client })}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium">{client.name}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Link href={`/leads/${client.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Link href={`/leads/${client.id}/edit`}>Edit Client</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Redirect to inbox with compose dialog open and client email prefilled
                if (client.email) {
                  // Log this email activity first
                  const activity = {
                    userId: 1,
                    activityType: "email_initiated",
                    description: `Email initiated to ${client.name}`,
                    entityType: "lead",
                    entityId: client.id
                  };
                  
                  apiRequest("POST", "/api/activities", activity)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
                      
                      // Store compose data in session storage
                      sessionStorage.setItem('composeEmail', JSON.stringify({
                        to: client.email,
                        subject: '',
                        body: '',
                        open: true,
                        leadId: client.id
                      }));
                      
                      // Redirect to inbox tab
                      window.location.href = '/inbox';
                    })
                    .catch(error => {
                      console.error("Failed to log email activity:", error);
                      toast({
                        title: "Error",
                        description: "Failed to initiate email. Please try again.",
                        variant: "destructive"
                      });
                    });
                } else {
                  toast({
                    title: "Error",
                    description: "No email address available for this client",
                    variant: "destructive"
                  });
                }
              }}>
                <Mail className="h-4 w-4 mr-2" />
                Email Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Next activity - this is the only client information shown in the card */}
        {client.nextActivity && (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Next:</span> {client.nextActivity}
            {client.nextActivityDate && (
              <span className="text-gray-500"> ({format(new Date(client.nextActivityDate), 'MMM d')})</span>
            )}
          </div>
        )}
        
        {/* Show prompt if no next activity */}
        {!client.nextActivity && (
          <div className="mt-2 text-xs text-gray-500 italic">
            No upcoming activity
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Client detail modal
  const ClientDetailModal = () => {
    const client = detailModal.client;
    
    if (!client) return null;
    
    return (
      <Dialog open={detailModal.isOpen} onOpenChange={(open) => setDetailModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {client.name}
              {client.value && (
                <span className="text-green-600 text-base font-normal">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(client.value)}
                </span>
              )}
            </DialogTitle>
            {client.company && (
              <DialogDescription>{client.company}</DialogDescription>
            )}
            <div className="flex space-x-2 mt-3">
              <Button size="sm" className="bg-primary" onClick={() => {
                if (client.email) {
                  // Log this email activity
                  const activity = {
                    userId: 1,
                    activityType: "email_initiated",
                    description: `Email initiated to ${client.name}`,
                    entityType: "lead",
                    entityId: client.id
                  };
                  
                  apiRequest("POST", "/api/activities", activity)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
                      
                      // Store compose data in session storage
                      sessionStorage.setItem('composeEmail', JSON.stringify({
                        to: client.email,
                        subject: '',
                        body: '',
                        open: true,
                        leadId: client.id
                      }));
                      
                      // Redirect to inbox tab
                      window.location.href = '/inbox';
                    });
                } else {
                  toast({
                    title: "Error",
                    description: "No email address available for this client",
                    variant: "destructive"
                  });
                }
              }}>
                <Mail className="h-4 w-4 mr-2" />
                Email Client
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Activity
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    // Redirect to calendar with new appointment page and this client pre-selected
                    window.location.href = `/calendar?clientId=${client.id}&action=new`;
                  }}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Redirect to tasks with new task page and this client pre-selected
                    window.location.href = `/tasks?clientId=${client.id}&action=new`;
                  }}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Create Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Redirect to tasks with new task page and this client pre-selected
                    window.location.href = `/tasks?clientId=${client.id}&action=new&type=call`;
                  }}>
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Contact Information</h3>
              <div className="space-y-2">
                {client.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.address && (
                  <div className="text-sm">
                    <span className="font-medium">Address:</span> {client.address}
                  </div>
                )}
              </div>
              
              {client.notes && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{client.notes}</p>
                </div>
              )}
              
              {client.labels && Array.isArray(client.labels) && client.labels.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Labels</h3>
                  <div className="flex flex-wrap gap-1">
                    {client.labels.map((label, idx) => (
                      <Badge key={idx} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                Activity & History
              </h3>
              <div className="border-l border-gray-200 pl-4 space-y-4">
                {client.nextActivity && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-medium">Next: {client.nextActivity}</p>
                    {client.nextActivityDate && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(client.nextActivityDate), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Activity history component */}
                <ActivityHistory clientId={client.id} />
                
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                  <p className="text-sm font-medium">Client converted from lead</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(client.updatedAt), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                  <p className="text-sm font-medium">Lead created</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(client.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule Activity
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href={`/calendar/new?leadId=${client.id}`} className="flex items-center">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const today = new Date();
                    const task = {
                      title: `Call ${client.name}`,
                      description: "Follow-up call with client",
                      dueDate: today.toISOString(),
                      assigneeId: 1, // Default assignee (current user)
                      priority: "high",
                      status: "pending"
                    };
                    
                    // Create a new task
                    apiRequest("POST", "/api/tasks", task)
                      .then(() => {
                        toast({
                          title: "Call scheduled",
                          description: `Call with ${client.name} added to your tasks`,
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                      })
                      .catch(error => {
                        toast({
                          title: "Error",
                          description: "Failed to schedule call",
                          variant: "destructive"
                        });
                      });
                  }}>
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const today = new Date();
                    const task = {
                      title: `Follow up with ${client.name}`,
                      description: "General follow-up with client",
                      dueDate: today.toISOString(),
                      assigneeId: 1, // Default assignee (current user)
                      priority: "medium",
                      status: "pending"
                    };
                    
                    // Create a new task
                    apiRequest("POST", "/api/tasks", task)
                      .then(() => {
                        toast({
                          title: "Follow-up scheduled",
                          description: `Follow-up with ${client.name} added to your tasks`,
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                      })
                      .catch(error => {
                        toast({
                          title: "Error",
                          description: "Failed to schedule follow-up",
                          variant: "destructive"
                        });
                      });
                  }}>
                    <Activity className="h-4 w-4 mr-2" />
                    Schedule Follow-up
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="default" 
                onClick={() => {
                  // Redirect to inbox with compose dialog open and client email prefilled
                  if (client.email) {
                    // Log this email activity first
                    const activity = {
                      userId: 1,
                      activityType: "email_initiated",
                      description: `Email initiated to ${client.name}`,
                      entityType: "lead",
                      entityId: client.id
                    };
                    
                    apiRequest("POST", "/api/activities", activity)
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
                        
                        // Store compose data in session storage
                        sessionStorage.setItem('composeEmail', JSON.stringify({
                          to: client.email,
                          subject: '',
                          body: '',
                          open: true,
                          leadId: client.id
                        }));
                        
                        // Redirect to inbox tab
                        window.location.href = '/inbox';
                      })
                      .catch(error => {
                        console.error("Failed to log email activity:", error);
                        toast({
                          title: "Error",
                          description: "Failed to initiate email. Please try again.",
                          variant: "destructive"
                        });
                      });
                  } else {
                    toast({
                      title: "Error",
                      description: "No email address available for this client",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Client
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Get unique sources for filtering
  const sources = Array.from(new Set(clients.map(client => client.source).filter(Boolean)));
  
  // Get unique owners for filtering
  const owners = Array.from(new Set(clients.map(client => client.ownerId).filter(Boolean)));
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                {filter ? 'Filtered' : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter(null)}>
                All Clients
              </DropdownMenuItem>
              
              {sources.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold">By Source</div>
                  {sources.map(source => (
                    <DropdownMenuItem key={source} onClick={() => setFilter(source as string)}>
                      {source}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {owners.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold">By Owner</div>
                  {owners.map(owner => (
                    <DropdownMenuItem key={owner} onClick={() => setFilter(owner?.toString())}>
                      Owner {owner}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Add new client button */}
          <Button asChild>
            <Link href="/leads/new?isClient=true">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>
      </div>
      
      {isLoadingClients || isLoadingPipelines ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      ) : (
        <>
          {/* Pipeline selector */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center flex-wrap gap-2">
              <label htmlFor="pipeline-select" className="mr-2 text-sm font-medium">
                Pipeline:
              </label>
              <Select
                value={selectedPipelineId?.toString()}
                onValueChange={(value) => setSelectedPipelineId(parseInt(value))}
              >
                <SelectTrigger className="w-[200px]" id="pipeline-select">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                      {pipeline.name}
                      {pipeline.isDefault && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatePipelineDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Pipeline
              </Button>
              
              {selectedPipelineId && (
                <>
                  {!pipelines.find(p => p.id === selectedPipelineId)?.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultPipelineMutation.mutate(selectedPipelineId)}
                      disabled={setDefaultPipelineMutation.isPending}
                    >
                      Set as Default
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      // Show confirmation dialog before deleting the pipeline
                      if (window.confirm(`Are you sure you want to delete the "${pipelines.find(p => p.id === selectedPipelineId)?.name}" pipeline?`)) {
                        // Implement the delete pipeline mutation
                        apiRequest('DELETE', `/api/pipelines/${selectedPipelineId}`)
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
                            toast({
                              title: "Success",
                              description: "Pipeline deleted successfully",
                            });
                            // Select a different pipeline
                            const otherPipeline = pipelines.find(p => p.id !== selectedPipelineId);
                            if (otherPipeline) {
                              setSelectedPipelineId(otherPipeline.id);
                            } else {
                              setSelectedPipelineId(null);
                            }
                          })
                          .catch(error => {
                            toast({
                              title: "Error",
                              description: "Failed to delete pipeline. Please try again.",
                              variant: "destructive"
                            });
                            console.error("Error deleting pipeline:", error);
                          });
                      }
                    }}
                  >
                    Delete Pipeline
                  </Button>
                </>
              )}
            </div>
            
            {/* New Lane Button */}
            {selectedPipelineId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Prompt for new lane name
                  const newLaneName = window.prompt("Enter a name for the new lane:");
                  if (newLaneName?.trim()) {
                    // Create the new lane
                    apiRequest('POST', `/api/pipelines/${selectedPipelineId}/lanes`, { name: newLaneName.trim() })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
                        toast({
                          title: "Success",
                          description: "New lane added successfully",
                        });
                      })
                      .catch(error => {
                        toast({
                          title: "Error",
                          description: "Failed to add new lane. Please try again.",
                          variant: "destructive"
                        });
                        console.error("Error adding lane:", error);
                      });
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Lane
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Kanban lanes */}
            {kanbanLanes.map(lane => (
              <div 
                key={lane.id} 
                className="bg-gray-50 rounded-lg p-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, lane.id)}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-gray-700 mr-1">{lane.title}</h3>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                        onClick={() => {
                          if (selectedPipelineId) {
                            setRenameLaneDialog({
                              isOpen: true,
                              pipelineId: selectedPipelineId,
                              laneId: lane.id,
                              currentName: lane.title
                            });
                            setNewLaneName(lane.title);
                          }
                        }}
                      >
                        <PencilLine className="h-3 w-3" />
                      </Button>
                      
                      {/* Delete Lane Button */}
                      {selectedPipeline && selectedPipeline.lanes.length > 1 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 opacity-50 hover:opacity-100 text-red-500 hover:text-red-700"
                          onClick={() => {
                            if (selectedPipelineId) {
                              // Show confirmation dialog before deleting the lane
                              if (window.confirm(`Are you sure you want to delete the "${lane.title}" lane? All clients in this lane will be moved to another lane.`)) {
                                apiRequest('DELETE', `/api/pipelines/${selectedPipelineId}/lanes/${lane.id}`)
                                  .then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
                                    queryClient.invalidateQueries({ queryKey: ['/api/leads/clients'] });
                                    toast({
                                      title: "Success",
                                      description: "Lane deleted successfully",
                                    });
                                  })
                                  .catch(error => {
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete lane. Please try again.",
                                      variant: "destructive"
                                    });
                                    console.error("Error deleting lane:", error);
                                  });
                              }
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            <line x1="10" x2="10" y1="11" y2="17"></line>
                            <line x1="14" x2="14" y1="11" y2="17"></line>
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {lane.items.length}
                  </Badge>
                </div>
                
                {lane.items.map(client => (
                  <ClientCard key={client.id} client={client} />
                ))}
                
                {lane.items.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No clients in this lane
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Client detail modal */}
          <ClientDetailModal />
          
          {/* New pipeline dialog */}
          <Dialog open={createPipelineDialog} onOpenChange={setCreatePipelineDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pipeline</DialogTitle>
                <DialogDescription>
                  Enter a name for your new workflow pipeline.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="pipeline-name" className="text-right text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="pipeline-name"
                    value={newPipelineName}
                    onChange={(e) => setNewPipelineName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Buyer Workflow"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreatePipelineDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createPipelineMutation.mutate(newPipelineName)}
                  disabled={!newPipelineName || createPipelineMutation.isPending}
                >
                  Create Pipeline
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Rename lane dialog */}
          <Dialog 
            open={renameLaneDialog.isOpen} 
            onOpenChange={(open) => !open && setRenameLaneDialog(prev => ({...prev, isOpen: false}))}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Lane</DialogTitle>
                <DialogDescription>
                  Enter a new name for this lane.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="lane-name" className="text-right text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="lane-name"
                    value={newLaneName}
                    onChange={(e) => setNewLaneName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setRenameLaneDialog(prev => ({...prev, isOpen: false}))}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (renameLaneDialog.pipelineId && renameLaneDialog.laneId) {
                      renameLaneMutation.mutate({
                        pipelineId: renameLaneDialog.pipelineId,
                        laneId: renameLaneDialog.laneId,
                        name: newLaneName
                      });
                    }
                  }}
                  disabled={!newLaneName || renameLaneMutation.isPending}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Clients;