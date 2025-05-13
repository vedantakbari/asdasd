import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// Placeholder for the Settings page
// This will be expanded with actual functionality

const Settings: React.FC = () => {
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    actions: Array<{
      label: string;
      onClick: () => void;
    }>;
  }>({
    title: "",
    message: "",
    actions: []
  });
  
  // State for essential redirect URIs
  const [essentialURIs, setEssentialURIs] = useState<string[]>([]);
  
  // Load essential URIs when the component mounts
  useEffect(() => {
    const loadEssentialURIs = async () => {
      try {
        const response = await fetch('/api/auth/google/config');
        if (response.ok) {
          const data = await response.json();
          setEssentialURIs(data.essentialRedirectURIs || []);
          
          // Update the URIs list in the DOM
          const urisList = document.getElementById('essentialUrisList');
          if (urisList && data.essentialRedirectURIs && data.essentialRedirectURIs.length > 0) {
            urisList.innerHTML = data.essentialRedirectURIs.map((uri: string) => 
              `<div class="py-1 flex">
                <span class="text-green-600 mr-2">✓</span>
                <code class="break-all">${uri}</code>
              </div>`
            ).join('');
          }
        }
      } catch (error) {
        console.error('Failed to load essential URIs:', error);
      }
    };
    
    loadEssentialURIs();
  }, []);
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
            <TabsTrigger value="email">Email Settings</TabsTrigger>
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
          
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure your email accounts and manage your Gmail integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connected Email Accounts Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Connected Email Accounts</h3>
                  <Separator />
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <h4 className="text-yellow-800 font-medium mb-2">Gmail Integration Instructions</h4>
                    <p className="text-yellow-700 text-sm mb-2">
                      To connect your Gmail account, follow these steps:
                    </p>
                    <ol className="text-yellow-700 text-sm space-y-2 ml-4 list-decimal">
                      <li>Click on the "Connect Gmail Account" button in the Inbox tab</li>
                      <li>You'll be redirected to Google's login page</li>
                      <li>Sign in with your Gmail account and grant the requested permissions</li>
                      <li>After successful authentication, you'll be redirected back to the CRM</li>
                      <li>Your Gmail account will now appear in the Connected Accounts list</li>
                    </ol>
                  </div>
                  
                  {/* Google API Configuration Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <h4 className="text-blue-800 font-medium mb-2">Google API Configuration</h4>
                    <p className="text-blue-700 text-sm mb-4">
                      For Gmail integration to work properly, you need to configure your Google OAuth credentials.
                      Please follow these steps to ensure your Google OAuth is properly configured:
                    </p>
                    
                    <div className="space-y-6">
                      {/* Step 1: Create Google OAuth credentials */}
                      <div>
                        <h5 className="text-blue-800 font-medium mb-2 text-sm">Step 1: Create OAuth Credentials</h5>
                        <ol className="text-blue-700 text-sm space-y-2 ml-4 list-decimal mb-4">
                          <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a></li>
                          <li>Select your project or create a new one</li>
                          <li>Go to "Credentials" and create an OAuth Client ID</li>
                          <li>For "Application type" select "Web application"</li>
                          <li>Under "Authorized JavaScript origins" add: <code className="bg-gray-100 px-1">{window.location.origin}</code></li>
                          <li><strong>For "Authorized redirect URIs", add ONLY the Essential URIs shown below</strong></li>
                        </ol>
                        
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                          <h6 className="font-semibold text-sm mb-2">Essential Redirect URIs:</h6>
                          <div id="essentialUrisList" className="mb-3 bg-white p-2 rounded border border-green-200 text-xs font-mono max-h-32 overflow-y-auto">
                            <div className="animate-pulse flex space-x-4 items-center">
                              <div className="rounded-full bg-slate-200 h-4 w-4"></div>
                              <div className="flex-1 space-y-2 py-1">
                                <div className="h-2 bg-slate-200 rounded"></div>
                              </div>
                            </div>
                            <div className="text-gray-400 text-center mt-2">Loading URIs...</div>
                          </div>
                          
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                <strong>Important:</strong> Add ALL URIs shown above to avoid "accounts.google.com refused to connect" errors.
                              </p>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 text-xs"
                                onClick={() => {
                                  const redirectUris = essentialURIs.join('\n');
                                  navigator.clipboard.writeText(redirectUris)
                                    .then(() => {
                                      alert("Essential redirect URIs copied to clipboard! Paste these into your Google Cloud Console's 'Authorized redirect URIs' field.");
                                    })
                                    .catch(err => {
                                      console.error('Could not copy text: ', err);
                                      alert("Please manually copy the URIs above.");
                                    });
                                }}
                              >
                                Copy All URIs to Clipboard
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                <strong>Important:</strong> Replit domains can change. To avoid authentication errors, use the helper below to get the precise redirect URIs you need.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <Button 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full font-medium"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/google/redirect-uri-debug');
                                const data = await response.json();
                                
                                setIsDialogOpen(true);
                                setDialogContent({
                                  title: "Google OAuth Configuration Helper",
                                  message: `
                                    <div class="mb-4 bg-blue-50 p-3 rounded border border-blue-200">
                                      <p class="font-semibold text-blue-800">Essential Redirect URIs</p>
                                      <p class="text-blue-700 text-sm mb-2">Add ONLY these ${data.essentialRedirectURIs.length} URIs to Google Cloud Console:</p>
                                    </div>
                                    
                                    <div class="max-h-60 overflow-y-auto bg-gray-100 p-2 rounded font-mono text-xs mb-4">
                                      ${data.essentialRedirectURIs.map((uri, i) => `<div class="py-1 flex">
                                        <span class="text-green-600 mr-2">✓</span>
                                        <span class="break-all">${uri}</span>
                                      </div>`).join('')}
                                    </div>
                                    
                                    <p class="text-sm font-medium mb-2">Instructions:</p>
                                    <ol class="list-decimal ml-5 text-sm space-y-1 mb-3">
                                      <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
                                      <li>Edit your OAuth 2.0 Client ID</li>
                                      <li>Under "Authorized redirect URIs", add each URI shown above</li>
                                      <li>Click SAVE when done</li>
                                    </ol>
                                    
                                    <p class="bg-yellow-50 p-2 rounded border border-yellow-200 text-sm text-yellow-800">
                                      <strong>Important:</strong> Adding ALL of these URIs is necessary to prevent "accounts.google.com refused to connect" errors.
                                    </p>
                                    
                                    <div class="mt-3 text-xs text-gray-500">
                                      <div>Current domain: ${data.currentDomain}</div>
                                      <div>Configured URI: ${data.configuredCallbackUrl || "None"}</div>
                                    </div>
                                  `,
                                  actions: [
                                    {
                                      label: "Copy Essential URIs",
                                      onClick: () => {
                                        // Format the essential redirect URIs as a list
                                        const redirectUris = data.essentialRedirectURIs ? 
                                          data.essentialRedirectURIs.join('\n') : 
                                          data.allPossibleRedirectURIs.join('\n');
                                        
                                        navigator.clipboard.writeText(redirectUris)
                                          .then(() => {
                                            alert("Essential redirect URIs copied to clipboard. Add these to your Google Cloud Console under 'Authorized redirect URIs' field.");
                                          })
                                          .catch(err => {
                                            console.error('Could not copy text: ', err);
                                            alert("Essential redirect URIs:\n\n" + redirectUris);
                                          });
                                      }
                                    },
                                    {
                                      label: "Close",
                                      onClick: () => setIsDialogOpen(false)
                                    }
                                  ]
                                });
                              } catch (error) {
                                console.error('Failed to check Google config:', error);
                                alert('Error checking Google configuration');
                              }
                            }}
                          >
                            Get OAuth Configuration Help
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="text-orange-600 border-orange-200 hover:bg-orange-50 w-full"
                            onClick={async () => {
                              const confirmReset = window.confirm("Are you sure you want to reset all Gmail connections? This will remove all connected accounts.");
                              
                              if (confirmReset) {
                                try {
                                  const response = await fetch('/api/email/accounts');
                                  const accounts = await response.json();
                                  
                                  // Delete all Gmail accounts
                                  for (const account of accounts) {
                                    if (account.provider === 'gmail') {
                                      await fetch(`/api/email/accounts/${account.id}`, {
                                        method: 'DELETE'
                                      });
                                    }
                                  }
                                  
                                  alert("All Gmail connections have been reset. You can now try connecting again with your updated Google OAuth credentials.");
                                } catch (error) {
                                  console.error('Failed to reset Gmail connections:', error);
                                  alert('Error resetting Gmail connections');
                                }
                              }
                            }}
                          >
                            Reset Gmail Connections
                          </Button>
                        </div>
                      </div>
                      
                      {/* Step 2: Update Google OAuth credentials in the CRM */}
                      <div>
                        <h5 className="text-blue-800 font-medium mb-2 text-sm">Step 2: Update Google OAuth Credentials</h5>
                        <p className="text-blue-700 text-sm mb-4">
                          After creating your OAuth credentials, update them below:
                        </p>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="googleClientId" className="text-sm">Google Client ID</Label>
                            <Input 
                              id="googleClientId" 
                              placeholder="Your Google Client ID (starts with 123456789012-...)" 
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-gray-500">Get this from Google Cloud Console</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="googleClientSecret" className="text-sm">Google Client Secret</Label>
                            <Input 
                              id="googleClientSecret" 
                              type="password"
                              placeholder="Your Google Client Secret" 
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-gray-500">Keep this secret secure</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="googleRedirectUri" className="text-sm">Google Redirect URI</Label>
                            <Input 
                              id="googleRedirectUri" 
                              placeholder={`${window.location.origin}/api/auth/google/callback`}
                              className="font-mono text-xs"
                              defaultValue={`${window.location.origin}/api/auth/google/callback`}
                            />
                            <p className="text-xs text-gray-500">This must match one of the redirect URIs in your Google Cloud Console</p>
                          </div>
                          
                          <Button
                            className="w-full mt-2"
                            onClick={async () => {
                              const clientId = (document.getElementById('googleClientId') as HTMLInputElement)?.value;
                              const clientSecret = (document.getElementById('googleClientSecret') as HTMLInputElement)?.value;
                              const redirectUri = (document.getElementById('googleRedirectUri') as HTMLInputElement)?.value;
                              
                              if (!clientId || !clientSecret || !redirectUri) {
                                alert('Please fill in all Google OAuth credential fields');
                                return;
                              }
                              
                              try {
                                const response = await fetch('/api/settings/google-credentials', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    clientId, 
                                    clientSecret, 
                                    redirectUri 
                                  })
                                });
                                
                                const data = await response.json();
                                
                                if (data.success) {
                                  // Better UI using dialogs rather than alerts
                                  setIsDialogOpen(true);
                                  setDialogContent({
                                    title: "Google OAuth Credentials Updated",
                                    message: "Your Google OAuth credentials have been updated successfully. The system needs to restart for these changes to take effect.",
                                    actions: [
                                      {
                                        label: "Restart Now",
                                        onClick: async () => {
                                          setDialogContent({
                                            title: "Restarting...",
                                            message: "Please wait while the system restarts with your new credentials.",
                                            actions: []
                                          });
                                          
                                          try {
                                            await fetch('/api/restart-workflow', {
                                              method: 'POST',
                                            });
                                            
                                            // After requesting restart, update dialog
                                            setTimeout(() => {
                                              setDialogContent({
                                                title: "Restart Requested",
                                                message: "The system has received your restart request. Please reload the page in a few seconds to continue with your newly updated credentials.",
                                                actions: [
                                                  {
                                                    label: "Close",
                                                    onClick: () => setIsDialogOpen(false)
                                                  }
                                                ]
                                              });
                                            }, 2000);
                                          } catch (error) {
                                            console.error("Error requesting restart:", error);
                                            setDialogContent({
                                              title: "Restart Failed",
                                              message: "Unable to automatically restart the system. Please refresh the page manually to apply the new credentials.",
                                              actions: [
                                                {
                                                  label: "Close",
                                                  onClick: () => setIsDialogOpen(false)
                                                }
                                              ]
                                            });
                                          }
                                        }
                                      },
                                      {
                                        label: "Cancel",
                                        onClick: () => setIsDialogOpen(false)
                                      }
                                    ]
                                  });
                                } else {
                                  setIsDialogOpen(true);
                                  setDialogContent({
                                    title: "Failed to Update Credentials",
                                    message: data.message || "An unknown error occurred",
                                    actions: [
                                      {
                                        label: "Close",
                                        onClick: () => setIsDialogOpen(false)
                                      }
                                    ]
                                  });
                                }
                              } catch (error) {
                                console.error('Error updating Google credentials:', error);
                                alert('Error updating Google credentials. See console for details.');
                              }
                            }}
                          >
                            Update Google OAuth Credentials
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="flex items-center gap-2" onClick={() => window.location.href = '/inbox'}>
                      <svg viewBox="0 0 48 48" width="24" height="24">
                        <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                        <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                        <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
                        <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                      </svg>
                      Connect Gmail Account
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Connect your Gmail account to send and receive emails directly from the CRM.
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Email Signature</h4>
                    <Textarea 
                      placeholder="Enter your email signature..." 
                      className="min-h-[120px]"
                      defaultValue="Your Name\nYour Position\nYour Company\nYour Contact Information"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      This signature will be added to all emails sent from the CRM.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Sync Settings</h3>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-bcc">Auto-BCC Myself</Label>
                      <p className="text-sm text-muted-foreground">Automatically BCC yourself on all outgoing emails</p>
                    </div>
                    <Switch id="auto-bcc" defaultChecked={false} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sync-frequency">Email Sync Frequency</Label>
                      <p className="text-sm text-muted-foreground">How often to check for new emails</p>
                    </div>
                    <select 
                      id="sync-frequency" 
                      className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="5min">Every 5 minutes</option>
                      <option value="15min">Every 15 minutes</option>
                      <option value="30min">Every 30 minutes</option>
                      <option value="60min">Every hour</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Email Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Dialog for showing debug info and confirmations */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {dialogContent.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            {dialogContent.actions.map((action, index) => (
              <Button 
                key={index} 
                onClick={action.onClick}
                variant={index === 0 ? "default" : "outline"}
              >
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Settings;