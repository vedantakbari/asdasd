import React, { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import CalendarView from '@/components/calendar/calendar-view';
import AppointmentForm from '@/components/calendar/appointment-form';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CalendarPage: React.FC = () => {
  const [location] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Get query parameters (for appointment creation with prefilled values)
  const getQueryParam = (name: string): string | null => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
  };
  
  // Create props for appointment form based on query params
  const getAppointmentFormProps = () => {
    const dealId = getQueryParam('dealId');
    const customerId = getQueryParam('customerId');
    const leadId = getQueryParam('leadId');
    
    return {
      dealId: dealId ? parseInt(dealId) : undefined,
      customerId: customerId ? parseInt(customerId) : undefined,
      leadId: leadId ? parseInt(leadId) : undefined,
    };
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Calendar" 
        description="Schedule and manage appointments"
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Appointment
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <CalendarView />
        
        {/* Create Appointment Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Appointment</DialogTitle>
            </DialogHeader>
            <AppointmentForm 
              onClose={() => setIsCreateDialogOpen(false)} 
              {...getAppointmentFormProps()}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default CalendarPage;
