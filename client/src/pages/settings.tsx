import React from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// Placeholder for the Settings page
// This will be expanded with actual functionality

const Settings: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Settings" 
        description="Manage your CRM configurations and preferences"
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your account and business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Business Information</h3>
                  <Separator />
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="companyName" className="md:col-span-1 self-center">Company Name</Label>
                      <Input id="companyName" className="md:col-span-3" placeholder="Your Company Name" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="phone" className="md:col-span-1 self-center">Phone</Label>
                      <Input id="phone" className="md:col-span-3" placeholder="(555) 123-4567" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="email" className="md:col-span-1 self-center">Email</Label>
                      <Input id="email" className="md:col-span-3" placeholder="contact@example.com" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="website" className="md:col-span-1 self-center">Website</Label>
                      <Input id="website" className="md:col-span-3" placeholder="https://example.com" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Regional Settings</h3>
                  <Separator />
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="timezone" className="md:col-span-1 self-center">Timezone</Label>
                      <select 
                        id="timezone" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-3"
                      >
                        <option value="US/Eastern">Eastern Time (US & Canada)</option>
                        <option value="US/Central">Central Time (US & Canada)</option>
                        <option value="US/Mountain">Mountain Time (US & Canada)</option>
                        <option value="US/Pacific">Pacific Time (US & Canada)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="dateFormat" className="md:col-span-1 self-center">Date Format</Label>
                      <select 
                        id="dateFormat" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-3"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-leads">New Leads</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications when new leads are created</p>
                    </div>
                    <Switch id="new-leads" defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="deal-updates">Deal Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications when deals change stage</p>
                    </div>
                    <Switch id="deal-updates" defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-reminders">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">Receive reminders about upcoming and overdue tasks</p>
                    </div>
                    <Switch id="task-reminders" defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="appointment-alerts">Appointment Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts before scheduled appointments</p>
                    </div>
                    <Switch id="appointment-alerts" defaultChecked={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <p className="text-yellow-800 font-medium mb-2">⚠️ Coming Soon</p>
                  <p className="text-yellow-700 text-sm">
                    Team management functionality will be available in an upcoming update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect your CRM with other services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
                          <path d="m7 16.5-4.74-2.85" />
                          <path d="m7 16.5 5-3" />
                          <path d="M7 16.5V21" />
                          <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
                          <path d="m17 16.5-5-3" />
                          <path d="m17 16.5 4.74-2.85" />
                          <path d="M17 16.5V21" />
                          <path d="M15.97 5.33A2 2 0 0 0 15 3.62V2.66a2 2 0 0 0-1-1.73l-.3-.17a2 2 0 0 0-2 0l-3.32 1.97L12 6l4.03-2.4Z" />
                          <path d="m12 6-4.74-2.85" />
                          <path d="m12 6 4.74-2.85" />
                          <path d="M12 6v4.5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Stripe</h3>
                        <p className="text-sm text-gray-500">Payment processing integration</p>
                      </div>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 4H9a3 3 0 0 0-2.83 4" />
                          <path d="M14 12a4 4 0 0 1 0 8H6" />
                          <path d="M6 12h8" />
                          <path d="M6 16h8" />
                          <path d="M9 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Google Calendar</h3>
                        <p className="text-sm text-gray-500">Sync your appointments</p>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7 11 2-2-2-2" />
                          <path d="M11 13h4" />
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Zapier</h3>
                        <p className="text-sm text-gray-500">Connect with 3000+ apps</p>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Settings;