import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Customer, Deal } from '@shared/schema';
import { Link } from 'wouter';

const CustomerOverview: React.FC = () => {
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/deals'],
  });

  const isLoading = customersLoading || dealsLoading;

  // Get active customers with their associated deals
  const activeCustomers = customers
    .filter((customer: Customer) => {
      const customerDeals = deals.filter((deal: Deal) => deal.customerId === customer.id);
      return customerDeals.length > 0;
    })
    .slice(0, 4);

  const getCustomerDeals = (customerId: number) => {
    return deals.filter((deal: Deal) => deal.customerId === customerId);
  };

  const getStageClass = (stage: string) => {
    switch (stage) {
      case 'planning':
        return 'deal-stage-planning';
      case 'in_progress':
        return 'deal-stage-in-progress';
      case 'installation':
        return 'deal-stage-installation';
      case 'review':
        return 'deal-stage-review';
      case 'completed':
        return 'deal-stage-completed';
      default:
        return 'deal-stage-planning';
    }
  };

  const getNextActivity = (customerId: number) => {
    const customerDeals = getCustomerDeals(customerId);
    // This is a simplification - in a real implementation we would check tasks and appointments related to this customer
    if (customerDeals.length > 0) {
      const stages = {
        'planning': 'Planning (Today)',
        'in_progress': 'In Progress (Ongoing)',
        'installation': 'Installation (This week)',
        'review': 'Final Review (Today)',
        'completed': 'Project Completed'
      };
      return stages[customerDeals[0].stage] || 'No scheduled activities';
    }
    return 'No scheduled activities';
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">Active Customers</CardTitle>
          <div className="relative">
            <Button variant="outline" size="sm" className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Activity</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              [...Array(4)].map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="animate-pulse h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="ml-4">
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                        <div className="animate-pulse mt-1 h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-28"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="animate-pulse h-5 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-10 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : activeCustomers.length > 0 ? (
              activeCustomers.map((customer: Customer) => {
                const customerDeals = getCustomerDeals(customer.id);
                const primaryDeal = customerDeals.length > 0 ? customerDeals[0] : null;
                
                return (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`} 
                            alt={`${customer.name} profile`} 
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{primaryDeal?.title || 'No active project'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {primaryDeal ? (
                        <span className={getStageClass(primaryDeal.stage)}>{primaryDeal.stage.replace('_', ' ')}</span>
                      ) : (
                        <span className="text-sm text-gray-500">No status</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {primaryDeal ? `$${primaryDeal.value.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getNextActivity(customer.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/customers/${customer.id}`}>
                        <a className="text-primary-600 hover:text-primary-900">View</a>
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No active customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <CardFooter className="px-6 py-3 bg-gray-50 rounded-b-lg flex items-center justify-between">
        <Link href="/customers">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all customers
          </a>
        </Link>
        <div className="flex items-center space-x-2">
          <button type="button" className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-700">Page 1 of {Math.ceil(customers.length / 4)}</span>
          <button type="button" className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CustomerOverview;
