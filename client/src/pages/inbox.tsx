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
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

interface EmailMessage {
  id: string;
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

// Generate sample emails for demonstration
const generateSampleEmails = (): EmailMessage[] => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

  return [
    {
      id: '1',
      from: 'alice.johnson@example.com',
      fromName: 'Alice Johnson',
      to: 'crm@yourbusiness.com',
      toName: 'Your Business',
      subject: 'Interested in your home services',
      body: `Hello,

I'm interested in getting a quote for your premium home services. My wife and I are looking to renovate our kitchen and master bathroom.

Could you please send me some information about your services and pricing?

Best regards,
Alice Johnson`,
      date: oneDayAgo,
      read: false,
      folder: 'inbox',
      leadId: null
    },
    {
      id: '2',
      from: 'mike.smith@example.com',
      fromName: 'Mike Smith',
      to: 'crm@yourbusiness.com',
      toName: 'Your Business',
      subject: 'Follow-up from yesterday\'s meeting',
      body: `Hi there,

Just wanted to follow up after our meeting yesterday. I'm very interested in proceeding with the landscaping project we discussed.

Could you send me the contract to review?

Thanks,
Mike Smith`,
      date: now,
      read: false,
      folder: 'inbox',
      leadId: 1
    },
    {
      id: '3',
      from: 'sarah.williams@example.com',
      fromName: 'Sarah Williams',
      to: 'crm@yourbusiness.com',
      toName: 'Your Business',
      subject: 'Question about your rates',
      body: `Hello,

I saw your advertisement in the local paper and I have a question about your rates for weekly cleaning services.

Do you offer any discounts for long-term contracts?

Best,
Sarah Williams`,
      date: twoDaysAgo,
      read: true,
      folder: 'inbox',
      leadId: null
    },
    {
      id: '4',
      from: 'david.miller@example.com',
      fromName: 'David Miller',
      to: 'crm@yourbusiness.com',
      toName: 'Your Business',
      subject: 'Need to reschedule',
      body: `Hi,

Unfortunately, I need to reschedule our appointment for next Tuesday. Something urgent came up at work.

Would Thursday at the same time work for you instead?

Regards,
David Miller`,
      date: threeDaysAgo,
      read: true,
      folder: 'inbox',
      leadId: 2
    },
    {
      id: '5',
      from: 'crm@yourbusiness.com',
      fromName: 'Your Business',
      to: 'james.wilson@example.com',
      toName: 'James Wilson',
      subject: 'Your recent quote',
      body: `Dear James,

Thank you for your interest in our services. As requested, I've attached a detailed quote for your home renovation project.

Please let me know if you have any questions or if you'd like to make any adjustments.

Best regards,
Your Name
Your Business`,
      date: fourDaysAgo,
      read: true,
      folder: 'sent',
      leadId: 3
    }
  ];
};

const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isConnectEmailOpen, setIsConnectEmailOpen] = useState(false);
  const [allEmails, setAllEmails] = useState<EmailMessage[]>(generateSampleEmails());
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [emailAccount, setEmailAccount] = useState({
    email: '',
    connected: false,
    displayName: 'Your Name',
  });
  
  const { toast } = useToast();
  
  // Simulating getting email accounts on load
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
    
    // Load any stored email account info
    const storedAccount = localStorage.getItem('emailAccount');
    if (storedAccount) {
      try {
        const parsedAccount = JSON.parse(storedAccount);
        setEmailAccount(parsedAccount);
      } catch (error) {
        console.error('Failed to parse stored email account:', error);
      }
    }
  }, []);
  
  // Simulating API request when email is sent
  const handleSendEmail = () => {
    if (!emailAccount.connected) {
      toast({
        title: 'No Email Account Connected',
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
    
    // Create a new "sent" email to add to our list
    const newEmail: EmailMessage = {
      id: `sent-${Date.now()}`,
      from: emailAccount.email,
      fromName: emailAccount.displayName,
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      date: new Date(),
      read: true,
      folder: 'sent',
      leadId: null
    };
    
    // Add to our list of emails
    setAllEmails([newEmail, ...allEmails]);
    
    // Show success notification
    toast({
      title: 'Email Sent',
      description: 'Your email has been sent successfully.',
    });
    
    // Close compose dialog and reset form
    setIsComposeOpen(false);
    setComposeData({
      to: '',
      subject: '',
      body: ''
    });
  };
  
  // Handle simulated email account connection
  const handleConnectEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailAccount.email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive'
      });
      return;
    }
    
    // Update email account
    const updatedAccount = {
      ...emailAccount,
      connected: true
    };
    
    // Save to local storage and state
    setEmailAccount(updatedAccount);
    localStorage.setItem('emailAccount', JSON.stringify(updatedAccount));
    
    // Close dialog and show success
    setIsConnectEmailOpen(false);
    toast({
      title: 'Email Connected',
      description: `${emailAccount.email} has been connected successfully.`,
    });
  };
  
  // Convert an email sender to a lead
  const handleCreateLead = (email: EmailMessage) => {
    // Mark this email as associated with a lead
    const updatedEmails = allEmails.map(e => {
      if (e.id === email.id) {
        return { ...e, leadId: Date.now() };
      }
      return e;
    });
    
    setAllEmails(updatedEmails);
    
    toast({
      title: 'Lead Created',
      description: `A new lead has been created from ${email.fromName || email.from}.`,
    });
  };
  
  // Filter emails by folder and search term
  const filteredEmails = allEmails.filter(email => {
    // Filter by folder
    const matchesFolder = email.folder === activeFolder;
    
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.fromName && email.fromName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });
  
  // Sort emails by date (newest first)
  const sortedEmails = [...filteredEmails].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get unread count
  const unreadCount = allEmails.filter(email => 
    email.folder === 'inbox' && !email.read
  ).length;
  
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
                      {sortedEmails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                            !email.read ? 'bg-blue-50' : ''
                          } ${selectedEmail?.id === email.id ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setSelectedEmail(email);
                            // Mark as read when selected
                            if (!email.read) {
                              const updatedEmails = allEmails.map(e => {
                                if (e.id === email.id) {
                                  return { ...e, read: true };
                                }
                                return e;
                              });
                              setAllEmails(updatedEmails);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-medium truncate">
                              {email.folder === 'sent' ? email.to : email.fromName || email.from}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {format(new Date(email.date), 'MMM d')}
                            </div>
                          </div>
                          <div className="text-sm font-medium truncate">
                            {email.subject}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {email.body.split('\n')[0]}
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
                            {format(new Date(selectedEmail.date), 'MMM d, yyyy, h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4 whitespace-pre-line">
                      {selectedEmail.body}
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        onClick={() => {
                          setComposeData({
                            to: selectedEmail.folder === 'sent' ? selectedEmail.to : selectedEmail.from,
                            subject: `Re: ${selectedEmail.subject}`,
                            body: `\n\n-----Original Message-----\nFrom: ${selectedEmail.fromName || selectedEmail.from}\nDate: ${format(new Date(selectedEmail.date), 'MMM d, yyyy, h:mm a')}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`
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