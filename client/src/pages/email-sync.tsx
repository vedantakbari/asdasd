import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Mail, Info, Plus, Trash2, Check, Edit2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

const EmailSync: React.FC = () => {
  const { toast } = useToast();
  
  // State for email account input
  const [emailInput, setEmailInput] = useState({
    email: "",
    password: "",
    displayName: "",
    server: "smtp.gmail.com",
    port: "587",
    useSSL: true
  });
  
  // State for email accounts
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for sync settings
  const [syncSettings, setSyncSettings] = useState({
    frequency: "15min",
    syncPastEmails: true,
    emailTracking: true,
    syncAllFolders: false
  });
  
  // Load email accounts when component mounts
  useEffect(() => {
    const loadEmailAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/email/accounts');
        if (response.ok) {
          const data = await response.json();
          setEmailAccounts(data);
        } else {
          // Check for specific Google configuration error
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error === 'google_config_missing') {
            setGoogleConfigError(true);
          }
        }
      } catch (error) {
        console.error('Error loading email accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEmailAccounts();
  }, []);
  
  // Add email account
  const addEmailAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call - in a real app we'd send to server
      // For demo, we'll add directly to state
      const newAccount = {
        id: Date.now(),
        email: emailInput.email,
        displayName: emailInput.displayName || emailInput.email.split('@')[0],
        provider: emailInput.email.split('@')[1],
        connected: true,
        server: emailInput.server,
        port: emailInput.port,
        useSSL: emailInput.useSSL
      };
      
      // Add locally
      setEmailAccounts([...emailAccounts, newAccount]);
      
      // Reset form and hide it
      setEmailInput({
        email: "",
        password: "",
        displayName: "",
        server: "smtp.gmail.com",
        port: "587",
        useSSL: true
      });
      setShowAddForm(false);
      
      toast({
        title: "Email account added",
        description: `${newAccount.email} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding email account:', error);
      toast({
        title: "Error",
        description: "Failed to add email account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Remove email account
  const removeEmailAccount = async (accountId: number) => {
    try {
      // In a real app, you'd call the API
      setEmailAccounts(emailAccounts.filter(account => account.id !== accountId));
      
      toast({
        title: "Account removed",
        description: "Email account removed successfully",
      });
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
      // In a real app, you'd call the API
      toast({
        title: "Success",
        description: "Email sync settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving sync settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email sync settings",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Email Sync" 
          description="Connect and manage your email accounts"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Email Sync" 
        description="Connect and manage your email accounts"
      />
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Google configuration error warning */}
          {googleConfigError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">Google API Configuration Issue</h3>
                    <p className="text-sm text-red-700">
                      The Google API credentials are missing or incorrect. Gmail integration will not work properly until this is fixed.
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-100">
                        View Setup Instructions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Account Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Email Accounts</h2>
                <Button 
                  size="sm" 
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add email account
                </Button>
              </div>
              
              {emailAccounts.length === 0 && !showAddForm && (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No email accounts connected yet.</p>
                  <p className="text-sm mt-1">Click "Add email account" to get started.</p>
                </div>
              )}
              
              {showAddForm && (
                <Card className="border-blue-100 mt-4">
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Add Email Account</h3>
                    <form onSubmit={addEmailAccount} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="email">Email address*</Label>
                          <Input 
                            id="email" 
                            type="email"
                            placeholder="your.email@gmail.com" 
                            value={emailInput.email}
                            onChange={(e) => setEmailInput({...emailInput, email: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="displayName">Display name</Label>
                          <Input 
                            id="displayName" 
                            placeholder="Your Name" 
                            value={emailInput.displayName}
                            onChange={(e) => setEmailInput({...emailInput, displayName: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="password">Password*</Label>
                          <Input 
                            id="password" 
                            type="password"
                            placeholder="••••••••" 
                            value={emailInput.password}
                            onChange={(e) => setEmailInput({...emailInput, password: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="flex flex-col mt-auto">
                          <div className="flex items-center h-10">
                            <Switch 
                              id="defaultAccount" 
                              checked={emailAccounts.length === 0} // First account is default
                              disabled={emailAccounts.length === 0}
                            />
                            <Label htmlFor="defaultAccount" className="ml-2">Make default</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <p className="text-sm font-medium mb-2">Advanced settings</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="server">SMTP Server</Label>
                            <Input 
                              id="server" 
                              placeholder="smtp.gmail.com" 
                              value={emailInput.server}
                              onChange={(e) => setEmailInput({...emailInput, server: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="port">Port</Label>
                            <Input 
                              id="port" 
                              placeholder="587" 
                              value={emailInput.port}
                              onChange={(e) => setEmailInput({...emailInput, port: e.target.value})}
                            />
                          </div>
                          
                          <div className="flex flex-col justify-end">
                            <div className="flex items-center h-10">
                              <Switch 
                                id="useSSL" 
                                checked={emailInput.useSSL}
                                onCheckedChange={(checked) => setEmailInput({...emailInput, useSSL: checked})}
                              />
                              <Label htmlFor="useSSL" className="ml-2">Use SSL/TLS</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 flex gap-2 justify-end">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setShowAddForm(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isSubmitting || !emailInput.email || !emailInput.password}
                        >
                          {isSubmitting ? 'Adding...' : 'Add account'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              
              {/* List of email accounts */}
              {emailAccounts.length > 0 && (
                <div className="space-y-2 mt-4">
                  {emailAccounts.map(account => (
                    <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <div>
                          <span className="font-medium">{account.displayName || account.email.split('@')[0]}</span>
                          <span className="text-gray-500 ml-1">&lt;{account.email}&gt;</span>
                          {account.connected && (
                            <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">
                              connected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => removeEmailAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* SMTP Relay Info */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Important: Email Setup Notice</h3>
                  <p className="text-sm text-amber-700">
                    This CRM is currently using a simplified email setup for demonstration purposes. 
                    For full Gmail integration including inbox sync and OAuth authentication, 
                    please note that you would need to:
                  </p>
                  <ul className="list-disc text-sm text-amber-700 ml-5 mt-2 space-y-1">
                    <li>Set up a Google Cloud project</li>
                    <li>Configure OAuth consent screen and credentials</li>
                    <li>Register authorized redirect URIs</li>
                    <li>Complete verification if sending to multiple users</li>
                  </ul>
                  <p className="text-sm text-amber-700 mt-2">
                    For this demo, we're using a simplified approach that allows you to see 
                    the interface and functionality without the complex OAuth setup.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
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
                
                <Button 
                  className="w-full" 
                  onClick={saveSyncSettings}
                  disabled={emailAccounts.length === 0}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Email templates */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Email templates</h2>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create template
                </Button>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No email templates yet.</p>
                <p className="text-sm mt-1">Create templates to save time when sending repetitive emails.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Signatures */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Signatures</h2>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add signature
                </Button>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <div className="h-12 w-12 mx-auto text-gray-300 mb-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p>No email signatures created yet.</p>
                <p className="text-sm mt-1">Add a signature to include in outgoing emails.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default EmailSync;