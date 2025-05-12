import React, { useState } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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

// Sample email data
const sampleEmails: EmailMessage[] = [
  {
    id: 1,
    from: 'john.smith@example.com',
    fromName: 'John Smith',
    to: 'you@yourcompany.com',
    subject: 'Kitchen Renovation Quote',
    body: 'Hi there,\n\nI\'m interested in getting a quote for my kitchen renovation. We have a 200 sq ft kitchen that needs a complete overhaul including new cabinets, countertops, and appliances.\n\nCould you provide an estimate and timeline?\n\nThanks,\nJohn Smith',
    date: new Date('2023-05-10T14:32:00'),
    read: false,
    folder: 'inbox',
    leadId: null
  },
  {
    id: 2,
    from: 'sarah.johnson@example.com',
    fromName: 'Sarah Johnson',
    to: 'you@yourcompany.com',
    subject: 'Bathroom Remodel Follow-up',
    body: 'Hello,\n\nI just wanted to follow up on our conversation last week about my bathroom remodel project. Have you had a chance to put together a proposal?\n\nBest regards,\nSarah Johnson',
    date: new Date('2023-05-09T09:15:00'),
    read: true,
    folder: 'inbox',
    leadId: 3
  },
  {
    id: 3,
    from: 'michael.parker@example.com',
    fromName: 'Michael Parker',
    to: 'you@yourcompany.com',
    subject: 'Deck Installation Questions',
    body: 'Good afternoon,\n\nI\'m considering having a new deck installed and I have a few questions about the materials you use and your installation process.\n\nDo you offer composite decking options? What is your typical timeline for a project like this?\n\nThank you,\nMichael Parker',
    date: new Date('2023-05-08T16:45:00'),
    read: true,
    folder: 'inbox',
    leadId: null
  },
  {
    id: 4,
    from: 'you@yourcompany.com',
    to: 'lisa.brown@example.com',
    toName: 'Lisa Brown',
    subject: 'RE: Home Office Renovation',
    body: 'Hi Lisa,\n\nThank you for your inquiry about a home office renovation. We would be happy to help with your project.\n\nCould you please provide some more details about the space, including dimensions and your vision for the finished office?\n\nI\'m available for a phone consultation this week if that would be helpful.\n\nBest regards,\nYour Name\nYour Company',
    date: new Date('2023-05-07T11:20:00'),
    read: true,
    folder: 'sent',
    leadId: 5
  }
];

const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  
  const { toast } = useToast();
  
  // Filter emails by folder and search term
  const filteredEmails = sampleEmails.filter(email => {
    const matchesFolder = email.folder === activeFolder;
    const matchesSearch = searchTerm === '' || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });
  
  // Sort emails by date (newest first)
  const sortedEmails = [...filteredEmails].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const handleComposeSubmit = () => {
    // Would connect to email sending API
    toast({
      title: 'Email Sent',
      description: `Your email to ${composeData.to} has been sent.`,
    });
    setIsComposeOpen(false);
    setComposeData({ to: '', subject: '', body: '' });
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
                {sampleEmails.filter(e => e.folder === 'inbox' && !e.read).length}
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