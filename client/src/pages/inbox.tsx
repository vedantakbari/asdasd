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
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Email account interface
interface EmailAccount {
  id: number;
  email: string;
  displayName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

// Email message interface
interface EmailMessage {
  id: number;
  accountId: number;
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  sentDate: Date;
  receivedDate?: Date;
  read: boolean;
  folder: string;
  messageId?: string;
  relatedLeadId?: number;
  relatedCustomerId?: number;
  createdAt: Date;
}

// Convert API email to UI email
const mapApiEmailToUiEmail = (email: any): EmailMessage => {
  return {
    id: email.id,
    accountId: email.accountId,
    from: email.from || '',
    fromName: email.fromName,
    to: email.to || '',
    toName: email.toName,
    subject: email.subject || '(No Subject)',
    textBody: email.text || '',
    htmlBody: email.html,
    sentDate: new Date(email.sentDate),
    receivedDate: email.receivedDate ? new Date(email.receivedDate) : undefined,
    read: email.read || false,
    folder: email.folder || 'inbox',
    messageId: email.messageId,
    relatedLeadId: email.relatedLeadId,
    relatedCustomerId: email.relatedCustomerId,
    createdAt: new Date(email.createdAt)
  };
};

const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isConnectEmailOpen, setIsConnectEmailOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    displayName: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch email accounts
  const { 
    data: emailAccounts = [], 
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery({ 
    queryKey: ['/api/email/accounts'],
    enabled: true,
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
  
  // Create a new email account
  const createAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      return await apiRequest('POST', '/api/email/accounts', accountData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      setIsConnectEmailOpen(false);
      toast({
        title: 'Email Account Added',
        description: 'Your email account has been connected successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add email account',
        description: error.message || 'An error occurred while connecting your email account.',
        variant: 'destructive'
      });
    }
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
      body: composeData.body,
      html: composeData.body, // Simple version, using same content for both
    });
  };
  
  // Handle email account connection form submission
  const handleConnectEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailFormData.email || !emailFormData.smtpHost || !emailFormData.smtpUsername || !emailFormData.smtpPassword) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create account via mutation
    createAccountMutation.mutate({
      email: emailFormData.email,
      displayName: emailFormData.displayName || emailFormData.email.split('@')[0],
      smtpHost: emailFormData.smtpHost,
      smtpPort: emailFormData.smtpPort,
      smtpUsername: emailFormData.smtpUsername,
      smtpPassword: emailFormData.smtpPassword,
      imapHost: emailFormData.imapHost || emailFormData.smtpHost.replace('smtp', 'imap'),
      imapPort: emailFormData.imapPort,
      imapUsername: emailFormData.imapUsername || emailFormData.smtpUsername,
      imapPassword: emailFormData.imapPassword || emailFormData.smtpPassword,
      isDefault: emailAccounts.length === 0 // Set as default if this is the first account
    });
    
    // Reset form after submission
    setEmailFormData({
      email: '',
      displayName: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      imapHost: '',
      imapPort: 993,
      imapUsername: '',
      imapPassword: '',
    });
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
  
  // Filter and process emails from the API
  const filteredEmails = React.useMemo(() => {
    // If we don't have any messages yet, return empty array
    if (!emailMessages || emailMessages.length === 0) {
      return [];
    }
    
    // Map messages to our expected format if needed
    const processedEmails = Array.isArray(emailMessages) 
      ? emailMessages.map((msg: any) => {
          // Make sure we have a properly formatted message
          if (typeof msg !== 'object' || msg === null) {
            return null;
          }
          
          return {
            id: msg.id,
            accountId: msg.accountId,
            from: msg.from || '',
            fromName: msg.fromName,
            to: msg.to || '',
            toName: msg.toName,
            subject: msg.subject || '(No Subject)',
            textBody: msg.textBody || msg.text || '',
            htmlBody: msg.htmlBody || msg.html || '',
            sentDate: new Date(msg.sentDate),
            receivedDate: msg.receivedDate ? new Date(msg.receivedDate) : undefined,
            read: msg.read || false,
            folder: msg.folder || activeFolder,
            messageId: msg.messageId,
            relatedLeadId: msg.relatedLeadId,
            relatedCustomerId: msg.relatedCustomerId
          };
      }).filter(Boolean)
      : [];
      
    // Apply search filter if needed
    return processedEmails.filter((email: EmailMessage) => {
      if (!email) return false;
      
      // Filter by search term if one is provided
      if (searchTerm) {
        const matchesSearch = 
          email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (email.fromName && email.fromName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (email.textBody && email.textBody.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [emailMessages, activeFolder, searchTerm]);
  
  // Sort emails by date (newest first)
  const sortedEmails = React.useMemo(() => {
    return [...filteredEmails].sort((a: EmailMessage, b: EmailMessage) => 
      new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
    );
  }, [filteredEmails]);
  
  // Get unread count
  const unreadCount = React.useMemo(() => {
    return emailMessages?.filter((email: any) => 
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
            {!emailAccount.connected && (
              <Button onClick={() => setIsConnectEmailOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Connect Email
              </Button>
            )}
            {emailAccount.connected && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MailCheck className="h-4 w-4" />
                {emailAccount.email}
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
                <Tag className="h-4 w-4 mr-2 text-amber-500" />
                Important
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2 text-purple-500" />
                Personal
              </Button>
            </div>
          </div>
          
          {/* Email list and content */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Email list */}
            <div className={`${selectedEmail ? 'hidden md:block' : ''} md:w-1/3 border-r`}>
              <div className="h-full flex flex-col">
                <div className="p-2 border-b flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {activeFolder.charAt(0).toUpperCase() + activeFolder.slice(1)}
                    <span className="text-muted-foreground ml-1">({sortedEmails.length})</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {sortedEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Mail className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
                      <p className="text-muted-foreground">No emails in this folder</p>
                    </div>
                  ) : (
                    <div>
                      {sortedEmails.map((email: EmailMessage) => (
                        <div
                          key={email.id}
                          className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                            !email.read ? 'bg-blue-50' : ''
                          } ${selectedEmail?.id === email.id ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setSelectedEmail(email);
                            // Mark as read when selected - would need API call to update
                            // To be implemented in future updates
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-medium truncate">
                              {email.folder === 'sent' ? email.to : email.fromName || email.from}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {format(new Date(email.sentDate), 'MMM d')}
                            </div>
                          </div>
                          <div className="text-sm font-medium truncate">
                            {email.subject}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {email.textBody?.split('\n')[0] || ''}
                          </div>
                          {email.leadId && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                lead
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Email content */}
            {selectedEmail ? (
              <div className="flex-1 overflow-hidden flex flex-col bg-white">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="md:hidden"
                      onClick={() => setSelectedEmail(null)}
                    >
                      &larr; Back
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedEmail.folder === 'inbox' && !selectedEmail.leadId && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateLead(selectedEmail)}
                        className="text-xs"
                      >
                        <User className="h-3 w-3 mr-1" />
                        Create Lead
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold mb-4">{selectedEmail.subject}</h2>
                    
                    <div className="flex items-start mb-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                        {(selectedEmail.fromName || selectedEmail.from).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {selectedEmail.folder === 'sent' 
                                ? `To: ${selectedEmail.toName || selectedEmail.to}`
                                : selectedEmail.fromName || selectedEmail.from
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedEmail.folder === 'sent' 
                                ? selectedEmail.to
                                : selectedEmail.from
                              }
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(selectedEmail.sentDate), 'MMM d, yyyy, h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4 whitespace-pre-line">
                      {selectedEmail.htmlBody ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                      ) : (
                        selectedEmail.textBody || 'No message content'
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        onClick={() => {
                          setComposeData({
                            to: selectedEmail.folder === 'sent' ? selectedEmail.to : selectedEmail.from,
                            subject: `Re: ${selectedEmail.subject}`,
                            body: `\n\n-----Original Message-----\nFrom: ${selectedEmail.fromName || selectedEmail.from}\nDate: ${format(new Date(selectedEmail.sentDate), 'MMM d, yyyy, h:mm a')}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.textBody || ''}`
                          });
                          setIsComposeOpen(true);
                        }}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 bg-muted/10">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">Select an email to view</h3>
                  <p className="text-muted-foreground">Choose an email from the list to view its contents</p>
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
              Create a new email message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="to" className="text-sm font-medium">To:</label>
              <Input
                id="to"
                placeholder="recipient@example.com"
                value={composeData.to}
                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="subject" className="text-sm font-medium">Subject:</label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="body" className="text-sm font-medium">Message:</label>
              <Textarea
                id="body"
                placeholder="Write your message here..."
                value={composeData.body}
                onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail}>Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Connect Email Dialog */}
      <Dialog open={isConnectEmailOpen} onOpenChange={setIsConnectEmailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>
              Add your email account to send and receive messages
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnectEmail} className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={emailAccount.email}
                    onChange={(e) => setEmailAccount({...emailAccount, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
                  <Input
                    id="displayName"
                    placeholder="Your Name"
                    value={emailAccount.displayName}
                    onChange={(e) => setEmailAccount({...emailAccount, displayName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded border border-blue-100 flex gap-2">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Demo Mode Notice</p>
                  <p>This is a simplified demonstration of email integration. In a production CRM, you would connect to actual email servers or use services like Gmail/Outlook API.</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConnectEmailOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Connect Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Inbox;