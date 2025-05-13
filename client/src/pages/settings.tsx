import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Mail, Info, Plus, Trash2, Check, AlertCircle, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Settings: React.FC = () => {
  const { toast } = useToast();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      onClick: () => void;
    }>;
  }>({
    title: "",
    message: "",
    actions: []
  });
  
  // State for Google credentials
  const [googleCredentials, setGoogleCredentials] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: ""
  });
  
  // State to track if credentials are saved
  const [credentialsStatus, setCredentialsStatus] = useState({
    clientId: false,
    clientSecret: false,
    redirectUri: false,
    isConfigured: false
  });
  
  // State for email accounts
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  
  // State for sync settings
  const [syncSettings, setSyncSettings] = useState({
    frequency: "15min",
    syncPastEmails: true,
    emailTracking: true,
    syncAllFolders: false
  });
  
  // Load OAuth credentials status when component mounts
  useEffect(() => {
    const checkCredentialsStatus = async () => {
      try {
        const response = await fetch('/api/google/credentials-status');
        if (response.ok) {
          const data = await response.json();
          setCredentialsStatus(data);
        }
      } catch (error) {
        console.error('Error checking credentials status:', error);
      }
    };
    
    const loadEmailAccounts = async () => {
      try {
        const response = await fetch('/api/email/accounts');
        if (response.ok) {
          const data = await response.json();
          setEmailAccounts(data);
        }
      } catch (error) {
        console.error('Error loading email accounts:', error);
      }
    };
    
    checkCredentialsStatus();
    loadEmailAccounts();
  }, []);
  
  // Save Google credentials
  const saveGoogleCredentials = async () => {
    try {
      const response = await fetch('/api/settings/google-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleCredentials),
      });
      
      if (response.ok) {
        toast({
          title: "Credentials saved",
          description: "Your Google API credentials have been saved successfully.",
        });
        
        // Refresh credentials status
        const statusResponse = await fetch('/api/google/credentials-status');
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setCredentialsStatus(data);
        }
      } else {
        toast({
          title: "Error saving credentials",
          description: "There was a problem saving your Google API credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving Google credentials:', error);
      toast({
        title: "Error saving credentials",
        description: "There was a problem saving your Google API credentials.",
        variant: "destructive",
      });
    }
  };
  
  // Connect Gmail account
  const connectGmailAccount = async () => {
    setIsConnectingEmail(true);
    try {
      const response = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'gmail' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        toast({
          title: "Error connecting Gmail",
          description: "There was a problem connecting your Gmail account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting Gmail account:', error);
      toast({
        title: "Error connecting Gmail",
        description: "There was a problem connecting your Gmail account.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingEmail(false);
    }
  };
  
  // Remove email account
  const removeEmailAccount = async (accountId: number) => {
    try {
      const response = await fetch(`/api/email/accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEmailAccounts(emailAccounts.filter(account => account.id !== accountId));
        toast({
          title: "Account removed",
          description: "The email account has been removed successfully.",
        });
      } else {
        toast({
          title: "Error removing account",
          description: "There was a problem removing the email account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing email account:', error);
      toast({
        title: "Error removing account",
        description: "There was a problem removing the email account.",
        variant: "destructive",
      });
    }
  };
  
  // Save sync settings
  const saveSyncSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your email sync settings have been updated.",
    });
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Settings" 
        description="Manage your CRM configurations and preferences"
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <Tabs defaultValue="email">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email Sync</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Sync
                </CardTitle>
                <CardDescription>Connect and manage your email accounts</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Email Accounts Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Connected Email Accounts</h3>
                  
                  {emailAccounts.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg p-6 text-center">
                      <Mail className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                      <p className="text-muted-foreground">No email accounts connected yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your email to send messages directly from the CRM
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {emailAccounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between border rounded-md p-4">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-3 text-blue-500" />
                            <div>
                              <p className="font-medium">{account.email}</p>
                              <p className="text-sm text-muted-foreground">{account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}</p>
                            </div>
                          </div>
                          <div>
                            {account.isDefault && (
                              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 mr-3">
                                Default
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeEmailAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      onClick={connectGmailAccount} 
                      disabled={isConnectingEmail || !credentialsStatus.isConfigured}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isConnectingEmail ? 'Connecting...' : 'Connect Email Account'}
                    </Button>
                    
                    {!credentialsStatus.isConfigured && (
                      <Alert variant="warning" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Google API Configuration Required</AlertTitle>
                        <AlertDescription>
                          You need to configure your Google API credentials before connecting your email account.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Google API Credentials Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Google API Credentials</h3>
                    {credentialsStatus.isConfigured && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Configured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="clientId">Client ID</Label>
                      <div className="flex">
                        <Input 
                          id="clientId" 
                          value={googleCredentials.clientId} 
                          onChange={(e) => setGoogleCredentials({...googleCredentials, clientId: e.target.value})}
                          placeholder={credentialsStatus.clientId ? "••••••••••••••••••••••••••••••••" : "Enter your Google Client ID"}
                          type={credentialsStatus.clientId ? "password" : "text"}
                          className="flex-1"
                        />
                        {credentialsStatus.clientId && (
                          <div className="ml-2 flex items-center text-sm text-green-600">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <div className="flex">
                        <Input 
                          id="clientSecret" 
                          value={googleCredentials.clientSecret} 
                          onChange={(e) => setGoogleCredentials({...googleCredentials, clientSecret: e.target.value})}
                          placeholder={credentialsStatus.clientSecret ? "••••••••••••••••••••••••••••••••" : "Enter your Google Client Secret"}
                          type={credentialsStatus.clientSecret ? "password" : "text"}
                          className="flex-1"
                        />
                        {credentialsStatus.clientSecret && (
                          <div className="ml-2 flex items-center text-sm text-green-600">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button onClick={saveGoogleCredentials} className="mt-2">
                      Save Credentials
                    </Button>
                    
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertTitle>How to get your Google API credentials</AlertTitle>
                      <AlertDescription>
                        <ol className="list-decimal ml-5 text-sm space-y-1 mt-2">
                          <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                          <li>Create a new project or select an existing one</li>
                          <li>Go to "Credentials" and click "Create Credentials" &gt; "OAuth client ID"</li>
                          <li>Select "Web application" as the application type</li>
                          <li>Add "{window.location.origin}" as an authorized JavaScript origin</li>
                          <li>Add "{window.location.origin}/api/auth/google/callback" as an authorized redirect URI</li>
                          <li>Click "Create" and copy your Client ID and Client Secret</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
                
                <Separator />
                
                {/* Email Sync Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Email Sync Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sync-frequency" className="mb-1 block">Email Sync Frequency</Label>
                        <p className="text-sm text-muted-foreground">How often to check for new emails</p>
                      </div>
                      <select 
                        id="sync-frequency" 
                        value={syncSettings.frequency}
                        onChange={(e) => setSyncSettings({...syncSettings, frequency: e.target.value})}
                        className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="5min">Every 5 minutes</option>
                        <option value="15min">Every 15 minutes</option>
                        <option value="30min">Every 30 minutes</option>
                        <option value="60min">Every hour</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="sync-past-emails" 
                        checked={syncSettings.syncPastEmails}
                        onCheckedChange={(checked) => setSyncSettings({...syncSettings, syncPastEmails: checked})}
                      />
                      <div>
                        <Label htmlFor="sync-past-emails" className="mb-1 block">Sync past emails</Label>
                        <p className="text-sm text-muted-foreground">Import emails from the last 30 days</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="email-tracking" 
                        checked={syncSettings.emailTracking}
                        onCheckedChange={(checked) => setSyncSettings({...syncSettings, emailTracking: checked})}
                      />
                      <div>
                        <Label htmlFor="email-tracking" className="mb-1 block">Email tracking</Label>
                        <p className="text-sm text-muted-foreground">Track when recipients open emails and click links</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="sync-all-folders" 
                        checked={syncSettings.syncAllFolders}
                        onCheckedChange={(checked) => setSyncSettings({...syncSettings, syncAllFolders: checked})}
                      />
                      <div>
                        <Label htmlFor="sync-all-folders" className="mb-1 block">Sync all folders</Label>
                        <p className="text-sm text-muted-foreground">Include emails from all folders, not just the inbox</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={saveSyncSettings} className="mt-6">
                    Save Sync Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
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
                      <Input id="phone" className="md:col-span-3" placeholder="Your Phone Number" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Label htmlFor="address" className="md:col-span-1 self-center">Address</Label>
                      <Input id="address" className="md:col-span-3" placeholder="Your Business Address" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Account Preferences</h3>
                  <Separator />
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-base font-medium">Dark Mode</h4>
                      <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                    </div>
                    <Switch id="dark-mode" />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-base font-medium">Notification Sounds</h4>
                      <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                    </div>
                    <Switch id="notification-sounds" defaultChecked />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save General Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure when and how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="new-lead-notification">New Leads</Label>
                      <p className="text-sm text-muted-foreground">Get notified when a new lead is created</p>
                    </div>
                    <Switch id="new-lead-notification" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="task-due-notification">Task Due Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified when tasks are due soon</p>
                    </div>
                    <Switch id="task-due-notification" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="appointment-notification">Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified about upcoming appointments</p>
                    </div>
                    <Switch id="appointment-notification" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="new-message-notification">New Messages</Label>
                      <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
                    </div>
                    <Switch id="new-message-notification" defaultChecked />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button>Save Notification Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage team access and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Team member management is available on the Pro plan and above.
                </p>
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
                  <div className="flex items-center justify-between border p-4 rounded-md">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-md mr-4">
                        <Mail className="text-blue-600 h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">Google Calendar</h4>
                        <p className="text-sm text-muted-foreground">Sync your appointments with Google Calendar</p>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between border p-4 rounded-md">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-md mr-4">
                        <Mail className="text-purple-600 h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">Stripe</h4>
                        <p className="text-sm text-muted-foreground">Process payments with Stripe</p>
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
      
      {/* Dialog for showing debug info and confirmations */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              <div dangerouslySetInnerHTML={{ __html: dialogContent.message }} />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            {dialogContent.actions?.map((action, index) => (
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