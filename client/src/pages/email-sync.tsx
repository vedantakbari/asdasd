import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Mail, Info, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

const EmailSync: React.FC = () => {
  const { toast } = useToast();
  
  // State for Google credentials
  const [googleCredentials, setGoogleCredentials] = useState({
    clientId: "",
    clientSecret: "",
  });
  
  // State to track if credentials are saved
  const [credentialsStatus, setCredentialsStatus] = useState({
    clientId: false,
    clientSecret: false,
    isConfigured: false
  });
  
  // State for email accounts
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  
  // State for sender name
  const [senderName, setSenderName] = useState("");
  
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
          title: "Success",
          description: "Google API credentials saved successfully",
        });
        
        // Refresh credentials status
        const statusResponse = await fetch('/api/google/credentials-status');
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setCredentialsStatus(data);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save Google API credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving Google credentials:', error);
      toast({
        title: "Error",
        description: "Failed to save Google API credentials",
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
          title: "Error",
          description: "Failed to connect Gmail account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting Gmail account:', error);
      toast({
        title: "Error",
        description: "Failed to connect Gmail account",
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
          description: "Email account removed successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove email account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing email account:', error);
      toast({
        title: "Error",
        description: "Failed to remove email account",
        variant: "destructive",
      });
    }
  };
  
  // Save sync settings
  const saveSyncSettings = async () => {
    try {
      const response = await fetch('/api/email/sync-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncSettings),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sync settings saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save email sync settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving sync settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email sync settings",
        variant: "destructive",
      });
    }
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Email Sync" 
        description="Connect and manage your email accounts"
      />
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Account details section */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-medium mb-4">Account details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <Label htmlFor="senderName">Sender name</Label>
                    <Input 
                      id="senderName" 
                      placeholder="Your Name" 
                      className="max-w-xs"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="email" className="w-24">Email</Label>
                  {emailAccounts.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emailAccounts[0].email}</span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        verified
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={connectGmailAccount}
                        disabled={isConnectingEmail || !credentialsStatus.isConfigured}
                      >
                        {isConnectingEmail ? 'Connecting...' : 'Connect email'}
                      </Button>
                      
                      {!credentialsStatus.isConfigured && (
                        <span className="text-amber-600 text-sm ml-2">
                          Google API credentials required
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Switch 
                    id="defaultAccount" 
                    checked={emailAccounts.length > 0}
                    disabled={emailAccounts.length === 0}
                  />
                  <Label htmlFor="defaultAccount">Default email account</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sync past emails */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Sync past emails</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="syncStartDate">Sync start date</Label>
                  <select 
                    id="syncStartDate" 
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={syncSettings.frequency}
                    onChange={(e) => setSyncSettings({...syncSettings, frequency: e.target.value})}
                  >
                    <option value="3days">3 days ago (May 10, 2025)</option>
                    <option value="1week">1 week ago</option>
                    <option value="1month">1 month ago</option>
                    <option value="3months">3 months ago</option>
                  </select>
                </div>
                
                <Button onClick={saveSyncSettings} size="sm">Sync</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Signatures */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Signatures</h2>
              </div>
              
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add signature
              </Button>
            </CardContent>
          </Card>
          
          {/* Advanced settings */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-medium mb-4">Advanced settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Email tracking</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="trackOpen" 
                        checked={syncSettings.emailTracking}
                        onCheckedChange={(checked) => setSyncSettings({...syncSettings, emailTracking: checked})}
                      />
                      <Label htmlFor="trackOpen">Track when recipients open emails</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="trackClicks" 
                        checked={syncSettings.emailTracking}
                        onCheckedChange={(checked) => setSyncSettings({...syncSettings, emailTracking: checked})}
                      />
                      <Label htmlFor="trackClicks">Track when recipients click links in emails</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="trackActivity" 
                        checked={true}
                      />
                      <Label htmlFor="trackActivity">Get alerts in Pipedrive for email tracking activities</Label>
                    </div>
                  </div>
                </div>
                
                <Button onClick={saveSyncSettings} size="sm">Save</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Default email visibility */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-medium mb-4">Default email visibility</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input 
                    type="radio" 
                    id="sharedVisibility" 
                    name="emailVisibility" 
                    className="mt-1" 
                    defaultChecked 
                  />
                  <div>
                    <Label htmlFor="sharedVisibility" className="font-medium">Shared - visible to all</Label>
                    <p className="text-sm text-muted-foreground">Email conversations will be visible to all users when linked to CRM items.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <input 
                    type="radio" 
                    id="privateVisibility" 
                    name="emailVisibility" 
                    className="mt-1" 
                  />
                  <div>
                    <Label htmlFor="privateVisibility" className="font-medium">Private</Label>
                    <p className="text-sm text-muted-foreground">Email conversations will be visible only to you, even when linked to CRM items.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Synced folders */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Synced folders</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="syncAllFolders" 
                    name="syncFolders" 
                    checked={syncSettings.syncAllFolders}
                    onChange={() => setSyncSettings({...syncSettings, syncAllFolders: true})}
                  />
                  <Label htmlFor="syncAllFolders">Sync emails from all folders</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="syncSelectedFolders" 
                    name="syncFolders" 
                    checked={!syncSettings.syncAllFolders}
                    onChange={() => setSyncSettings({...syncSettings, syncAllFolders: false})}
                  />
                  <Label htmlFor="syncSelectedFolders">Select folders to sync emails from</Label>
                </div>
                
                {!syncSettings.syncAllFolders && (
                  <div className="ml-6 pl-2 border-l-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="folder-inbox" defaultChecked />
                      <Label htmlFor="folder-inbox">Inbox</Label>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="folder-sent" defaultChecked />
                      <Label htmlFor="folder-sent">Sent</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="folder-drafts" />
                      <Label htmlFor="folder-drafts">Drafts</Label>
                    </div>
                  </div>
                )}
                
                <Button onClick={saveSyncSettings} size="sm" className="mt-2">Save</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Account management */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-medium mb-4">Account management</h2>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={connectGmailAccount}
                  disabled={isConnectingEmail || !credentialsStatus.isConfigured}
                >
                  {isConnectingEmail ? 'Connecting...' : 'Connect email account'}
                </Button>
                
                {emailAccounts.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removeEmailAccount(emailAccounts[0].id)}
                  >
                    Remove account
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Google API configuration */}
          {!credentialsStatus.isConfigured && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-medium text-amber-800">Google API Configuration Required</h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-amber-700">
                    Before you can connect your email account, you need to configure your Google API credentials.
                  </p>
                
                  <div className="grid gap-2">
                    <Label htmlFor="clientId" className="text-amber-800">Client ID</Label>
                    <Input 
                      id="clientId" 
                      value={googleCredentials.clientId} 
                      onChange={(e) => setGoogleCredentials({...googleCredentials, clientId: e.target.value})}
                      placeholder="Enter your Google Client ID"
                      className="border-amber-200"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="clientSecret" className="text-amber-800">Client Secret</Label>
                    <Input 
                      id="clientSecret" 
                      value={googleCredentials.clientSecret} 
                      onChange={(e) => setGoogleCredentials({...googleCredentials, clientSecret: e.target.value})}
                      placeholder="Enter your Google Client Secret"
                      className="border-amber-200"
                    />
                  </div>
                  
                  <Button onClick={saveGoogleCredentials} className="bg-amber-600 hover:bg-amber-700">
                    Save Credentials
                  </Button>
                  
                  <div className="bg-white p-4 rounded-md border border-amber-200">
                    <h3 className="font-medium text-amber-800 mb-2">How to get Google API credentials</h3>
                    <ol className="list-decimal ml-5 text-sm space-y-1 text-amber-700">
                      <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">Google Cloud Console</a></li>
                      <li>Create a new project or select an existing one</li>
                      <li>Go to "Credentials" and click "Create Credentials" &gt; "OAuth client ID"</li>
                      <li>Select "Web application" as the application type</li>
                      <li>Add "{window.location.origin}" as an authorized JavaScript origin</li>
                      <li>Add "{window.location.origin}/api/auth/google/callback" as an authorized redirect URI</li>
                      <li>Click "Create" and copy your Client ID and Client Secret</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
};

export default EmailSync;