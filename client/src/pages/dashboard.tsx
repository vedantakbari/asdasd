import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Header from '@/components/layout/header';
import StatCard from '@/components/dashboard/stat-card';
import TodaySchedule from '@/components/dashboard/today-schedule';
import TaskList from '@/components/dashboard/task-list';
import LeadPipeline from '@/components/dashboard/lead-pipeline';
import RecentActivity from '@/components/dashboard/recent-activity';
import CustomerOverview from '@/components/dashboard/customer-overview';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { data: dashboardSummary, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
  });

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Dashboard"
        actions={
          <>
            <Button variant="outline" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
            <Link href="/leads/new">
              <Button className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Lead
              </Button>
            </Link>
          </>
        }
      />
      
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="New Leads"
            value={dashboardLoading ? "..." : dashboardSummary?.newLeadsCount || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-xl h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            iconBgColor="bg-primary-500"
            linkUrl="/leads"
            linkText="View all"
          />
          
          <StatCard
            title="Active Deals"
            value={dashboardLoading ? "..." : dashboardSummary?.activeDealsCount || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-xl h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBgColor="bg-amber-500"
            linkUrl="/deals"
            linkText="View all"
          />
          
          <StatCard
            title="Today's Appointments"
            value={dashboardLoading ? "..." : dashboardSummary?.todaysAppointmentsCount || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-xl h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            iconBgColor="bg-green-500"
            linkUrl="/calendar"
            linkText="View calendar"
          />
          
          <StatCard
            title="Monthly Revenue"
            value={dashboardLoading ? "..." : `$${(dashboardSummary?.monthlyRevenue || 0).toLocaleString()}`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-xl h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBgColor="bg-green-500"
            linkUrl="/reports"
            linkText="View report"
          />
        </div>
        
        {/* Today's Schedule and Tasks */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <TodaySchedule />
          </div>
          <div className="lg:col-span-1">
            <TaskList />
          </div>
        </div>
        
        {/* Lead Pipeline */}
        <div className="mb-8">
          <LeadPipeline />
        </div>
        
        {/* Recent Activity and Customer Overview */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
          <div className="lg:col-span-2">
            <CustomerOverview />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
