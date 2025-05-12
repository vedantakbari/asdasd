import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import LeadList from '@/components/leads/lead-list';
import LeadForm from '@/components/leads/lead-form';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Leads: React.FC = () => {
  const [location] = useLocation();
  
  // Check if we're on the main leads listing page
  const isMainPage = location === '/leads';
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Switch>
        <Route path="/leads/new">
          <Header 
            title="New Lead" 
            description="Create a new sales lead"
          />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            <LeadForm />
          </div>
        </Route>
        
        <Route path="/leads/:id">
          {(params) => {
            // Fetch lead data
            const { data: lead, isLoading } = useQuery({
              queryKey: [`/api/leads/${params.id}`],
            });
            
            return (
              <>
                <Header 
                  title={isLoading ? "Lead Details" : `${lead?.name}`}
                  description={lead?.company}
                  actions={
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = `/leads/${params.id}/edit`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Lead
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
                          <CardTitle>Lead Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Name</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.name}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Company</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.company || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Email</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.email || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Address</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.address || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Source</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.source || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Status</h3>
                              <p className="mt-1">
                                <span className={`status-pill status-${lead?.status}`}>
                                  {lead?.status}
                                </span>
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Value</h3>
                              <p className="mt-1 text-sm text-gray-900">
                                {lead?.value ? `$${lead.value.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                              {lead?.notes || 'No notes available'}
                            </p>
                          </div>
                          
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Next Activity</h3>
                              <p className="mt-1 text-sm text-gray-900">{lead?.nextActivity || 'No next activity scheduled'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Next Activity Date</h3>
                              <p className="mt-1 text-sm text-gray-900">
                                {lead?.nextActivityDate 
                                  ? new Date(lead.nextActivityDate).toLocaleString() 
                                  : 'No date set'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex space-x-4">
                        <Button 
                          variant="default" 
                          onClick={() => window.location.href = `/deals/new?leadId=${params.id}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Convert to Deal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/leads/:id/edit">
          {(params) => {
            // Fetch lead data for editing
            const { data: lead, isLoading } = useQuery({
              queryKey: [`/api/leads/${params.id}`],
            });
            
            return (
              <>
                <Header 
                  title="Edit Lead" 
                  description={isLoading ? "Loading..." : `Editing ${lead?.name}`}
                />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                    </div>
                  ) : (
                    <LeadForm lead={lead} isEdit={true} />
                  )}
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/leads">
          <Header 
            title="Leads" 
            description="Manage your sales leads"
            actions={
              <Button asChild>
                <a href="/leads/new">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Lead
                </a>
              </Button>
            }
          />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            <LeadList />
          </div>
        </Route>
      </Switch>
    </main>
  );
};

export default Leads;
