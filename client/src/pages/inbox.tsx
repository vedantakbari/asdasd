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
  
  // Check Google API credentials status
  const { data: googleCredentialsStatus } = useQuery({
    queryKey: ['/api/google/credentials-status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/google/credentials-status');
      return res.json();
    }
  });
  
  // Check for status in URL (after redirecting back from OAuth)
  useEffect(() => {
    // Check URL params for OAuth status
    const url = new URL(window.location.href);
    const status = url.searchParams.get('status');
    const accountId = url.searchParams.get('accountId');
    const reason = url.searchParams.get('reason');
    
    if (status) {
      // Remove the parameters
      url.searchParams.delete('status');
      url.searchParams.delete('accountId');
      url.searchParams.delete('reason');
      window.history.replaceState({}, document.title, url.toString());
      
      if (status === 'success') {
        toast({
          title: 'Email Account Connected',
          description: 'Your Gmail account has been connected successfully.',
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
        if (reason === 'missing_credentials') {
          toast({
            title: 'Google API Credentials Required',
            description: 'To connect Gmail, you need to provide Google API credentials in your environment variables.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Connection Failed',
            description: 'There was an error connecting your email account. Please try again.',
            variant: 'destructive'
          });
        }
      } else if (status === 'account_exists') {
        toast({
          title: 'Account Already Connected',
          description: 'This email account is already connected to your profile.',
          variant: 'default'
        });
      }
    }
    
    // Check if Google credentials are missing and show toast only once
    if (googleCredentialsStatus && googleCredentialsStatus.isConfigured === false) {
      const hasShownCredentialsWarning = sessionStorage.getItem('shown_credentials_warning');
      if (!hasShownCredentialsWarning) {
        toast({
          title: 'Gmail Connection Requires Setup',
          description: 'To connect Gmail accounts, you need to provide Google API credentials.',
          variant: 'destructive'
        });
        sessionStorage.setItem('shown_credentials_warning', 'true');
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
    
    // Load available email accounts after component is mounted
    apiRequest('GET', '/api/email/accounts')
      .then(response => response.json())
      .then(accounts => {
        // If we have accounts but no selected account, select the first one
        if (accounts && accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accounts[0].id);
        }
      })
      .catch(error => {
        console.error('Failed to load email accounts:', error);
      });
  }, [queryClient]);
  
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
      // Make the API request
      const res = await apiRequest('POST', '/api/email/send', data);
      
      // Check for API errors
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send email');
      }
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      console.log('Email sent successfully:', data);
      
      // Refresh email messages list
      queryClient.invalidateQueries({ queryKey: ['/api/email/messages'] });
      
      // The server now creates an activity automatically, but we still need to
      // invalidate the activities queries to reflect the new activity
      if (variables.leadId) {
        // Invalidate any activities queries that might be affected
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activities/entity/lead/' + variables.leadId] });
        
        toast({
          title: 'Email Sent to Client',
          description: 'Your email has been sent successfully and recorded in client history.',
        });
      } else {
        toast({
          title: 'Email Sent',
          description: 'Your email has been sent successfully.',
        });
      }
      
      // Clear the compose form and close the dialog
      setIsComposeOpen(false);
      setComposeData({
        to: '',
        subject: '',
        body: ''
      });
      
      // After sending, clear lead ID
      setLeadId(undefined);
    },
    onError: (error: any) => {
      console.error('Failed to send email:', error);
      
      // Check for authentication errors
      if (error.message && (
        error.message.includes('Authentication failed') || 
        error.message.includes('AUTH_FAILED') ||
        error.message.includes('AUTH_REFRESH_FAILED')
      )) {
        toast({
          title: 'Authentication Error',
          description: 'Your email account needs to be reconnected. Please go to settings to reconnect your account.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Failed to Send Email',
          description: error.message || 'There was an error sending your email.',
          variant: 'destructive'
        });
      }
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
    // If no account is selected, try to use the first available account
    let accountIdToUse = selectedAccountId;
    
    if (!accountIdToUse && emailAccounts.length > 0) {
      accountIdToUse = emailAccounts[0].id;
    }
    
    if (!accountIdToUse) {
      toast({
        title: 'No Email Account Available',
        description: 'Please connect an email account before sending emails.',
        variant: 'destructive'
      });
      return;
    }
    
    sendEmailMutation.mutate({
      accountId: accountIdToUse,
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      leadId: leadId // Include the leadId if available
    });
    
    // After sending the email, clear the leadId
    setLeadId(undefined);
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
              Each user of the CRM needs to connect their personal Gmail account to send and receive emails.
            </p>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-4 text-left max-w-md">
              <h4 className="text-blue-800 font-medium mb-2">For CRM Users:</h4>
              <ol className="text-sm text-blue-700 list-decimal ml-5 space-y-1">
                <li>Click the "Connect Gmail Account" button below</li>
                <li>Sign in with your personal Gmail account</li>
                <li>Accept the requested permissions</li>
                <li>Your Gmail account will be used for sending client emails</li>
              </ol>
            </div>
            <Button 
              onClick={() => setIsAddEmailAccountOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <svg viewBox="0 0 48 48" width="20" height="20" className="mr-2">
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
                <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
              </svg>
              Connect Gmail Account
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
          <h3 className="text-lg font-medium mb-2 text-gray-700">No Email Accounts Connected</h3>
          <p className="mb-4 text-center max-w-md">
            Each CRM user needs to connect their personal Gmail account to send and receive emails through the platform
          </p>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-4 text-left max-w-md">
            <h4 className="text-blue-800 font-medium mb-2 text-sm">Quick Instructions:</h4>
            <ol className="text-sm text-blue-700 list-decimal ml-5 space-y-1">
              <li>Click the "Connect Gmail" button below</li>
              <li>Follow the Google authentication steps</li>
              <li>Grant permission to access your email</li>
            </ol>
          </div>
          <Button 
            onClick={() => setIsAddEmailAccountOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <svg viewBox="0 0 48 48" width="20" height="20" className="mr-2">
              <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
              <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
              <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
              <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
            </svg>
            Connect Gmail
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
              <div className="col-span-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm mb-2">
                    <Mail className="inline-block mr-2 h-4 w-4 text-gray-500" />
                    You'll be redirected to Google to authorize access to your Gmail account
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    This app requires limited access to read and send emails on your behalf. You can revoke access at any time.
                  </p>
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white" 
                    disabled={googleCredentialsStatus && !googleCredentialsStatus.isConfigured}
                    onClick={() => {
                      // Check if Google credentials are configured
                      if (googleCredentialsStatus && !googleCredentialsStatus.isConfigured) {
                        toast({
                          title: 'Google API Credentials Required',
                          description: 'To connect Gmail, you need to provide Google API credentials.',
                          variant: 'destructive'
                        });
                        
                        // Ask for Google credentials
                        toast({
                          title: 'Setup Required',
                          description: 'Please provide GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.',
                          variant: 'destructive'
                        });
                        
                        return;
                      }
                      
                      // Store current domain in session storage for OAuth validation
                      sessionStorage.setItem('originDomain', window.location.origin);
                      
                      // Store a flag in sessionStorage to indicate OAuth is in progress
                      sessionStorage.setItem('googleOAuthInProgress', 'true');
                      
                      toast({
                        title: 'Important',
                        description: `Make sure ${window.location.origin}/api/auth/google/callback is in your Google Cloud Console redirect URIs`,
                      });
                      
                      // Submit the form to initiate OAuth after a short delay to ensure the toast is seen
                      setTimeout(() => {
                        addEmailAccountMutation.mutate({ 
                          provider: 'gmail', 
                          email: 'oauth@gmail.com' // Placeholder, will be replaced with actual email after auth
                        });
                      }, 1500);
                    }}
                  >
                    <svg 
                      className="mr-2 h-4 w-4" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 48 48"
                      width="16"
                      height="16"
                    >
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Connect with Gmail
                  </Button>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Instructions for Gmail Users</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    For each user of the CRM who needs to connect their Gmail account:
                  </p>
                  <ol className="text-sm text-blue-700 space-y-1 ml-5 list-decimal">
                    <li>Click the "Connect with Gmail" button above</li>
                    <li>Sign in with your personal Gmail account when prompted</li>
                    <li>Review and accept the permissions</li>
                    <li>Your personal email will now appear in the account list</li>
                    <li>Each CRM user should connect their own Gmail account this way</li>
                  </ol>
                  <div className="mt-2 text-xs text-blue-600">
                    You can find these instructions again in the Email Settings tab
                  </div>
                </div>
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
      
      <Dialog open={isComposeOpen} onOpenChange={(open) => {
          setIsComposeOpen(open);
          if (!open) {
            // Clear leadId when closing the compose dialog
            setLeadId(undefined);
          }
        }}>
        <DialogContent className="sm:max-w-[600px]" onOpenAutoFocus={(e) => {
            // Automatically select the first email account if none is selected
            if (!selectedAccountId && emailAccounts.length > 0) {
              setSelectedAccountId(emailAccounts[0].id);
            }
          }}>
          <DialogHeader>
            <DialogTitle>
              {leadId ? 'Email Client' : 'Compose New Email'}
            </DialogTitle>
            {leadId && (
              <div className="mt-1 text-sm text-muted-foreground">
                This email will be logged to the client's activity history
              </div>
            )}
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Always show the from field if there are any accounts, not just if there are multiple */}
            {emailAccounts.length > 0 && (
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
            
            {/* Show a friendly message if no email accounts are available */}
            {emailAccounts.length === 0 && (
              <div className="col-span-4 bg-amber-50 border border-amber-200 rounded-md p-3 mb-2">
                <p className="text-amber-800 text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  You need to connect an email account before you can send emails.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setIsAddEmailAccountOpen(true)}
                >
                  Add Email Account
                </Button>
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
              disabled={
                !composeData.to || 
                !composeData.subject || 
                !composeData.body || 
                emailAccounts.length === 0 || 
                sendEmailMutation.isPending
              }
            >
              {sendEmailMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending...
                </>
              ) : emailAccounts.length === 0 ? (
                <>
                  <Mail size={16} className="mr-2" />
                  Add Email Account First
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