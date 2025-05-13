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
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
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
        // Check credentials status
        const response = await fetch('/api/google/credentials-status');
        if (response.ok) {
          const data = await response.json();
          console.log("Google credentials status:", data);
          setCredentialsStatus(data);
          
          // If credentials are configured, fetch the actual credential values to populate the form
          if (data.isConfigured) {
            try {
              const credResponse = await fetch('/api/google/credentials');
              if (credResponse.ok) {
                const credData = await credResponse.json();
                
                if (credData) {
                  setGoogleCredentials({
                    clientId: credData.clientId || "",
                    clientSecret: credData.clientSecret || "",
                  });
                }
              }
            } catch (credError) {
              console.error('Error fetching Google credentials:', credError);
            }
          }
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
      // Validate credentials before saving
      if (!googleCredentials.clientId.trim()) {
        toast({
          title: "Error",
          description: "Client ID is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!googleCredentials.clientSecret.trim()) {
        toast({
          title: "Error",
          description: "Client Secret is required",
          variant: "destructive",
        });
        return;
      }
      
      // Generate the redirect URI based on current location
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      
      const response = await fetch('/api/settings/google-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...googleCredentials,
          redirectUri
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message || "Google API credentials saved successfully",
        });
        
        // Refresh credentials status
        const statusResponse = await fetch('/api/google/credentials-status');
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setCredentialsStatus(data);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save Google API credentials",
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
      // Validate the email
      if (!newEmail.trim()) {
        toast({
          title: "Error",
          description: "Please enter your email address",
          variant: "destructive",
        });
        setIsConnectingEmail(false);
        return;
      }
      
      // Ensure Google credentials are configured
      if (!credentialsStatus.isConfigured) {
        toast({
          title: "Error",
          description: "Please configure Google API credentials first",
          variant: "destructive",
        });
        setIsConnectingEmail(false);
        return;
      }
      
      // Log for debugging
      console.log("Connecting Gmail account with email:", newEmail);
      
      const response = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          provider: 'gmail',
          email: newEmail.trim() 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          // Save the request and redirect
          console.log("Redirecting to:", data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          toast({
            title: "Error",
            description: "Failed to get OAuth redirect URL",
            variant: "destructive",
          });
          setIsConnectingEmail(false);
        }
      } else {
        // Try to parse error response
        let errorMessage = "Failed to connect Gmail account";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (err) {
          // If response can't be parsed as JSON
          errorMessage = "Unexpected server response";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsConnectingEmail(false);
      }
    } catch (error) {
      console.error('Error connecting Gmail account:', error);
      toast({
        title: "Error",
        description: "Failed to connect Gmail account",
        variant: "destructive",
      });
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
                      <span className="font-medium">
                        {senderName ? `${senderName} <${emailAccounts[0].email}>` : emailAccounts[0].email}
                      </span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        verified
                      </Badge>
                    </div>
                  ) : (
                    <>
                      {showEmailInput ? (
                        <div className="flex items-end gap-2">
                          <div>
                            <Input
                              id="newEmail"
                              type="email"
                              placeholder="your.email@gmail.com"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              disabled={isConnectingEmail}
                              className="w-60"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={connectGmailAccount}
                              disabled={isConnectingEmail || !credentialsStatus.isConfigured || !newEmail.trim()}
                            >
                              {isConnectingEmail ? (
                                <>Connecting<span className="animate-pulse">...</span></>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowEmailInput(false)}
                              disabled={isConnectingEmail}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => setShowEmailInput(true)}
                            disabled={!credentialsStatus.isConfigured}
                          >
                            Connect email
                          </Button>
                          
                          {!credentialsStatus.isConfigured && (
                            <span className="text-amber-600 text-sm ml-2">
                              Google API credentials required
                            </span>
                          )}
                        </div>
                      )}
                    </>
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
          
          {/* Google API configuration */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-medium mb-4">Google API Configuration</h2>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="clientId">Google Client ID</Label>
                  <Input 
                    id="clientId" 
                    placeholder="Your Google Client ID" 
                    value={googleCredentials.clientId}
                    onChange={(e) => setGoogleCredentials({...googleCredentials, clientId: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From Google Cloud Console - OAuth 2.0 Client ID
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="clientSecret">Google Client Secret</Label>
                  <Input 
                    id="clientSecret" 
                    type="password"
                    placeholder="Your Google Client Secret" 
                    value={googleCredentials.clientSecret}
                    onChange={(e) => setGoogleCredentials({...googleCredentials, clientSecret: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From Google Cloud Console - OAuth 2.0 Client Secret
                  </p>
                </div>
                
                <Button 
                  onClick={saveGoogleCredentials}
                >
                  Save Credentials
                </Button>
                
                {credentialsStatus.isConfigured && (
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      API Credentials configured
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Connected accounts */}
          {emailAccounts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-medium mb-4">Connected accounts</h2>
                
                <div className="space-y-2">
                  {emailAccounts.map(account => (
                    <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>{account.email}</span>
                        {account.connected && (
                          <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">
                            connected
                          </Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeEmailAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Sync settings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Sync settings</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="syncFrequency">Sync frequency</Label>
                  <select 
                    id="syncFrequency" 
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={syncSettings.frequency}
                    onChange={(e) => setSyncSettings({...syncSettings, frequency: e.target.value})}
                  >
                    <option value="5min">Every 5 minutes</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="30min">Every 30 minutes</option>
                    <option value="60min">Every hour</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="syncAllFolders">Sync all folders</Label>
                    <p className="text-xs text-muted-foreground">Include all mail folders in sync</p>
                  </div>
                  <Switch 
                    id="syncAllFolders" 
                    checked={syncSettings.syncAllFolders}
                    onCheckedChange={(checked) => setSyncSettings({...syncSettings, syncAllFolders: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trackEmails">Email tracking</Label>
                    <p className="text-xs text-muted-foreground">Track email opens and clicks</p>
                  </div>
                  <Switch 
                    id="trackEmails" 
                    checked={syncSettings.emailTracking}
                    onCheckedChange={(checked) => setSyncSettings({...syncSettings, emailTracking: checked})}
                  />
                </div>
                
                <Button className="w-full">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default EmailSync;