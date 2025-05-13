import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Lead, LeadStatus, KanbanLane } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { 
  ArrowUpDown, 
  Download, 
  Upload, 
  Archive, 
  Filter, 
  UserCheck, 
  Mail, 
  Tag,
  MoreHorizontal,
  Trash,
  MoreVertical
} from 'lucide-react';

const LeadList: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<number | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  // Delete single lead
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Lead deleted',
        description: 'The lead has been successfully deleted.',
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete lead: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Bulk lead actions mutations
  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return apiRequest('PATCH', '/api/leads/bulk-actions', { ids, action: 'archive' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Leads archived',
        description: `${selectedLeads.size} leads have been archived.`,
      });
      setSelectedLeads(new Set());
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to archive leads: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Convert lead to client mutation
  const convertToClientMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      return apiRequest('POST', `/api/leads/${lead.id}/convert-to-client`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Lead converted to client',
        description: 'The lead has been successfully converted to a client and added to the Clients board.',
      });
      setIsConvertDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to convert lead: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handler for single delete
  const handleDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  // Handler for confirming deletion
  const confirmDelete = () => {
    if (leadToDelete) {
      deleteMutation.mutate(leadToDelete.id);
    }
  };

  // Handler for selecting/deselecting a lead
  const toggleSelectLead = (id: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  // Handler for selecting/deselecting all leads
  const toggleSelectAll = () => {
    if (selectAll || selectedLeads.size > 0) {
      setSelectedLeads(new Set());
      setSelectAll(false);
    } else {
      const allIds = filteredLeads.map(lead => lead.id);
      setSelectedLeads(new Set(allIds));
      setSelectAll(true);
    }
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handler for converting lead to client
  const handleConvertToClient = (lead: Lead) => {
    setLeadToConvert(lead);
    setIsConvertDialogOpen(true);
  };

  // Handler for confirming conversion
  const confirmConvert = () => {
    if (leadToConvert) {
      convertToClientMutation.mutate(leadToConvert);
    }
  };

  // Handler for bulk archiving
  const handleBulkArchive = () => {
    if (selectedLeads.size > 0) {
      bulkArchiveMutation.mutate(Array.from(selectedLeads));
    }
  };

  // Filter leads by search, status, source, and owner
  const filteredLeads = leads.filter((lead: Lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter ? lead.status === statusFilter : true;
    const matchesSource = sourceFilter ? lead.source === sourceFilter : true;
    const matchesOwner = ownerFilter ? lead.ownerId === ownerFilter : true;
    
    return matchesSearch && matchesStatus && matchesSource && matchesOwner;
  });
  
  // Sort the filtered leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let valueA = a[sortColumn as keyof Lead];
    let valueB = b[sortColumn as keyof Lead];
    
    // Handle nullable values
    if (valueA === null || valueA === undefined) valueA = '';
    if (valueB === null || valueB === undefined) valueB = '';
    
    // String comparison
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Date comparison
    if (valueA instanceof Date && valueB instanceof Date) {
      return sortDirection === 'asc' 
        ? valueA.getTime() - valueB.getTime()
        : valueB.getTime() - valueA.getTime();
    }
    
    // Number comparison
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Default string conversion comparison
    const strA = String(valueA);
    const strB = String(valueB);
    return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
  
  // Get unique sources for filtering
  const sources = Array.from(new Set(leads.map(lead => lead.source).filter(Boolean)));
  
  // Get unique owners for filtering
  const owners = Array.from(new Set(leads.map(lead => lead.ownerId).filter(Boolean)));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'status-pill status-new';
      case LeadStatus.CONTACTED:
        return 'status-pill status-contacted';
      case LeadStatus.QUALIFIED:
        return 'status-pill status-qualified';
      case LeadStatus.PROPOSAL:
        return 'status-pill status-proposal';
      case LeadStatus.WON:
        return 'status-pill status-won';
      case LeadStatus.LOST:
        return 'status-pill status-lost';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter ? `Status: ${statusFilter}` : 'Status'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.NEW)}>
                New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.CONTACTED)}>
                Contacted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.QUALIFIED)}>
                Qualified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.PROPOSAL)}>
                Proposal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.WON)}>
                Won
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.LOST)}>
                Lost
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(LeadStatus.CLIENT)}>
                Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {sources.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  {sourceFilter ? `Source: ${sourceFilter}` : 'Source'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSourceFilter(null)}>
                  All Sources
                </DropdownMenuItem>
                {sources.map(source => (
                  <DropdownMenuItem key={source} onClick={() => setSourceFilter(source as string)}>
                    {source}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {selectedLeads.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  Bulk Actions ({selectedLeads.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleBulkArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Export selected', Array.from(selectedLeads))}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Link href="/leads/new">
            <Button>
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        ) : sortedLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectAll || (sortedLeads.length > 0 && selectedLeads.size === sortedLeads.length)} 
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all leads"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'name' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('nextActivity')}>
                    <div className="flex items-center space-x-1">
                      <span>Next Activity</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'nextActivity' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Labels</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('source')}>
                    <div className="flex items-center space-x-1">
                      <span>Source</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'source' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center space-x-1">
                      <span>Date Created</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'createdAt' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('ownerId')}>
                    <div className="flex items-center space-x-1">
                      <span>Owner</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'ownerId' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('contactPerson')}>
                    <div className="flex items-center space-x-1">
                      <span>Contact</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'contactPerson' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-4 w-4" />
                      {sortColumn === 'status' && (
                        <span className="ml-1 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeads.map((lead: Lead) => (
                  <TableRow key={lead.id} className={selectedLeads.has(lead.id) ? 'bg-primary-50' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedLeads.has(lead.id)} 
                        onCheckedChange={() => toggleSelectLead(lead.id)}
                        aria-label={`Select ${lead.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="hover:underline cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {lead.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.company}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.nextActivity ? (
                        <div>
                          <div className="text-sm">{lead.nextActivity}</div>
                          {lead.nextActivityDate && (
                            <div className="text-xs text-gray-500">
                              {format(new Date(lead.nextActivityDate), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">None scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.labels && Array.isArray(lead.labels) && lead.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.labels.slice(0, 2).map((label, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                          {lead.labels.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{lead.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No labels</span>
                      )}
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell>{format(new Date(lead.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{lead.ownerId ? `Owner ${lead.ownerId}` : '-'}</TableCell>
                    <TableCell>
                      {lead.contactPerson || lead.email ? (
                        <div className="text-sm">
                          {lead.contactPerson && <div>{lead.contactPerson}</div>}
                          {lead.email && <div className="text-gray-500 text-xs truncate">{lead.email}</div>}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={getStatusBadgeClass(lead.status)}>
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvertToClient(lead)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Convert to Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(lead)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || statusFilter
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by adding your first lead."}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-4">
                <Link href="/leads/new">
                  <Button>
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Lead
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead "{leadToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Leads Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with lead data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Label htmlFor="file-upload">Choose file</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm">Drag and drop a file here, or click to browse</p>
              <p className="mt-1 text-xs text-gray-500">Supports CSV, XLS, XLSX (max 10MB)</p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.xls,.xlsx"
                onChange={(e) => {
                  // TODO: Implement file upload handling
                  // This would typically send the file to the server for processing
                  console.log('Selected file:', e.target.files?.[0]);
                }}
              />
              <Button variant="outline" className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
                Select File
              </Button>
            </div>
            
            <div className="mt-2">
              <h3 className="text-sm font-medium mb-2">Expected columns:</h3>
              <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                <li>Name (required)</li>
                <li>Email</li>
                <li>Phone</li>
                <li>Company</li>
                <li>Source</li>
                <li>Status</li>
                <li>Next Activity</li>
                <li>Contact Person</li>
                <li>Labels (comma-separated)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                // Placeholder for import logic
                toast({
                  title: "Import feature",
                  description: "This feature would import leads from a CSV or Excel file.",
                });
                setIsImportDialogOpen(false);
              }}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Client Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Client</DialogTitle>
            <DialogDescription>
              This will mark the lead as a client and add them to your Clients board.
            </DialogDescription>
          </DialogHeader>
          
          {leadToConvert && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700">Lead Details</h3>
                <p className="text-sm">{leadToConvert.name} {leadToConvert.company ? `(${leadToConvert.company})` : ''}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Kanban Lane</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {KanbanLane.NEW_CLIENT}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.values(KanbanLane).map(lane => (
                      <DropdownMenuItem key={lane}>
                        {lane}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmConvert}>
              Convert to Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadList;
