import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

// Form schema for Google Calendar settings
const googleCalendarSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  redirectUri: z.string().min(1, "Redirect URI is required"),
});

type GoogleCalendarFormValues = z.infer<typeof googleCalendarSchema>;

export default function GoogleCalendarSettings() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing Google Calendar settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/google-calendar/settings'],
    queryFn: async () => {
      const response = await fetch('/api/google-calendar/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar settings');
      }
      return response.json();
    }
  });

  // Initialize form with existing settings or empty values
  const form = useForm<GoogleCalendarFormValues>({
    resolver: zodResolver(googleCalendarSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      redirectUri: `${window.location.origin}/api/google/callback`,
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings && !isLoading) {
      form.reset({
        clientId: settings.clientId || '',
        clientSecret: settings.clientSecret || '',
        redirectUri: settings.redirectUri || `${window.location.origin}/api/google/callback`,
      });
    }
  }, [settings, isLoading, form]);

  // Save Google Calendar settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: GoogleCalendarFormValues) => {
      return apiRequest('POST', '/api/google-calendar/settings', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your Google Calendar API settings have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save settings',
        description: error.message || 'An error occurred while saving your settings.',
        variant: 'destructive',
      });
    },
  });

  // Connect to Google Calendar
  const connectToGoogleCalendar = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/google/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        // Open Google OAuth consent screen in a new window
        window.open(data.authUrl, 'googleOAuthPopup', 'width=600,height=600');
        
        // In a real app, you would implement a callback mechanism to handle the OAuth flow completion
        // For demo purposes, we'll simulate completion after 5 seconds
        setTimeout(() => {
          simulateOAuthCompletion();
        }, 5000);
      } else {
        throw new Error('Failed to generate authentication URL');
      }
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'An error occurred while connecting to Google Calendar.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };
  
  // Simulate completion of the OAuth flow (for demo purposes)
  const simulateOAuthCompletion = async () => {
    try {
      // Simulate receiving an authorization code from Google
      const simulatedCode = 'simulated_auth_code';
      
      // Exchange the code for tokens
      const response = await fetch('/api/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: simulatedCode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Connected successfully',
          description: 'Your Google Calendar has been connected.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/settings'] });
      } else {
        throw new Error('Failed to complete OAuth flow');
      }
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'An error occurred while completing the connection process.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const onSubmit = (values: GoogleCalendarFormValues) => {
    saveSettingsMutation.mutate(values);
  };

  const copyBookingUrl = () => {
    const url = `${window.location.origin}/booking/1`; // In a real app, you'd use the actual user ID
    navigator.clipboard.writeText(url);
    toast({
      title: 'Booking URL copied',
      description: 'Your calendar booking URL has been copied to the clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Calendar Integration</h2>
          <p className="text-muted-foreground">Connect your Google Calendar to sync appointments and enable online booking</p>
        </div>
        
        {settings?.connected && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>Connected</span>
          </div>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar API Credentials</CardTitle>
          <CardDescription>
            Enter your Google Cloud Console API credentials to connect with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Google OAuth Client ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      The Client ID from your Google Cloud Console project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Secret</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Your Google OAuth Client Secret" {...field} />
                    </FormControl>
                    <FormDescription>
                      The Client Secret from your Google Cloud Console project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="redirectUri"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URI</FormLabel>
                    <FormControl>
                      <Input placeholder="OAuth Redirect URI" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URI Google will redirect to after authentication
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connect with Google Calendar</CardTitle>
          <CardDescription>
            Authorize this CRM to access your Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!settings?.clientId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not configured</AlertTitle>
              <AlertDescription>
                You must save your Google API credentials before connecting
              </AlertDescription>
            </Alert>
          )}
          
          {settings?.clientId && !settings.connected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not connected</AlertTitle>
              <AlertDescription>
                Click the Connect button to authorize Google Calendar access
              </AlertDescription>
            </Alert>
          )}
          
          {settings?.connected && (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Connected</AlertTitle>
              <AlertDescription>
                Your Google Calendar is successfully connected
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Switch 
              checked={settings?.syncEnabled || false}
              disabled={!settings?.connected}
              onCheckedChange={(checked) => {
                // In a real app, you'd update the sync setting
                toast({
                  title: checked ? 'Sync enabled' : 'Sync disabled',
                  description: checked 
                    ? 'Appointments will be synced with Google Calendar' 
                    : 'Appointments will not be synced with Google Calendar',
                });
              }}
            />
            <span>Auto-sync appointments</span>
          </div>
          
          <Button 
            onClick={connectToGoogleCalendar}
            disabled={!settings?.clientId || isConnecting || settings?.connected}
          >
            {isConnecting ? 'Connecting...' : settings?.connected ? 'Connected' : 'Connect'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Calendar Booking Page</CardTitle>
          <CardDescription>
            Share your booking page to allow clients to schedule appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!settings?.connected ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Calendar not connected</AlertTitle>
              <AlertDescription>
                Connect your Google Calendar to generate a booking page
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Your booking page URL:</span>
                <code className="px-2 py-1 bg-muted rounded text-sm">
                  {window.location.origin}/booking/1
                </code>
                <Button variant="outline" size="sm" onClick={copyBookingUrl}>
                  Copy
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Preview your booking page</h4>
                  <p className="text-sm text-muted-foreground">
                    See how your booking page appears to clients
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/booking/1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                    Preview <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Booking settings</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Appointment duration</label>
                      <select className="text-sm rounded border p-1">
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Lead time</label>
                      <select className="text-sm rounded border p-1">
                        <option value="0">No lead time</option>
                        <option value="1">1 hour</option>
                        <option value="24">24 hours</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Buffer between meetings</label>
                      <select className="text-sm rounded border p-1">
                        <option value="0">No buffer</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Advance notice</label>
                      <select className="text-sm rounded border p-1">
                        <option value="1">1 day</option>
                        <option value="2">2 days</option>
                        <option value="7">1 week</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}