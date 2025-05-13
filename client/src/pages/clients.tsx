import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, KanbanLane, Pipeline } from '@shared/schema';
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
  Activity
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
          client.kanbanLane === lane.id && 
          (client.pipelineId === selectedPipelineId || (!client.pipelineId && selectedPipeline.isDefault))
        )
      }))
    : Object.values(KanbanLane).map(lane => ({
        id: lane,
        title: lane
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        items: filteredClients.filter(client => client.kanbanLane === lane)
      }));
  
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
  
  // Client card component
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
            {client.company && (
              <p className="text-sm text-gray-500">{client.company}</p>
            )}
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
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Deal value */}
        {client.value && (
          <div className="mb-2 flex items-center text-sm font-semibold text-green-600">
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(client.value)}
          </div>
        )}
        
        {/* Contact information */}
        <div className="my-2 space-y-1">
          {client.phone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {client.phone}
            </div>
          )}
          {client.email && (
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              {client.email}
            </div>
          )}
        </div>
        
        {/* Labels */}
        {client.labels && Array.isArray(client.labels) && client.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {client.labels.slice(0, 2).map((label, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
            {client.labels.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{client.labels.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        {/* Next activity */}
        {client.nextActivity && (
          <div className="mt-2 text-xs">
            <span className="font-medium">Next:</span> {client.nextActivity}
            {client.nextActivityDate && (
              <span className="text-gray-500"> ({format(new Date(client.nextActivityDate), 'MMM d')})</span>
            )}
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
                
                {/* Would normally fetch activities related to this client */}
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
              <Button variant="outline" asChild>
                <Link href={`/leads/${client.id}/edit`}>Edit Client</Link>
              </Button>
              <div>
                <Button variant="outline" className="mr-2" asChild>
                  <Link href={`/calendar/new?leadId=${client.id}`}>Schedule Appointment</Link>
                </Button>
                <Button>Schedule Call</Button>
              </div>
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
            <div className="flex items-center">
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
                className="ml-2"
                onClick={() => setCreatePipelineDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Pipeline
              </Button>
              
              {selectedPipelineId && !pipelines.find(p => p.id === selectedPipelineId)?.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => setDefaultPipelineMutation.mutate(selectedPipelineId)}
                  disabled={setDefaultPipelineMutation.isPending}
                >
                  Set as Default
                </Button>
              )}
            </div>
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