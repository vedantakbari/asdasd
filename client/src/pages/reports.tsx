import React from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// This is a placeholder for the Reports page
// It will be implemented later with actual reporting functionality

const Reports: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Reports" 
        description="View business analytics and performance metrics"
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports Coming Soon</CardTitle>
              <CardDescription>
                This section will provide detailed analytics and reporting features.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800 font-medium mb-2">⚠️ Feature in Development</p>
                <p className="text-yellow-700 text-sm">
                  The reporting functionality is currently under development and will be available soon.
                  When completed, it will include:
                </p>
                <ul className="mt-2 text-yellow-700 text-sm list-disc list-inside">
                  <li>Revenue reports and forecasts</li>
                  <li>Lead conversion analytics</li>
                  <li>Service performance metrics</li>
                  <li>Customer satisfaction tracking</li>
                  <li>Team productivity statistics</li>
                  <li>Custom report generation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default Reports;