import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Activity } from '@shared/schema';
import { format, formatDistanceToNow } from 'date-fns';

const RecentActivity: React.FC = () => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/activities/recent'],
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'lead_created':
        return (
          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'call_completed':
        return (
          <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        );
      case 'deal_won':
        return (
          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'proposal_sent':
        return (
          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'appointment_scheduled':
      case 'appointment_created':
        return (
          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'payment_received':
        return (
          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      
      <CardContent className="flow-root px-6 py-5">
        {isLoading ? (
          <ul className="-mb-8">
            {[...Array(5)].map((_, index) => (
              <li key={index}>
                <div className="relative pb-8">
                  {index < 4 && <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>}
                  <div className="relative flex items-start space-x-3">
                    <div className="animate-pulse relative flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="min-w-0 flex-1 py-1.5 space-y-1">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="animate-pulse h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="-mb-8">
            {activities.map((activity: Activity, idx: number) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx < activities.length - 1 && (
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">
                            {activity.activityType.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {' - '}
                          {activity.description}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-3 bg-gray-50 rounded-b-lg">
        <Link href="/activities" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View all activity
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentActivity;
