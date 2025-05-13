import React, { useState } from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

const EmailSync: React.FC = () => {
  const { toast } = useToast();
  
  // State for email account form
  const [emailInput, setEmailInput] = useState({
    email: "",
    password: "",
    displayName: "",
    server: "smtp.gmail.com",
    port: "587"
  });
  
  // State for email accounts
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Add email account
  const addEmailAccount = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!emailInput.email || !emailInput.password) {
      toast({
        title: "Missing fields",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }
    
    // Create new account object
    const newAccount = {
      id: Date.now(),
      email: emailInput.email,
      displayName: emailInput.displayName || emailInput.email.split('@')[0],
      provider: emailInput.email.split('@')[1],
      server: emailInput.server,
      port: emailInput.port,
      connected: true
    };
    
    // Add to accounts list
    setEmailAccounts([...emailAccounts, newAccount]);
    
    // Reset form
    setEmailInput({
      email: "",
      password: "",
      displayName: "",
      server: "smtp.gmail.com",
      port: "587"
    });
    
    // Hide form
    setShowForm(false);
    
    // Show success message
    toast({
      title: "Account added",
      description: `${newAccount.email} has been added successfully.`,
    });
  };
  
  // Remove email account
  const removeAccount = (id: number) => {
    setEmailAccounts(emailAccounts.filter(account => account.id !== id));
    
    toast({
      title: "Account removed",
      description: "Email account removed successfully",
    });
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Email Sync" 
        description="Connect and manage your email accounts"
      />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Accounts section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Email Accounts</h2>
                <Button 
                  size="sm" 
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add email account
                </Button>
              </div>
              
              {emailAccounts.length === 0 && !showForm && (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No email accounts connected yet.</p>
                  <p className="text-sm mt-1">Click "Add email account" to get started.</p>
                </div>
              )}
              
              {/* Connected accounts list */}
              {emailAccounts.length > 0 && (
                <div className="space-y-2 mb-4">
                  {emailAccounts.map(account => (
                    <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <div>
                          <span className="font-medium">{account.displayName}</span>
                          <span className="text-gray-500 ml-1">&lt;{account.email}&gt;</span>
                          <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">
                            connected
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => removeAccount(account.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add account form */}
              {showForm && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <h3 className="font-medium mb-4">Add Email Account</h3>
                  <form onSubmit={addEmailAccount} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="email">Email address</Label>
                        <Input 
                          id="email" 
                          type="email"
                          placeholder="your.email@gmail.com" 
                          value={emailInput.email}
                          onChange={(e) => setEmailInput({...emailInput, email: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          type="password"
                          placeholder="••••••••" 
                          value={emailInput.password}
                          onChange={(e) => setEmailInput({...emailInput, password: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="displayName">Display name (optional)</Label>
                        <Input 
                          id="displayName" 
                          placeholder="Your Name" 
                          value={emailInput.displayName}
                          onChange={(e) => setEmailInput({...emailInput, displayName: e.target.value})}
                        />
                      </div>
                      
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600">
                          Advanced settings
                        </summary>
                        <div className="mt-2 space-y-3 pl-2">
                          <div>
                            <Label htmlFor="server">SMTP Server</Label>
                            <Input 
                              id="server" 
                              placeholder="smtp.gmail.com" 
                              value={emailInput.server}
                              onChange={(e) => setEmailInput({...emailInput, server: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="port">Port</Label>
                            <Input 
                              id="port" 
                              placeholder="587" 
                              value={emailInput.port}
                              onChange={(e) => setEmailInput({...emailInput, port: e.target.value})}
                            />
                          </div>
                        </div>
                      </details>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Add account
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Demo Mode Notice</h3>
                  <p className="text-sm text-amber-700">
                    This is a simplified demonstration of email integration. In a production CRM, 
                    emails would be synchronized with actual email servers. No emails will be 
                    sent or received in this demo mode.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </main>
  );
};

export default EmailSync;