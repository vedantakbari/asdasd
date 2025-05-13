import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isTomorrow, addDays, parseISO } from 'date-fns';
import { CheckCircle2, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface BookingPageData {
  userName: string;
  availableSlots: TimeSlot[];
}

export default function BookingPage() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    note: ''
  });

  // Fetch available time slots
  useEffect(() => {
    async function fetchBookingData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/calendar/public/${userId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This booking page is not available or the calendar is not connected.');
          }
          throw new Error('Failed to load booking data');
        }
        
        const data = await response.json();
        setBookingData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        setBookingData(null);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchBookingData();
    }
  }, [userId]);

  // Get time slots for the selected date
  const getTimeSlotsForDate = (date: Date | undefined) => {
    if (!date || !bookingData?.availableSlots) return [];
    
    return bookingData.availableSlots.filter(slot => {
      const slotDate = parseISO(slot.startTime);
      return (
        slotDate.getDate() === date.getDate() && 
        slotDate.getMonth() === date.getMonth() && 
        slotDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format date for display
  const formatDateHeading = (date: Date | undefined) => {
    if (!date) return '';
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMMM d');
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTime || !userId) {
      toast({
        title: 'Error',
        description: 'Please select a time slot',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/calendar/book', {
        userId: parseInt(userId),
        slotId: selectedTime.id,
        ...formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }
      
      setBookingComplete(true);
      toast({
        title: 'Success',
        description: 'Your appointment has been booked',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to book appointment',
        variant: 'destructive',
      });
    }
  };

  // Handle time slot selection
  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedTime(slot);
  };

  // Next step button handler
  const handleNextStep = () => {
    if (!selectedTime) {
      toast({
        title: 'Please select a time',
        description: 'Choose an available time slot to continue',
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmStep(true);
  };

  // Go back to time selection
  const handleBack = () => {
    setConfirmStep(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">Booking Unavailable</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-muted-foreground">
            The calendar may not be connected or configured properly.
          </p>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center border-b">
            <div className="mx-auto my-4 bg-green-100 text-green-800 rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>
              Your appointment has been successfully scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Appointment Details</h3>
              <div className="flex items-start gap-3 text-sm">
                <CalendarIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {selectedTime && format(parseISO(selectedTime.startTime), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {selectedTime && `${format(parseISO(selectedTime.startTime), 'h:mm a')} - ${format(parseISO(selectedTime.endTime), 'h:mm a')}`}
                  </p>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-semibold">Your Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p>{formData.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{formData.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{formData.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            {formData.note && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Your Note</h3>
                  <p className="text-sm">{formData.note}</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-center text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                Print Details
              </Button>
              <Button className="w-full" onClick={() => window.location.reload()}>
                Book Another
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!confirmStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="max-w-6xl w-full grid md:grid-cols-[1fr_2fr] gap-8 p-4 sm:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{bookingData?.userName || 'Consultation'}</h1>
              <p className="text-muted-foreground">30 min | Video call</p>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">30 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">Video call</p>
              </div>
            </div>

            <div className="py-4">
              <Separator />
            </div>

            <div>
              <h3 className="font-medium mb-2">About this appointment</h3>
              <p className="text-sm text-muted-foreground">
                Book a consultation to discuss your home service needs. We'll go over your project requirements, timeline, and provide a free estimate.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Select a Date & Time</h2>
            </div>
            
            <div className="grid md:grid-cols-[2fr_3fr]">
              <div className="p-4 border-r">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ before: addDays(new Date(), 1) }}
                  className="rounded-md border"
                />
              </div>
              
              <div className="h-full">
                <div className="p-4 border-b">
                  <h3 className="font-medium">
                    {formatDateHeading(selectedDate)}
                  </h3>
                </div>
                
                <ScrollArea className="h-[300px] md:h-[320px]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
                    {getTimeSlotsForDate(selectedDate).length > 0 ? (
                      getTimeSlotsForDate(selectedDate).map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedTime?.id === slot.id ? "default" : "outline"}
                          className="justify-start px-3 py-6 h-auto"
                          onClick={() => handleTimeSelect(slot)}
                        >
                          {format(parseISO(slot.startTime), 'h:mm a')}
                        </Button>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        No available times on this date
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={handleNextStep}
                    disabled={!selectedTime}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="max-w-6xl w-full grid md:grid-cols-[1fr_2fr] gap-8 p-4 sm:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{bookingData?.userName || 'Consultation'}</h1>
            <p className="text-muted-foreground">30 min | Video call</p>
          </div>

          <div className="py-4">
            <Separator />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Your selected time</h3>
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {selectedTime && format(parseISO(selectedTime.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {selectedTime && `${format(parseISO(selectedTime.startTime), 'h:mm a')} - ${format(parseISO(selectedTime.endTime), 'h:mm a')}`}
                </p>
              </div>
            </div>
            <Button variant="link" onClick={handleBack} className="p-0 h-auto text-sm">
              Change time
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Enter your details</h2>
            <p className="text-sm text-muted-foreground">
              Provide your information to book the appointment
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name" 
                    required 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com" 
                    required 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number (optional)" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="note">Add a note</Label>
                  <Textarea 
                    id="note" 
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Let us know about your project or any questions you have" 
                    rows={4}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t">
              <Button type="submit" className="w-full">
                Book Appointment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}