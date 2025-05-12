import React, { useState, useEffect } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import { Appointment } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppointmentForm from './appointment-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const CalendarView: React.FC = () => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Calculate start and end dates for fetching appointments based on current view
  const calculateDateRange = () => {
    if (view === 'day') {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (view === 'week') {
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      // Month view
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  };

  const { start, end } = calculateDateRange();

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments/range', { start: start.toISOString(), end: end.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/range?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    }
  });

  // Format appointments for the calendar
  const events = appointments.map((appointment: Appointment) => ({
    id: appointment.id,
    title: appointment.title,
    start: new Date(appointment.startTime),
    end: new Date(appointment.endTime),
    resource: appointment,
  }));

  // Handle slot selection
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setIsCreateDialogOpen(true);
  };

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event.resource);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              onClick={() => setView('day')}
            >
              Day
            </Button>
          </div>
          <div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Appointment</DialogTitle>
                </DialogHeader>
                <AppointmentForm 
                  onClose={() => setIsCreateDialogOpen(false)} 
                  initialStartTime={selectedSlot?.start}
                  initialEndTime={selectedSlot?.end}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div style={{ height: 'calc(100vh - 250px)' }}>
          {isLoading ? (
            <div className="h-full flex justify-center items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view as any}
              onView={(newView) => setView(newView)}
              date={date}
              onNavigate={setDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              style={{ height: '100%' }}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              eventPropGetter={(event) => {
                // Customize event appearance based on appointment type
                let backgroundColor = '#3b82f6'; // Default primary blue
                const appointment = event.resource as Appointment;
                
                // Just for example: Assign colors based on appointment's relationships
                if (appointment.leadId) {
                  backgroundColor = '#f59e0b'; // Amber for leads
                } else if (appointment.dealId) {
                  backgroundColor = '#10b981'; // Green for deals
                }
                
                return {
                  style: {
                    backgroundColor,
                    borderRadius: '4px',
                    opacity: 0.8,
                    color: 'white',
                    border: '0px',
                    display: 'block'
                  }
                };
              }}
            />
          )}
        </div>
      </Card>

      {/* View/Edit Appointment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentForm 
              appointment={selectedAppointment}
              isEdit
              onClose={() => setIsViewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;
