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
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EmailAccount {
  id: number;
  userId: number;
  provider: string;
  email: string;
  connected: boolean | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  lastSynced: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmailMessage {
  id: number;
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  folder: string;
  leadId: number | null;
}

// Email account dialog state
interface AddEmailDialogData {
  provider: string;
  email: string;
}

// Convert API date string to Date object
const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isAddEmailAccountOpen, setIsAddEmailAccountOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [leadId, setLeadId] = useState<number | undefined>(undefined);
  const [addEmailData, setAddEmailData] = useState<AddEmailDialogData>({
    provider: 'gmail',
    email: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check for status in URL (after redirecting back from OAuth)
  useEffect(() => {
    // Check URL params for OAuth status
    const url = new URL(window.location.href);
    const status = url.searchParams.get('status');
    const accountId = url.searchParams.get('accountId');
    
    if (status) {
      // Remove the parameters
      url.searchParams.delete('status');
      url.searchParams.delete('accountId');
      window.history.replaceState({}, document.title, url.toString());
      
      if (status === 'success') {
        toast({
          title: 'Email Account Connected',
          description: 'Your email account has been connected successfully.',
          variant: 'default'
        });
        
        // If accountId is provided, select it
        if (accountId) {
          setSelectedAccountId(parseInt(accountId));
        }
        
        // Refresh email accounts and messages
        queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/email/messages'] });
      } else if (status === 'error') {
        toast({
          title: 'Connection Failed',
          description: 'There was an error connecting your email account. Please try again.',
          variant: 'destructive'
        });
      } else if (status === 'account_exists') {
        toast({
          title: 'Account Already Connected',
          description: 'This email account is already connected to your profile.',
          variant: 'default'
        });
      }
    }
    
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
        
        // Set the lead ID if provided
        if (parsedData.leadId) {
          setLeadId(parsedData.leadId);
        }
        
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
  
  // Fetch email accounts
  const { data: emailAccounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['/api/email/accounts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/email/accounts');
      const data = await res.json();
      return data as EmailAccount[];
    }
  });
  
  // Fetch email messages
  const { data: emailData, isLoading: isLoadingEmails } = useQuery({
    queryKey: ['/api/email/messages', activeFolder, selectedAccountId],
    queryFn: async () => {
      let url = `/api/email/messages?folder=${activeFolder}`;
      if (selectedAccountId) {
        url += `&accountId=${selectedAccountId}`;
      }
      const res = await apiRequest('GET', url);
      const data = await res.json();
      
      // Convert date strings to Date objects
      if (data.messages) {
        data.messages.forEach((msg: any) => {
          msg.date = new Date(msg.date);
        });
      }
      
      return data;
    }
  });
  
  // Add email account mutation
  const addEmailAccountMutation = useMutation({
    mutationFn: async (accountData: AddEmailDialogData) => {
      const res = await apiRequest('POST', '/api/email/accounts', accountData);
      return res.json();
    },
    onSuccess: (data) => {
      // Check if OAuth redirect is needed
      if (data.redirectUrl) {
        // For Gmail and other OAuth providers, redirect to auth URL
        toast({
          title: 'Authentication Required',
          description: 'You will be redirected to sign in with your provider.',
        });
        window.location.href = data.redirectUrl;
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      setIsAddEmailAccountOpen(false);
      setAddEmailData({ provider: 'gmail', email: '' });
      toast({
        title: 'Email Account Added',
        description: 'Your email account has been connected successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Email Account',
        description: 'There was an error connecting your email account.',
        variant: 'destructive'
      });
    }
  });
  
  // Delete email account mutation
  const deleteEmailAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const res = await apiRequest('DELETE', `/api/email/accounts/${accountId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/accounts'] });
      if (selectedAccountId) {
        setSelectedAccountId(undefined);
      }
      toast({
        title: 'Email Account Removed',
        description: 'Your email account has been disconnected.',
      });
    }
  });
  
  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { accountId: number, to: string, subject: string, body: string, leadId?: number }) => {
      // We'll add leadId to the request if we have one
      const res = await apiRequest('POST', '/api/email/send', data);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/messages'] });
      
      // If we're sending to a lead/client, log it as an activity
      if (variables.leadId) {
        // Create an activity record for this email
        const activity = {
          userId: 1,
          activityType: "email_sent",
          description: `Email sent to ${variables.to} with subject: ${variables.subject}`,
          entityType: "lead",
          entityId: variables.leadId
        };
        
        apiRequest("POST", "/api/activities", activity)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities/entity/lead/' + variables.leadId] });
          })
          .catch(error => {
            console.error("Failed to log email activity:", error);
          });
      }
      
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
      toast({
        title: 'Email Sent',
        description: 'Your email has been sent successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to Send Email',
        description: 'There was an error sending your email.',
        variant: 'destructive'
      });
    }
  });
  
  // Convert email to lead mutation
  const convertToLeadMutation = useMutation({
    mutationFn: async (data: { emailId: number, fromName?: string, fromEmail: string }) => {
      const res = await apiRequest('POST', '/api/email/convert-to-lead', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Lead Created',
        description: `A new lead has been created from the email: ${data.lead.name}`,
      });
    }
  });
  
  // Get email messages
  const emails = emailData?.messages || [];
  
  // Filter emails by search term
  const filteredEmails = emails.filter((email: EmailMessage) => {
    const matchesSearch = searchTerm === '' || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  // Sort emails by date (newest first)
  const sortedEmails = [...filteredEmails].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const handleComposeSubmit = () => {
    if (!selectedAccountId) {
      toast({
        title: 'No Email Account Selected',
        description: 'Please select an email account to send from.',
        variant: 'destructive'
      });
      return;
    }
    
    sendEmailMutation.mutate({
      accountId: selectedAccountId,
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body
    });
  };
  
  const handleCreateLead = (email: EmailMessage) => {
    convertToLeadMutation.mutate({
      emailId: email.id,
      fromEmail: email.from,
      fromName: email.fromName
    });
  };
  
  const renderEmailList = () => {
    if (isLoadingEmails) {
      return (
        <div className="border rounded-md overflow-hidden flex items-center justify-center p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        </div>
      );
    }
    
    if (emailAccounts.length === 0) {
      return (
        <div className="border rounded-md overflow-hidden p-8 text-center">
          <div className="flex flex-col items-center">
            <Mail size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Email Accounts Connected</h3>
            <p className="text-sm text-gray-500 mb-4">
              Connect your email account to see your messages here.
            </p>
            <Button onClick={() => setIsAddEmailAccountOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Email Account
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="border rounded-md overflow-hidden">
        {sortedEmails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No emails found in this folder
          </div>
        ) : (
          <div className="divide-y">
            {sortedEmails.map((email) => (
              <div 
                key={email.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${email.read ? '' : 'font-semibold bg-gray-50'} ${selectedEmail?.id === email.id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-sm">
                    {email.folder === 'sent' ? email.toName || email.to : email.fromName || email.from}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(email.date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="text-sm font-medium truncate">{email.subject}</div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  {email.body.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderEmailDetail = () => {
    if (isLoadingEmails) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p>Loading messages...</p>
        </div>
      );
    }
    
    if (emailAccounts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <Mail size={48} className="mb-4 opacity-20" />
          <p className="mb-4">Connect an email account to get started</p>
          <Button onClick={() => setIsAddEmailAccountOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Email Account
          </Button>
        </div>
      );
    }
    
    if (!selectedEmail) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <Mail size={48} className="mb-4 opacity-20" />
          <p>Select an email to view</p>
        </div>
      );
    }
    
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">{selectedEmail.subject}</h2>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">From: </span>
              {selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.from}>` : selectedEmail.from}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">To: </span>
              {selectedEmail.toName ? `${selectedEmail.toName} <${selectedEmail.to}>` : selectedEmail.to}
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(selectedEmail.date), 'MMMM d, yyyy h:mm a')}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                toast({
                  title: 'Email Archived',
                  description: 'The email has been moved to the archive folder.',
                });
              }}
            >
              <Archive size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                toast({
                  title: 'Email Deleted',
                  description: 'The email has been moved to the trash folder.',
                });
                setSelectedEmail(null);
              }}
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
        
        {!selectedEmail.leadId && (
          <Button 
            variant="outline" 
            size="sm" 
            className="self-start mb-4"
            onClick={() => handleCreateLead(selectedEmail)}
            disabled={convertToLeadMutation.isPending}
          >
            {convertToLeadMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Converting...
              </>
            ) : (
              <>
                <FilePlus size={16} className="mr-2" />
                Create Lead
              </>
            )}
          </Button>
        )}
        
        <Separator className="my-4" />
        
        <div className="flex-1 overflow-auto whitespace-pre-wrap text-sm">
          {selectedEmail.body}
        </div>
        
        <div className="mt-4">
          <Button 
            className="w-full" 
            onClick={() => {
              setComposeData({
                to: selectedEmail.folder === 'sent' ? selectedEmail.to : selectedEmail.from,
                subject: selectedEmail.subject.startsWith('RE:') ? selectedEmail.subject : `RE: ${selectedEmail.subject}`,
                body: `\n\n----------\nOn ${format(new Date(selectedEmail.date), 'MMMM d, yyyy')} at ${format(new Date(selectedEmail.date), 'h:mm a')}, ${selectedEmail.fromName || selectedEmail.from} wrote:\n\n${selectedEmail.body}`
              });
              setIsComposeOpen(true);
            }}
          >
            Reply
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inbox</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/email/messages'] });
              toast({
                title: 'Refreshing...',
                description: 'Checking for new messages.',
              });
            }}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddEmailAccountOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          
          <Button 
            onClick={() => setIsComposeOpen(true)}
            disabled={emailAccounts.length === 0}
          >
            <Mail size={16} className="mr-2" />
            Compose
          </Button>
        </div>
      </div>
      
      {/* Add Email Account Dialog */}
      <Dialog open={isAddEmailAccountOpen} onOpenChange={setIsAddEmailAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="provider" className="text-right text-sm">
                Provider
              </label>
              <select
                id="provider"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={addEmailData.provider}
                onChange={(e) => setAddEmailData({ ...addEmailData, provider: e.target.value })}
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {addEmailData.provider === 'gmail' ? (
              <div className="col-span-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm mb-2">
                  <Mail className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  You'll be redirected to Google to authorize access to your Gmail account
                </p>
                <p className="text-xs text-gray-500">
                  This app requires limited access to read and send emails on your behalf. You can revoke access at any time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right text-sm">
                  Email
                </label>
                <Input
                  id="email"
                  className="col-span-3"
                  placeholder="youremail@example.com"
                  value={addEmailData.email}
                  onChange={(e) => setAddEmailData({ ...addEmailData, email: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => addEmailAccountMutation.mutate({
                provider: addEmailData.provider,
                email: addEmailData.provider === 'gmail' ? '' : addEmailData.email
              })}
              disabled={
                (addEmailData.provider !== 'gmail' && !addEmailData.email) || 
                addEmailAccountMutation.isPending
              }
            >
              {addEmailAccountMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Connecting...
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        
        {emailAccounts.length > 0 && (
          <select 
            className="h-10 border border-input rounded-md px-3 bg-background"
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">All Accounts</option>
            {emailAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.email}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="w-64 flex flex-col space-y-2">
          <Tabs defaultValue="inbox" value={activeFolder} onValueChange={setActiveFolder}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col space-y-2 overflow-hidden h-full">
            <div className="rounded-md border p-2 flex justify-between items-center">
              <div className="flex items-center">
                <InboxIcon size={16} className="mr-2 text-blue-500" />
                <span className="text-sm font-medium">Inbox</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {emails.filter((e: EmailMessage) => e.folder === 'inbox' && !e.read).length}
              </span>
            </div>
            
            <div className="rounded-md border p-2 flex items-center">
              <Send size={16} className="mr-2 text-green-500" />
              <span className="text-sm font-medium">Sent</span>
            </div>
            
            <div className="rounded-md border p-2 flex items-center">
              <Star size={16} className="mr-2 text-yellow-500" />
              <span className="text-sm font-medium">Starred</span>
            </div>
            
            <div className="rounded-md border p-2 flex items-center">
              <Archive size={16} className="mr-2 text-gray-500" />
              <span className="text-sm font-medium">Archive</span>
            </div>
            
            <div className="rounded-md border p-2 flex items-center">
              <Trash size={16} className="mr-2 text-red-500" />
              <span className="text-sm font-medium">Trash</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="rounded-md border p-2 flex items-center">
              <Tag size={16} className="mr-2 text-purple-500" />
              <span className="text-sm font-medium">Labels</span>
            </div>
            
            <div className="pl-6 flex flex-col space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span>Leads</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span>Clients</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                <span>Urgent</span>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            {emailAccounts.length === 0 ? (
            <div 
              className="rounded-md border p-2 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => setIsAddEmailAccountOpen(true)}
            >
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-2 text-blue-500" />
                <span className="text-sm font-medium">Connect Email</span>
              </div>
              <Plus size={16} className="text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Accounts</span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsAddEmailAccountOpen(true)}
                >
                  <Plus size={16} className="text-gray-400" />
                </Button>
              </div>
              
              {emailAccounts.map(account => (
                <div 
                  key={account.id}
                  className={`rounded-md border p-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${selectedAccountId === account.id ? 'bg-gray-100 border-primary' : ''}`}
                  onClick={() => setSelectedAccountId(account.id === selectedAccountId ? undefined : account.id)}
                >
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    <span className="text-sm truncate max-w-[120px]">{account.email}</span>
                  </div>
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEmailAccountMutation.mutate(account.id);
                    }}
                  >
                    <Trash size={16} className="text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          <div className="overflow-auto border rounded-md">
            {renderEmailList()}
          </div>
          
          <div className="overflow-auto border rounded-md bg-white">
            {renderEmailDetail()}
          </div>
        </div>
      </div>
      
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compose New Email</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {emailAccounts.length > 1 && (
              <div className="grid grid-cols-4 items-center gap-2">
                <label htmlFor="from" className="text-right text-sm font-medium">
                  From:
                </label>
                <select
                  id="from"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm col-span-3"
                  value={selectedAccountId || emailAccounts[0]?.id}
                  onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
                >
                  {emailAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-2">
              <label htmlFor="to" className="text-right text-sm font-medium">
                To:
              </label>
              <Input
                id="to"
                value={composeData.to}
                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                className="col-span-3"
                placeholder="recipient@example.com"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <label htmlFor="subject" className="text-right text-sm font-medium">
                Subject:
              </label>
              <Input
                id="subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                className="col-span-3"
                placeholder="Email subject"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <label htmlFor="body" className="text-right text-sm font-medium mt-2">
                Message:
              </label>
              <Textarea
                id="body"
                value={composeData.body}
                onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                className="col-span-3"
                rows={10}
                placeholder="Write your message here..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleComposeSubmit}
              disabled={!composeData.to || !composeData.subject || !composeData.body || sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Email Account Dialog */}
      <Dialog open={isAddEmailAccountOpen} onOpenChange={setIsAddEmailAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <label htmlFor="provider" className="text-right text-sm font-medium">
                Provider:
              </label>
              <select
                id="provider"
                value={addEmailData.provider}
                onChange={(e) => setAddEmailData({...addEmailData, provider: e.target.value})}
                className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <label htmlFor="email" className="text-right text-sm font-medium">
                Email Address:
              </label>
              <Input
                id="email"
                value={addEmailData.email}
                onChange={(e) => setAddEmailData({...addEmailData, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="col-span-4 px-2 text-sm text-muted-foreground">
              <p>
                Connecting your email will allow you to view and respond to emails directly from this CRM.
                {addEmailData.provider === 'gmail' && (
                  <span> You'll need to authorize via Google to complete this process.</span>
                )}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEmailAccountOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => addEmailAccountMutation.mutate(addEmailData)}
              disabled={!addEmailData.email || addEmailAccountMutation.isPending}
            >
              {addEmailAccountMutation.isPending ? 'Connecting...' : 'Connect Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;