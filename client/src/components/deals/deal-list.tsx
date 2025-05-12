import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Deal, DealStage } from '@shared/schema';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

const DealList: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/deals'],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  const isLoading = dealsLoading || customersLoading;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/deals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: 'Deal deleted',
        description: 'The deal has been successfully deleted.',
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete deal: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (dealToDelete) {
      deleteMutation.mutate(dealToDelete.id);
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const filteredDeals = deals.filter((deal: Deal) => {
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.description && deal.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getCustomerName(deal.customerId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter ? deal.stage === stageFilter : true;
    
    return matchesSearch && matchesStage;
  });

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case DealStage.PLANNING:
        return 'deal-stage-planning';
      case DealStage.IN_PROGRESS:
        return 'deal-stage-in-progress';
      case DealStage.INSTALLATION:
        return 'deal-stage-installation';
      case DealStage.REVIEW:
        return 'deal-stage-review';
      case DealStage.COMPLETED:
        return 'deal-stage-completed';
      default:
        return '';
    }
  };

  // Format stage name for display
  const formatStage = (stage: string) => {
    return stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {stageFilter ? `Stage: ${formatStage(stageFilter)}` : 'Filter by stage'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStageFilter(null)}>
                All Stages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStageFilter(DealStage.PLANNING)}>
                Planning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStageFilter(DealStage.IN_PROGRESS)}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStageFilter(DealStage.INSTALLATION)}>
                Installation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStageFilter(DealStage.REVIEW)}>
                Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStageFilter(DealStage.COMPLETED)}>
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link href="/deals/new">
          <Button>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Deal
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        ) : filteredDeals.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal: Deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>{getCustomerName(deal.customerId)}</TableCell>
                    <TableCell>
                      <span className={getStageBadgeClass(deal.stage)}>{formatStage(deal.stage)}</span>
                    </TableCell>
                    <TableCell>${deal.value.toLocaleString()}</TableCell>
                    <TableCell>
                      {deal.startDate ? format(new Date(deal.startDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {deal.endDate ? format(new Date(deal.endDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/deals/${deal.id}`)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/deals/${deal.id}/edit`)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(deal)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">No deals found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || stageFilter
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by adding your first deal."}
            </p>
            {!searchTerm && !stageFilter && (
              <div className="mt-4">
                <Link href="/deals/new">
                  <Button>
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Deal
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deal "{dealToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DealList;
