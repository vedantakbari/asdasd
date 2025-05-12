import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { LeadStatus, Lead } from '@shared/schema';
import { Link } from 'wouter';

const LeadPipeline: React.FC = () => {
  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ['/api/leads'],
  });

  // Group leads by status
  const leadsGroupedByStatus = {
    [LeadStatus.NEW]: allLeads.filter((lead: Lead) => lead.status === LeadStatus.NEW),
    [LeadStatus.CONTACTED]: allLeads.filter((lead: Lead) => lead.status === LeadStatus.CONTACTED),
    [LeadStatus.QUALIFIED]: allLeads.filter((lead: Lead) => lead.status === LeadStatus.QUALIFIED),
    [LeadStatus.PROPOSAL]: allLeads.filter((lead: Lead) => lead.status === LeadStatus.PROPOSAL),
    [LeadStatus.WON]: allLeads.filter((lead: Lead) => lead.status === LeadStatus.WON),
  };

  const statusLabels = {
    [LeadStatus.NEW]: 'New Leads',
    [LeadStatus.CONTACTED]: 'Contacted',
    [LeadStatus.QUALIFIED]: 'Qualified',
    [LeadStatus.PROPOSAL]: 'Proposal',
    [LeadStatus.WON]: 'Won',
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'status-pill status-new';
      case LeadStatus.CONTACTED:
        return 'status-pill status-contacted';
      case LeadStatus.QUALIFIED:
        return 'status-pill status-qualified';
      case LeadStatus.PROPOSAL:
        return 'status-pill status-proposal';
      case LeadStatus.WON:
        return 'status-pill status-won';
      default:
        return 'status-pill status-new';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'border-l-4 border-primary-400';
      case LeadStatus.CONTACTED:
        return 'border-l-4 border-amber-400';
      case LeadStatus.QUALIFIED:
        return 'border-l-4 border-green-400';
      case LeadStatus.PROPOSAL:
        return 'border-l-4 border-purple-400';
      case LeadStatus.WON:
        return 'border-l-4 border-green-400';
      default:
        return 'border-l-4 border-primary-400';
    }
  };

  // Function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">Lead Pipeline</CardTitle>
          <div className="flex space-x-3">
            <div className="relative">
              <Button variant="outline" size="sm" className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </Button>
            </div>
            <Link href="/leads/new">
              <Button variant="default" size="sm" className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Lead
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-5 overflow-x-auto">
        {isLoading ? (
          <div className="inline-flex min-w-full space-x-4 pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-72 flex-shrink-0 space-y-3">
                <div className="animate-pulse bg-gray-100 rounded-md h-10 mb-3"></div>
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="animate-pulse bg-gray-100 rounded-md h-24"></div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-flex min-w-full space-x-4 pb-2">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="w-72 flex-shrink-0">
                <div className="bg-gray-50 rounded-md px-4 py-3 mb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                    <span className="text-xs font-medium text-gray-700 bg-gray-200 rounded-full px-2.5 py-0.5">
                      {leadsGroupedByStatus[status]?.length || 0}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {leadsGroupedByStatus[status]?.map((lead: Lead) => (
                    <div key={lead.id} className={`bg-white shadow rounded-md p-3 ${getBorderColor(status)}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{lead.name}</h5>
                          <p className="text-xs text-gray-500 mt-1">{lead.notes?.split('\n')[0] || 'No notes'}</p>
                          <div className="flex items-center mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="text-xs text-gray-400 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-xs text-gray-600">{lead.phone || 'No phone'}</span>
                          </div>
                        </div>
                        <span className={getStatusPillClass(lead.status)}>{lead.status}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center text-xs text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatRelativeTime(lead.createdAt)}
                        </div>
                        <div>
                          <button type="button" className="text-gray-400 hover:text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {leadsGroupedByStatus[status]?.length === 0 && (
                    <div className="bg-white shadow rounded-md p-4 text-center text-gray-500 text-sm">
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadPipeline;
