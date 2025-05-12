import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lead, KanbanLane } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Phone, 
  Mail, 
  MoreVertical, 
  Filter, 
  CalendarPlus 
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

interface KanbanColumn {
  id: string;
  title: string;
  items: Lead[];
}

const Clients: React.FC = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [draggingClient, setDraggingClient] = useState<Lead | null>(null);
  
  // Fetch clients (leads with isClient = true)
  const { data: clients = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads/clients'],
  });
  
  // Filter clients if needed
  const filteredClients = filter 
    ? clients.filter(client => client.source === filter || client.ownerId === Number(filter))
    : clients;
  
  // Group clients by kanban lane
  const kanbanLanes: KanbanColumn[] = Object.values(KanbanLane).map(lane => ({
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
      // Here we would update the client's lane in the backend
      // For now, we'll just log it
      console.log(`Moving client ${draggingClient.id} to lane ${laneId}`);
      setDraggingClient(null);
    }
  };
  
  // Client card component
  const ClientCard = ({ client }: { client: Lead }) => (
    <Card 
      className="mb-3 cursor-pointer" 
      draggable
      onDragStart={() => handleDragStart(client)}
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
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/leads/${client.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/leads/${client.id}/edit`}>Edit Client</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {/* Kanban lanes */}
          {kanbanLanes.map(lane => (
            <div 
              key={lane.id} 
              className="bg-gray-50 rounded-lg p-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane.id)}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">{lane.title}</h3>
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
      )}
    </div>
  );
};

export default Clients;