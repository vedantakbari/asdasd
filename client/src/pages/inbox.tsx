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
  const [addEmailData, setAddEmailData] = useState<AddEmailDialogData>({
    provider: 'gmail',
    email: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    onSuccess: () => {
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
      const res = await apiRequest('POST', '/api/email/send', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/messages'] });
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
    // Would implement lead creation from email
    toast({
      title: 'Lead Created',
      description: `A new lead has been created from ${email.fromName || email.from}.`,
    });
  };
  
  const renderEmailList = () => (
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
  
  const renderEmailDetail = () => {
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
                // Would implement archive functionality
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
                // Would implement delete functionality
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
          >
            <FilePlus size={16} className="mr-2" />
            Create Lead
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
              toast({
                title: 'Refreshing...',
                description: 'Checking for new messages.',
              });
            }}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          
          <Button onClick={() => setIsComposeOpen(true)}>
            <Mail size={16} className="mr-2" />
            Compose
          </Button>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
            
            <div className="rounded-md border p-2 flex justify-between items-center">
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-2 text-blue-500" />
                <span className="text-sm font-medium">Connect Email</span>
              </div>
              <CheckCircle size={16} className="text-gray-400" />
            </div>
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
            <div className="grid grid-cols-4 items-center gap-2">
              <label htmlFor="to" className="text-right text-sm font-medium">
                To:
              </label>
              <Input
                id="to"
                value={composeData.to}
                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                className="col-span-3"
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
              disabled={!composeData.to || !composeData.subject}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;