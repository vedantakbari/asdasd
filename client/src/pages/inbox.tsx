import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Trash, 
  Mail, 
  Archive, 
  Tag, 
  Send, 
  Star,
  Inbox as InboxIcon,
  FilePlus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  User,
  Info,
  MailCheck,
  Loader,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

// Email account interface updated for Gmail OAuth
interface EmailAccount {
  id: number;
  email: string;
  displayName: string | null;
  provider: string;
  connected: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isDefault: boolean;
  lastSynced: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Email message interface
interface EmailMessage {
  id: number;
  accountId: number;
  externalId: string | null;
  threadId: string | null;
  from: string;
  fromName: string | null;
  to: string;
  toName: string | null;
  subject: string;
  textBody: string;
  htmlBody: string | null;
  snippet: string | null;
  sentDate: Date;
  receivedDate: Date | null;
  read: boolean;
  folder: string;
  labelIds: string | null;
  relatedLeadId: number | null;
  relatedCustomerId: number | null;
  createdAt: Date;
}

const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isConnectEmailOpen, setIsConnectEmailOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isSyncingEmails, setIsSyncingEmails] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch email accounts
  const { 
    data: emailAccounts = [], 
    isLoading: isLoadingAccounts,
    error: accountsError,
    refetch: refetchAccounts
  } = useQuery({ 
    queryKey: ['/api/email/accounts'],
    enabled: !!user,
  });
  
  // Get emails from selected account
  const { 
    data: emailMessages = [], 
    isLoading: isLoadingEmails,
    error: emailsError,
    refetch: refetchEmails,
  } = useQuery({ 
    queryKey: ['/api/email/messages', selectedAccountId, activeFolder],
    enabled: selectedAccountId !== null,
  });
  
  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      return await apiRequest('POST', '/api/email/send', emailData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/messages', selectedAccountId, 'sent'] });
      setIsComposeOpen(false);
      toast({
        title: 'Email Sent',
        description: 'Your email has been sent successfully.',
      });
      setComposeData({
        to: '',
        subject: '',
        body: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send email',
        description: error.message || 'An error occurred while sending your email.',
        variant: 'destructive'
      });
    }
  });
  
  // Sync emails mutation
  const syncEmailsMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return await apiRequest('POST', `/api/email/sync/${accountId}`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/messages', selectedAccountId, activeFolder] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      
      toast({
        title: 'Emails Synced',
        description: `Successfully synced ${data.syncedCount || 0} new messages.`,
      });
      setIsSyncingEmails(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'An error occurred while syncing your emails.',
        variant: 'destructive'
      });
      setIsSyncingEmails(false);
    }
  });
  
  // Set default selected account when accounts are loaded
  useEffect(() => {
    if (emailAccounts && emailAccounts.length > 0 && !selectedAccountId) {
      // Find default account or use the first one
      const defaultAccount = emailAccounts.find((account: EmailAccount) => account.isDefault) || emailAccounts[0];
      setSelectedAccountId(defaultAccount.id);
    }
  }, [emailAccounts, selectedAccountId]);
  
  // Handle compose data from session storage
  useEffect(() => {
    // Check for compose data in session storage (from other pages)
    const composeEmailData = sessionStorage.getItem('composeEmail');
    if (composeEmailData) {
      try {
        const parsedData = JSON.parse(composeEmailData);
        setComposeData({
          to: parsedData.to || '',
          subject: parsedData.subject || '',
          body: parsedData.body || ''
        });
        
        if (parsedData.open) {
          setIsComposeOpen(true);
        }
        
        // Clear the session storage after reading
        sessionStorage.removeItem('composeEmail');
      } catch (error) {
        console.error('Failed to parse compose email data:', error);
      }
    }
  }, []);
  
  // Send email via API
  const handleSendEmail = () => {
    if (!selectedAccountId) {
      toast({
        title: 'No Email Account Selected',
        description: 'Please connect an email account before sending emails.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!composeData.to || !composeData.subject) {
      toast({
        title: 'Missing information',
        description: 'Please fill in both recipient and subject fields.',
        variant: 'destructive'
      });
      return;
    }
    
    // Send email via mutation
    sendEmailMutation.mutate({
      accountId: selectedAccountId,
      to: composeData.to,
      subject: composeData.subject,
      textBody: composeData.body,
      htmlBody: composeData.body, // Simple version, using same content for both
    });
  };
  
  // Sync emails for an account
  const handleSyncEmails = () => {
    if (!selectedAccountId) {
      toast({
        title: 'No Email Account Selected',
        description: 'Please select an email account to sync.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSyncingEmails(true);
    syncEmailsMutation.mutate(selectedAccountId);
  };
  
  // Create lead from email sender
  const handleCreateLead = (email: EmailMessage) => {
    // Create new lead in the API
    apiRequest('POST', '/api/leads', {
      name: email.fromName || email.from.split('@')[0],
      email: email.from,
      source: 'Email',
      status: 'New'
    })
    .then(() => {
      // Update email with relatedLeadId (requires backend API update)
      if (selectedAccountId) {
        refetchEmails();
      }
      
      toast({
        title: 'Lead Created',
        description: `A new lead has been created from ${email.fromName || email.from}.`,
      });
    })
    .catch(error => {
      toast({
        title: 'Failed to create lead',
        description: error.message || 'An error occurred while creating the lead.',
        variant: 'destructive'
      });
    });
  };
  
  // Get connected account from the selection
  const selectedAccount = selectedAccountId 
    ? emailAccounts.find((acc: EmailAccount) => acc.id === selectedAccountId) 
    : null;
  
  // Filter and process emails from the API
  const filteredEmails = React.useMemo(() => {
    // If we don't have any messages yet, return empty array
    if (!emailMessages || !Array.isArray(emailMessages) || emailMessages.length === 0) {
      return [];
    }
    
    // Apply search filter if needed
    return emailMessages.filter((email: EmailMessage) => {
      if (!email) return false;
      
      // Filter by search term if one is provided
      if (searchTerm) {
        const matchesSearch = 
          (email.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (email.from || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (email.fromName && email.fromName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (email.textBody && email.textBody.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (email.snippet && email.snippet.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [emailMessages, searchTerm]);
  
  // Sort emails by date (newest first)
  const sortedEmails = React.useMemo(() => {
    if (!filteredEmails || !Array.isArray(filteredEmails)) return [];
    
    return [...filteredEmails].sort((a: EmailMessage, b: EmailMessage) => {
      const dateA = a.receivedDate || a.sentDate;
      const dateB = b.receivedDate || b.sentDate;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [filteredEmails]);
  
  // Get unread count
  const unreadCount = React.useMemo(() => {
    if (!emailMessages || !Array.isArray(emailMessages)) return 0;
    
    return emailMessages.filter((email: EmailMessage) => 
      email.folder === 'inbox' && !email.read
    ).length || 0;
  }, [emailMessages]);
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col bg-background">
        <div className="border-b p-4 sm:px-6 flex flex-col md:flex-row justify-between md:items-center gap-2">
          <h1 className="text-2xl font-semibold">Inbox</h1>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-[300px]"
            />
            <Button onClick={() => setIsComposeOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Compose
            </Button>
            {(!selectedAccount || !selectedAccount.connected) && (
              <Button onClick={() => setIsConnectEmailOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Connect Email
              </Button>
            )}
            {selectedAccount && selectedAccount.connected && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MailCheck className="h-4 w-4" />
                {selectedAccount.email}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="hidden md:block w-64 border-r p-4 overflow-y-auto">
            <div className="space-y-1">
              <Button
                variant={activeFolder === 'inbox' ? 'default' : 'ghost'} 
                className="w-full justify-start"
                onClick={() => setActiveFolder('inbox')}
              >
                <InboxIcon className="h-4 w-4 mr-2" />
                Inbox
                {unreadCount > 0 && (
                  <Badge className="ml-auto">{unreadCount}</Badge>
                )}
              </Button>
              <Button
                variant={activeFolder === 'sent' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveFolder('sent')}
              >
                <Send className="h-4 w-4 mr-2" />
                Sent
              </Button>
              <Button
                variant={activeFolder === 'starred' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveFolder('starred')}
              >
                <Star className="h-4 w-4 mr-2" />
                Starred
              </Button>
              <Button
                variant={activeFolder === 'archive' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveFolder('archive')}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button
                variant={activeFolder === 'trash' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveFolder('trash')}
              >
                <Trash className="h-4 w-4 mr-2" />
                Trash
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-1">
              <h3 className="font-medium text-sm mb-2">Labels</h3>
              <Button variant="ghost" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2 text-blue-500" />
                Clients
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2 text-green-500" />
                Leads
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2 text-yellow-500" />
                Deals
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-1">
              <h3 className="font-medium text-sm mb-2">Email Accounts</h3>
              {emailAccounts && emailAccounts.length > 0 ? (
                emailAccounts.map((account: EmailAccount) => (
                  <Button 
                    key={account.id} 
                    variant={selectedAccountId === account.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedAccountId(account.id)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {account.displayName || account.email}
                    {account.connected && <MailCheck className="ml-auto h-3 w-3 text-green-500" />}
                  </Button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No email accounts connected
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => setIsConnectEmailOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Account
              </Button>
              
              {selectedAccount && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={handleSyncEmails}
                  disabled={isSyncingEmails || !selectedAccount.connected}
                >
                  {isSyncingEmails ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sync Emails
                </Button>
              )}
            </div>
          </div>
          
          {/* Email list and content area */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Email list */}
            <div className={`border-r ${selectedEmail ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
              <div className="p-2 border-b flex items-center justify-between bg-muted/30">
                <h2 className="text-sm font-medium capitalize">
                  {activeFolder}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => refetchEmails()}
                  disabled={isLoadingEmails || isSyncingEmails}
                >
                  {isLoadingEmails || isSyncingEmails ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Email list content */}
              <div className="overflow-auto h-[calc(100vh-15rem)]">
                {isLoadingEmails ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : emailsError ? (
                  <div className="p-4 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <h3 className="font-medium">Failed to load emails</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeof emailsError === 'object' && emailsError !== null 
                        ? (emailsError as any).message || 'An error occurred' 
                        : 'An error occurred while fetching emails'}
                    </p>
                    <Button 
                      className="mt-2" 
                      variant="outline" 
                      onClick={() => refetchEmails()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : !selectedAccount ? (
                  <div className="p-4 text-center">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium">No Email Account Selected</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please select or connect an email account to view messages.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsConnectEmailOpen(true)}
                    >
                      Connect Gmail Account
                    </Button>
                  </div>
                ) : !selectedAccount.connected ? (
                  <div className="p-4 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <h3 className="font-medium">Email Account Not Connected</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This email account needs to be authenticated with Gmail.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => window.location.href = '/api/email/gmail/auth'}
                    >
                      Connect to Gmail
                    </Button>
                  </div>
                ) : sortedEmails.length === 0 ? (
                  <div className="p-4 text-center">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium">No emails found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeFolder === 'inbox' 
                        ? "Your inbox is empty."
                        : `No emails found in ${activeFolder}.`}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={handleSyncEmails}
                      disabled={isSyncingEmails}
                    >
                      {isSyncingEmails ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Sync Emails
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div>
                    {sortedEmails.map((email: EmailMessage) => (
                      <div 
                        key={email.id}
                        className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors flex flex-col ${!email.read ? 'bg-primary/5 font-medium' : ''}`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm truncate flex-1">
                            {activeFolder === 'sent' 
                              ? `To: ${email.toName || email.to}` 
                              : email.fromName || email.from}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {format(new Date(email.sentDate), 'MMM d')}
                          </span>
                        </div>
                        <div className="text-sm font-medium truncate mb-1">
                          {email.subject}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {email.snippet || email.textBody?.substring(0, 100) || '(No content)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Email content */}
            {selectedEmail && (
              <div className={`flex-1 flex flex-col overflow-hidden ${selectedEmail ? 'block' : 'hidden md:block'}`}>
                <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedEmail(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    <span className="sr-only">Back</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                      <span className="sr-only">Archive</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                    {(selectedEmail.folder === 'inbox' && !selectedEmail.relatedLeadId) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handleCreateLead(selectedEmail)}
                      >
                        <FilePlus className="h-4 w-4" />
                        Create Lead
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="p-6 overflow-auto flex-1">
                  <div className="mb-6">
                    <h1 className="text-xl font-semibold mb-4">{selectedEmail.subject}</h1>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-medium">
                          {activeFolder === 'sent' 
                            ? `To: ${selectedEmail.toName || selectedEmail.to}` 
                            : `From: ${selectedEmail.fromName || selectedEmail.from}`}
                        </div>
                        {selectedEmail.relatedLeadId && (
                          <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            Connected to Lead
                          </div>
                        )}
                        {selectedEmail.relatedCustomerId && (
                          <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            Connected to Customer
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedEmail.receivedDate || selectedEmail.sentDate), 'PPpp')}
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="prose prose-sm max-w-none">
                    {/* Use HTML content if available, otherwise use plain text */}
                    {selectedEmail.htmlBody ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} 
                        className="email-content"
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedEmail.textBody || '(No content)'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <Button 
                      onClick={() => {
                        setComposeData({
                          to: selectedEmail.folder === 'sent' ? selectedEmail.to : selectedEmail.from,
                          subject: selectedEmail.subject.startsWith('Re:') 
                            ? selectedEmail.subject 
                            : `Re: ${selectedEmail.subject}`,
                          body: `\n\n------------ Original Message ------------\nFrom: ${selectedEmail.fromName || selectedEmail.from}\nDate: ${format(new Date(selectedEmail.receivedDate || selectedEmail.sentDate), 'PPpp')}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.textBody}`
                        });
                        setIsComposeOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty state when no email is selected */}
            {!selectedEmail && (
              <div className="hidden md:flex flex-1 items-center justify-center bg-muted/10">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/70" />
                  <h2 className="text-xl font-medium mb-1">Select an email to view</h2>
                  <p className="text-muted-foreground">
                    Choose an email from the list to view its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Create and send a new email.
            </DialogDescription>
          </DialogHeader>
          
          {emailAccounts.length === 0 ? (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <h3 className="font-medium mb-1">No Email Account Connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You need to connect an email account before sending emails.
              </p>
              <Button onClick={() => {
                setIsComposeOpen(false);
                setIsConnectEmailOpen(true);
              }}>
                Connect Email Account
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedAccountId || ''}
                    onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
                  >
                    {emailAccounts.map((account: EmailAccount) => (
                      <option key={account.id} value={account.id}>
                        {account.displayName ? `${account.displayName} <${account.email}>` : account.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Input 
                    value={composeData.to}
                    onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    value={composeData.subject}
                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                    placeholder="Email subject"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    value={composeData.body}
                    onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                    placeholder="Type your message here..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Connect Email Dialog */}
      <Dialog open={isConnectEmailOpen} onOpenChange={setIsConnectEmailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>
              Connect your Gmail account to send and receive emails.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Connect with Gmail</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Gmail account securely using OAuth. This gives the app limited access to your email without storing your password.
            </p>
            <Button 
              type="button" 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                window.location.href = '/api/email/gmail/auth';
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Gmail
            </Button>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground flex items-start">
            <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <p>
              This CRM uses Gmail's secure API to access your emails. Your password is never stored, and 
              you can revoke access at any time from your Google Account.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Inbox;