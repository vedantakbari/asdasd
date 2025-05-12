import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import CustomerList from '@/components/customers/customer-list';
import CustomerForm from '@/components/customers/customer-form';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Customers: React.FC = () => {
  const [location] = useLocation();
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Switch>
        <Route path="/customers/new">
          <Header 
            title="New Customer" 
            description="Add a new customer"
          />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            <CustomerForm />
          </div>
        </Route>
        
        <Route path="/customers/:id">
          {(params) => {
            // Fetch customer data
            const { data: customer, isLoading: customerLoading } = useQuery({
              queryKey: [`/api/customers/${params.id}`],
            });

            // Fetch deals for this customer
            const { data: deals = [], isLoading: dealsLoading } = useQuery({
              queryKey: [`/api/deals/customer/${params.id}`],
              enabled: !!params.id,
            });
            
            const isLoading = customerLoading || dealsLoading;
            
            return (
              <>
                <Header 
                  title={isLoading ? "Customer Details" : `${customer?.name}`}
                  description={customer?.company}
                  actions={
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = `/customers/${params.id}/edit`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Customer
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
                          <CardTitle>Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Name</h3>
                              <p className="mt-1 text-sm text-gray-900">{customer?.name}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Company</h3>
                              <p className="mt-1 text-sm text-gray-900">{customer?.company || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Email</h3>
                              <p className="mt-1 text-sm text-gray-900">{customer?.email || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                              <p className="mt-1 text-sm text-gray-900">{customer?.phone || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <h3 className="text-sm font-medium text-gray-500">Address</h3>
                              <p className="mt-1 text-sm text-gray-900">{customer?.address || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                              {customer?.notes || 'No notes available'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Tabs defaultValue="deals">
                        <TabsList>
                          <TabsTrigger value="deals">Deals</TabsTrigger>
                          <TabsTrigger value="payments">Payments</TabsTrigger>
                          <TabsTrigger value="appointments">Appointments</TabsTrigger>
                        </TabsList>
                        <TabsContent value="deals" className="mt-4">
                          <Card>
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle>Customer Deals</CardTitle>
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = `/deals/new?customerId=${params.id}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Deal
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {deals.length === 0 ? (
                                <div className="text-center py-4">
                                  <p className="text-gray-500">No deals found for this customer</p>
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {deals.map((deal: any) => (
                                        <tr key={deal.id}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deal.title}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`deal-stage-${deal.stage}`}>
                                              {deal.stage.replace('_', ' ')}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${deal.value.toLocaleString()}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <a href={`/deals/${deal.id}`} className="text-primary-600 hover:text-primary-900">View</a>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="payments" className="mt-4">
                          <Card>
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle>Payment History</CardTitle>
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = `/payments/new?customerId=${params.id}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Process Payment
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-4">
                                <p className="text-gray-500">Payment history will be displayed here</p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="appointments" className="mt-4">
                          <Card>
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle>Appointments</CardTitle>
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = `/calendar/new?customerId=${params.id}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Schedule Appointment
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-4">
                                <p className="text-gray-500">Appointments will be displayed here</p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/customers/:id/edit">
          {(params) => {
            // Fetch customer data for editing
            const { data: customer, isLoading } = useQuery({
              queryKey: [`/api/customers/${params.id}`],
            });
            
            return (
              <>
                <Header 
                  title="Edit Customer" 
                  description={isLoading ? "Loading..." : `Editing ${customer?.name}`}
                />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                    </div>
                  ) : (
                    <CustomerForm customer={customer} isEdit={true} />
                  )}
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/customers">
          <Header 
            title="Customers" 
            description="Manage your customer base"
            actions={
              <Button asChild>
                <a href="/customers/new">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Customer
                </a>
              </Button>
            }
          />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            <CustomerList />
          </div>
        </Route>
      </Switch>
    </main>
  );
};

export default Customers;
