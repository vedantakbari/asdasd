import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Appointment } from '@shared/schema';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

const TodaySchedule: React.FC = () => {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments/today'],
  });

  const determineColorClass = (index: number) => {
    const colors = [
      "bg-primary-50 border-l-4 border-primary-500",
      "bg-amber-50 border-l-4 border-amber-500",
      "bg-green-50 border-l-4 border-green-500",
      "bg-gray-50 border-l-4 border-gray-300"
    ];
    return colors[index % colors.length];
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}`;
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">Today's Schedule</CardTitle>
          <div className="flex space-x-3">
            <button 
              type="button" 
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg> 
              Month
            </button>
            <button 
              type="button" 
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg> 
              Week
            </button>
            <button 
              type="button" 
              className="text-sm font-medium text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg> 
              Day
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-md"></div>
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {appointments.map((appointment: Appointment, index: number) => (
              <div key={appointment.id} className={`rounded-md p-3 ${determineColorClass(index)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold">
                      {formatTimeRange(appointment.startTime, appointment.endTime)}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900 mt-1">{appointment.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{appointment.location}</p>
                  </div>
                  <div className="flex">
                    <button type="button" className="text-gray-400 hover:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button type="button" className="ml-2 text-gray-400 hover:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No appointments scheduled for today</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-6 py-3 bg-gray-50 rounded-b-lg">
        <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
          + Add appointment
        </button>
      </CardFooter>
    </Card>
  );
};

export default TodaySchedule;
