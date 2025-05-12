import React, { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Header from '@/components/layout/header';
import CalendarView from '@/components/calendar/calendar-view';
import AppointmentForm from '@/components/calendar/appointment-form';
import GoogleCalendarSettings from '@/components/calendar/google-calendar-settings';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Share2 } from 'lucide-react';

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
  
  const [activeTab, setActiveTab] = useState<string>("calendar");
  
  const copyBookingUrl = () => {
    const url = `${window.location.origin}/booking/1`;
    navigator.clipboard.writeText(url);
    
    // In a real app, we'd use a toast notification
    alert("Booking URL copied to clipboard!");
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Calendar" 
        description="Schedule and manage appointments"
        actions={
          <>
            {activeTab === "calendar" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mr-2">
                <Calendar className="mr-2 h-4 w-4" />
                Add Appointment
              </Button>
            )}
            <Button variant="outline" onClick={copyBookingUrl}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Booking Link
            </Button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8">
          <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="settings">Google Calendar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-6">
              <CalendarView />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <GoogleCalendarSettings />
            </TabsContent>
          </Tabs>
        </div>
        
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
