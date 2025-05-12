import React, { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import PaymentForm from '@/components/payments/payment-form';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Payment } from '@shared/schema';

const Payments: React.FC = () => {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get query parameters
  const getQueryParam = (name: string): string | null => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
  };
  
  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/payments'],
  });
  
  // Fetch customers for mapping names
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
  });
  
  // Fetch deals for mapping titles
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/deals'],
  });
  
  const isAllLoading = isLoading || customersLoading || dealsLoading;
  
  // Filter payments based on search term
  const filteredPayments = payments.filter((payment: Payment) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customer = customers.find((c: any) => c.id === payment.customerId);
    const deal = payment.dealId ? deals.find((d: any) => d.id === payment.dealId) : null;
    
    return (
      (customer && customer.name.toLowerCase().includes(searchLower)) ||
      (deal && deal.title.toLowerCase().includes(searchLower)) ||
      payment.method.toLowerCase().includes(searchLower) ||
      payment.status.toLowerCase().includes(searchLower) ||
      (payment.description && payment.description.toLowerCase().includes(searchLower))
    );
  });
  
  // Get customer name from ID
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };
  
  // Get deal title from ID
  const getDealTitle = (dealId: number | null) => {
    if (!dealId) return null;
    const deal = deals.find((d: any) => d.id === dealId);
    return deal ? deal.title : null;
  };
  
  // Format payment status with appropriate styling
  const formatPaymentStatus = (status: string) => {
    let statusClass = '';
    switch (status) {
      case 'paid':
        statusClass = 'bg-green-100 text-green-800';
        break;
      case 'pending':
        statusClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'failed':
        statusClass = 'bg-red-100 text-red-800';
        break;
      case 'refunded':
        statusClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        statusClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Switch>
        <Route path="/payments/new">
          {() => {
            const dealId = getQueryParam('dealId');
            const customerId = getQueryParam('customerId');
            
            return (
              <>
                <Header 
                  title="Process Payment" 
                  description="Record a new payment"
                />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                  <PaymentForm 
                    dealId={dealId ? parseInt(dealId) : undefined}
                    customerId={customerId ? parseInt(customerId) : undefined}
                  />
                </div>
              </>
            );
          }}
        </Route>
        
        <Route path="/payments">
          <Header 
            title="Payments" 
            description="Manage and track payments"
            actions={
              <Button asChild>
                <a href="/payments/new">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Process Payment
                </a>
              </Button>
            }
          />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>View and manage all payment records</CardDescription>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isAllLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                  </div>
                ) : filteredPayments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment: Payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">#{payment.id}</TableCell>
                            <TableCell>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{getCustomerName(payment.customerId)}</TableCell>
                            <TableCell className="font-medium">${payment.amount.toLocaleString()}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>
                              {payment.dealId 
                                ? getDealTitle(payment.dealId) 
                                : <span className="text-gray-400">No project</span>}
                            </TableCell>
                            <TableCell>{formatPaymentStatus(payment.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No payments found.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.location.href = '/payments/new'}
                    >
                      Process your first payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Route>
      </Switch>
    </main>
  );
};

export default Payments;
