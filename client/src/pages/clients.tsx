import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, KanbanLane } from '@shared/schema';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggingClient, setDraggingClient] = useState<Lead | null>(null);

  // Fetch all leads with isClient status
  const { data: clients = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads/clients'],
  });

  // Filter clients by search term
  const filteredClients = clients.filter((client) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group clients by kanban lane
  const clientsByLane = {
    [KanbanLane.NEW_CLIENT]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.NEW_CLIENT || !client.kanbanLane),
    [KanbanLane.IN_PROGRESS]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.IN_PROGRESS),
    [KanbanLane.FOLLOW_UP]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.FOLLOW_UP),
    [KanbanLane.UPSELL]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.UPSELL),
    [KanbanLane.COMPLETED]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.COMPLETED),
    [KanbanLane.RECURRING]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.RECURRING),
    [KanbanLane.REFERRALS]: filteredClients.filter(client => 
      client.kanbanLane === KanbanLane.REFERRALS),
  };

  // Get lane display name by removing underscores and capitalizing
  const formatLaneName = (lane: string) => {
    return lane.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Handle drag start
  const handleDragStart = (client: Lead) => {
    setDraggingClient(client);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop on a lane
  const handleDrop = (lane: string) => {
    if (!draggingClient) return;
    
    // TODO: Implement updating client lane in the backend
    console.log(`Moved client ${draggingClient.id} to lane ${lane}`);
    setDraggingClient(null);
  };

  // Render a client card
  const ClientCard = ({ client }: { client: Lead }) => (
    <Card 
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={() => handleDragStart(client)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{client.name}</h3>
            {client.company && <p className="text-sm text-gray-500">{client.company}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `/leads/${client.id}`}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/leads/${client.id}/edit`}>
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/calendar/new?leadId=${client.id}`}>
                Schedule Appointment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/payments/new?leadId=${client.id}`}>
                Process Payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {client.nextActivity && (
            <div className="mt-2">
              <span className="font-medium">Next:</span> {client.nextActivity}
              {client.nextActivityDate && (
                <span className="text-xs text-gray-500 ml-1">
                  ({format(new Date(client.nextActivityDate), 'MMM d')})
                </span>
              )}
            </div>
          )}
          
          {client.value && (
            <div className="mt-1">
              <span className="font-medium">Value:</span> ${client.value.toLocaleString()}
            </div>
          )}
          
          {client.email && (
            <div className="mt-1 truncate">
              <span className="font-medium">Email:</span> {client.email}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Clients" 
        description="Manage your clients with this Kanban board"
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="mb-6 flex justify-between items-center">
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button asChild>
            <a href="/leads?filter=clients">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              View All Clients
            </a>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr h-full overflow-x-auto">
            {Object.entries(clientsByLane).map(([lane, laneClients]) => (
              <div 
                key={lane}
                className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(lane)}
              >
                <div className="p-4 bg-gray-50 border-b">
                  <h2 className="font-semibold text-gray-700">{formatLaneName(lane)}</h2>
                  <div className="text-sm text-gray-500 mt-1">{laneClients.length} clients</div>
                </div>
                <div className="p-3 flex-1 overflow-y-auto bg-gray-50 min-h-[300px]">
                  {laneClients.length > 0 ? (
                    laneClients.map(client => (
                      <ClientCard key={client.id} client={client} />
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 italic">
                      No clients in this lane
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Clients;