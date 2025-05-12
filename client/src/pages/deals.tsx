import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import DealList from '@/components/deals/deal-list';
import DealForm from '@/components/deals/deal-form';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const Deals: React.FC = () => {
  const [location] = useLocation();
  
  // Get query parameters
  const getQueryParam = (name: string): string | null => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Switch>
        <Route path="/deals/new">
          {() => {
            const leadId = getQueryParam('leadId');
            
            return (
              <>
                <Header 
                  title="New Deal" 
                  description={leadId ? "Convert lead to deal" : "Create a new deal"}
                />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                  <DealForm leadId={leadId ? parseInt(leadId) : undefined} />
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/deals/:id">
          {(params) => {
            // Fetch deal data
            const { data: deal, isLoading: dealLoading } = useQuery({
              queryKey: [`/api/deals/${params.id}`],
            });

            // Fetch customer data if deal is loaded
            const { data: customer, isLoading: customerLoading } = useQuery({
              queryKey: deal ? [`/api/customers/${deal.customerId}`] : null,
              enabled: !!deal,
            });
            
            const isLoading = dealLoading || (deal && customerLoading);
            
            return (
              <>
                <Header 
                  title={isLoading ? "Deal Details" : `${deal?.title}`}
                  description={customer?.name ? `Customer: ${customer.name}` : undefined}
                  actions={
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = `/deals/${params.id}/edit`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Deal
                    </Button>
                  }
                />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Deal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Title</h3>
                              <p className="mt-1 text-sm text-gray-900">{deal?.title}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                              <p className="mt-1 text-sm text-gray-900">{customer?.name || 'Unknown'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Value</h3>
                              <p className="mt-1 text-sm text-gray-900">${deal?.value.toLocaleString()}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Stage</h3>
                              <p className="mt-1">
                                <span className={`deal-stage-${deal?.stage}`}>
                                  {deal?.stage.replace('_', ' ')}
                                </span>
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                              <p className="mt-1 text-sm text-gray-900">
                                {deal?.startDate ? format(new Date(deal.startDate), 'MMM d, yyyy') : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                              <p className="mt-1 text-sm text-gray-900">
                                {deal?.endDate ? format(new Date(deal.endDate), 'MMM d, yyyy') : 'Not set'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500">Description</h3>
                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                              {deal?.description || 'No description available'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex space-x-4">
                        <Button 
                          variant="default" 
                          onClick={() => window.location.href = `/calendar/new?dealId=${params.id}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Schedule Appointment
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={() => window.location.href = `/payments/new?dealId=${params.id}&customerId=${deal.customerId}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Process Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/deals/:id/edit">
          {(params) => {
            // Fetch deal data for editing
            const { data: deal, isLoading } = useQuery({
              queryKey: [`/api/deals/${params.id}`],
            });
            
            return (
              <>
                <Header 
                  title="Edit Deal" 
                  description={isLoading ? "Loading..." : `Editing ${deal?.title}`}
                />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                    </div>
                  ) : (
                    <DealForm deal={deal} isEdit={true} />
                  )}
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/deals">
          <Header 
            title="Deals" 
            description="Manage your service deals"
            actions={
              <Button asChild>
                <a href="/deals/new">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Deal
                </a>
              </Button>
            }
          />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            <DealList />
          </div>
        </Route>
      </Switch>
    </main>
  );
};

export default Deals;
