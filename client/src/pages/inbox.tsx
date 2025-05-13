import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Inbox as InboxIcon, Send, Star, Archive, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  folder: string;
}

// Sample data
const sampleEmails: EmailMessage[] = [
  {
    id: '1',
    from: 'alice@example.com',
    fromName: 'Alice Johnson',
    to: 'you@example.com',
    subject: 'Interested in your services',
    body: 'Hello, I saw your website and I\'m interested in the services you offer. Could you provide more information about pricing?',
    date: new Date('2025-05-12T10:30:00'),
    read: false,
    folder: 'inbox'
  },
  {
    id: '2',
    from: 'bob@example.com',
    fromName: 'Bob Smith',
    to: 'you@example.com',
    subject: 'Following up on our meeting',
    body: 'Hi there, I wanted to follow up on our meeting from last week. Have you had a chance to review the proposal?',
    date: new Date('2025-05-11T14:15:00'),
    read: true,
    folder: 'inbox'
  },
  {
    id: '3',
    from: 'you@example.com',
    fromName: 'You',
    to: 'carol@example.com',
    subject: 'Project update',
    body: 'Hi Carol, Here\'s the update on the project we discussed. Things are progressing well and we should be on track for the deadline.',
    date: new Date('2025-05-10T09:45:00'),
    read: true,
    folder: 'sent'
  }
];

const Inbox: React.FC = () => {
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<EmailMessage[]>(sampleEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  
  const { toast } = useToast();
  
  // Filter emails by folder and search term
  const filteredEmails = emails.filter(email => {
    const matchesFolder = email.folder === currentFolder;
    const matchesSearch = searchTerm === '' || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Mark an email as read
  const markAsRead = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? {...email, read: true} : email
    ));
  };
  
  // Delete an email
  const deleteEmail = (id: string) => {
    setEmails(emails.filter(email => email.id !== id));
    setSelectedEmail(null);
    
    toast({
      title: "Email deleted",
      description: "The email has been moved to trash",
    });
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[250px]"
            />
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-48 border-r p-3 space-y-1 hidden md:block">
          <Button
            variant={currentFolder === 'inbox' ? 'default' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setCurrentFolder('inbox')}
          >
            <InboxIcon className="h-4 w-4 mr-2" />
            Inbox
          </Button>
          <Button
            variant={currentFolder === 'sent' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentFolder('sent')}
          >
            <Send className="h-4 w-4 mr-2" />
            Sent
          </Button>
          <Button
            variant={currentFolder === 'starred' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentFolder('starred')}
          >
            <Star className="h-4 w-4 mr-2" />
            Starred
          </Button>
          <Button
            variant={currentFolder === 'archive' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentFolder('archive')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button
            variant={currentFolder === 'trash' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentFolder('trash')}
          >
            <Trash className="h-4 w-4 mr-2" />
            Trash
          </Button>
        </div>
        
        {/* Email list and content */}
        <div className="flex-1 flex md:divide-x">
          {/* Email list */}
          <div className={`${selectedEmail && 'hidden md:block'} md:w-1/3 border-r`}>
            <div className="bg-muted/30 p-2 border-b">
              <div className="text-sm font-medium">
                {currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1)}
                <span className="text-muted-foreground ml-1">({filteredEmails.length})</span>
              </div>
            </div>
            
            <div className="divide-y">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No emails in this folder
                </div>
              ) : (
                filteredEmails.map(email => (
                  <div
                    key={email.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 ${!email.read ? 'bg-blue-50' : ''} ${selectedEmail?.id === email.id ? 'bg-muted' : ''}`}
                    onClick={() => {
                      setSelectedEmail(email);
                      markAsRead(email.id);
                    }}
                  >
                    <div className="flex justify-between mb-1">
                      <div className="font-medium truncate">
                        {currentFolder === 'sent' ? `To: ${email.to}` : email.fromName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(email.date)}
                      </div>
                    </div>
                    <div className="font-medium text-sm truncate">{email.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {email.body.substring(0, 100)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Email content */}
          {selectedEmail ? (
            <div className={`flex-1 ${!selectedEmail && 'hidden md:block'} p-4`}>
              <div className="md:hidden mb-4">
                <Button variant="ghost" onClick={() => setSelectedEmail(null)}>
                  ← Back to list
                </Button>
              </div>
              
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                  <div className="text-sm text-muted-foreground">
                    From: {selectedEmail.fromName} &lt;{selectedEmail.from}&gt;
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To: {selectedEmail.to}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Date: {selectedEmail.date.toLocaleString()}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={() => deleteEmail(selectedEmail.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="border-t pt-4 whitespace-pre-line">
                {selectedEmail.body}
              </div>
              
              <div className="mt-6">
                <Button>Reply</Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center p-4 text-center text-muted-foreground">
              <div>
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Select an email to view</h3>
                <p>Choose an email from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;