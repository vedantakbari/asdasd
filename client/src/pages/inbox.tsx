import React, { useState } from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Defined interface for email type
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

// Temporary mock data for emails until backend is ready
const mockEmails: EmailMessage[] = [
  {
    id: 1,
    from: 'john.smith@example.com',
    fromName: 'John Smith',
    to: 'me@servicecrm.com',
    subject: 'Kitchen Renovation Quote Request',
    body: 'Hello,\n\nI would like to get a quote for renovating my kitchen. We are looking to replace the cabinets, countertops, and flooring.\n\nWhat is your availability for consultation?\n\nThanks,\nJohn Smith',
    date: new Date(2023, 4, 10, 14, 30),
    read: true,
    folder: 'inbox',
    leadId: 1
  },
  {
    id: 2,
    from: 'emma.rodriguez@example.com',
    fromName: 'Emma Rodriguez',
    to: 'me@servicecrm.com',
    subject: 'Re: Bathroom Remodel Timeline',
    body: 'Hi there,\n\nThank you for the estimate. I was wondering when you would be able to start the bathroom remodel project? We are hoping to have it completed by the end of next month.\n\nRegards,\nEmma Rodriguez',
    date: new Date(2023, 4, 11, 9, 15),
    read: false,
    folder: 'inbox',
    leadId: 2
  },
  {
    id: 3,
    from: 'michael.johnson@example.com',
    fromName: 'Michael Johnson',
    to: 'me@servicecrm.com',
    subject: 'Deck Installation Question',
    body: 'Hello,\n\nI am interested in having a new deck installed. Do you also handle outdoor projects like this?\n\nBest,\nMichael Johnson',
    date: new Date(2023, 4, 12, 16, 45),
    read: false,
    folder: 'inbox',
    leadId: null
  },
  {
    id: 4,
    to: 'richard.taylor@example.com',
    toName: 'Richard Taylor',
    from: 'me@servicecrm.com',
    subject: 'Your Recent Service Request',
    body: 'Dear Richard,\n\nThank you for your interest in our services. I would like to schedule a time to discuss your project in more detail.\n\nAre you available anytime next week for a consultation?\n\nBest regards,\nService Team',
    date: new Date(2023, 4, 9, 11, 20),
    read: true,
    folder: 'sent',
    leadId: 3
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
  const filteredEmails = mockEmails.filter(email => {
    const matchesFolder = email.folder === activeFolder;
    const matchesSearch = searchTerm === '' || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  // Sort emails by date descending
  const sortedEmails = [...filteredEmails].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    // Mark as read (would update in backend)
    // TODO: Add backend integration
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add sending email functionality when backend is ready
    toast({
      title: "Email Integration Coming Soon",
      description: "This functionality will be available when email integration is implemented.",
    });
    setIsComposeOpen(false);
    setComposeData({
      to: '',
      subject: '',
      body: ''
    });
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    
    setComposeData({
      to: selectedEmail.from,
      subject: `Re: ${selectedEmail.subject}`,
      body: `\n\n---\nOn ${format(selectedEmail.date, 'MMM d, yyyy, h:mm a')}, ${selectedEmail.fromName || selectedEmail.from} wrote:\n\n${selectedEmail.body}`
    });
    
    setIsComposeOpen(true);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Inbox" 
        description="Manage your email communications"
        actions={
          <Button onClick={() => setIsComposeOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Compose
          </Button>
        }
      />

      <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 bg-gray-50">
        <Card className="h-full overflow-hidden">
          <CardContent className="p-0 h-full flex">
            {/* Email Navigation */}
            <aside className="w-64 border-r border-gray-200 flex flex-col h-full bg-white">
              <div className="p-4">
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Tabs 
                defaultValue="inbox" 
                className="flex-1 flex flex-col"
                onValueChange={setActiveFolder}
              >
                <div className="px-2">
                  <TabsList className="w-full">
                    <TabsTrigger 
                      value="inbox" 
                      className="flex-1 relative"
                    >
                      Inbox
                      <span className="absolute top-0 right-0 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {mockEmails.filter(e => e.folder === 'inbox' && !e.read).length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Email List */}
                <TabsContent value="inbox" className="flex-1 overflow-y-auto mt-0 border-t">
                  {sortedEmails.map(email => (
                    <div 
                      key={email.id}
                      className={`p-3 border-b cursor-pointer ${email.read ? 'opacity-70' : 'font-semibold'} ${selectedEmail?.id === email.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="text-sm flex justify-between">
                        <span className="truncate">{email.fromName || email.from}</span>
                        <span className="text-xs text-gray-500">{format(email.date, 'MMM d')}</span>
                      </div>
                      <div className="text-sm truncate">{email.subject}</div>
                      <div className="text-xs text-gray-500 truncate">{email.body.slice(0, 50)}...</div>
                    </div>
                  ))}
                  {sortedEmails.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No emails found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="sent" className="flex-1 overflow-y-auto mt-0 border-t">
                  {sortedEmails.map(email => (
                    <div 
                      key={email.id}
                      className={`p-3 border-b cursor-pointer ${selectedEmail?.id === email.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="text-sm flex justify-between">
                        <span className="truncate">To: {email.toName || email.to}</span>
                        <span className="text-xs text-gray-500">{format(email.date, 'MMM d')}</span>
                      </div>
                      <div className="text-sm truncate">{email.subject}</div>
                      <div className="text-xs text-gray-500 truncate">{email.body.slice(0, 50)}...</div>
                    </div>
                  ))}
                  {sortedEmails.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No emails found
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="p-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Email Integration Coming Soon",
                      description: "Connect your email accounts to sync messages directly with this CRM.",
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Connect Email
                </Button>
              </div>
            </aside>
            
            {/* Email Content */}
            <div className="flex-1 flex flex-col h-full overflow-auto">
              {selectedEmail ? (
                <div className="flex-1 flex flex-col p-6 overflow-auto">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                      <div className="text-sm text-gray-600 mt-1">
                        {activeFolder === 'inbox' ? 'From:' : 'To:'} {activeFolder === 'inbox' ? selectedEmail.fromName || selectedEmail.from : selectedEmail.toName || selectedEmail.to}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(selectedEmail.date, 'MMMM d, yyyy, h:mm a')}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleReply}
                      >
                        Reply
                      </Button>
                      {selectedEmail.leadId && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/leads/${selectedEmail.leadId}`}
                        >
                          View Lead
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto whitespace-pre-line text-gray-800 bg-white border rounded-md p-4">
                    {selectedEmail.body}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">Select an email to view its contents</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compose New Email</DialogTitle>
            <DialogDescription>
              Create and send emails directly from the CRM.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleComposeSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="to" className="text-right">To</Label>
                <Input 
                  id="to" 
                  value={composeData.to}
                  onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">Subject</Label>
                <Input 
                  id="subject" 
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="body" className="text-right pt-2">Message</Label>
                <Textarea 
                  id="body" 
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                  className="col-span-3 min-h-[200px]"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send Email</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Inbox;