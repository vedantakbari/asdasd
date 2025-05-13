import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import LandingLayout from '../components/landing/landing-layout';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about ServiceCRM? Need help getting started? Our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
                <p className="text-gray-600 mb-6">
                  We'd love to hear from you. Contact us through the form or using the information below.
                </p>
              </div>
              
              <ContactInfoCard 
                icon={<Mail className="h-5 w-5 text-primary" />}
                title="Email"
                details={["support@servicecrm.com", "sales@servicecrm.com"]}
              />
              
              <ContactInfoCard 
                icon={<Phone className="h-5 w-5 text-primary" />}
                title="Phone"
                details={["(555) 123-4567", "Mon-Fri, 9am-6pm ET"]}
              />
              
              <ContactInfoCard 
                icon={<MapPin className="h-5 w-5 text-primary" />}
                title="Office"
                details={["123 Business Avenue", "Suite 200", "New York, NY 10001"]}
              />
              
              <ContactInfoCard 
                icon={<Clock className="h-5 w-5 text-primary" />}
                title="Business Hours"
                details={["Monday-Friday: 9am-6pm ET", "Saturday-Sunday: Closed"]}
              />
            </div>
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Send Us a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          placeholder="Your name" 
                          value={formData.name}
                          onChange={handleChange}
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          placeholder="Your email address" 
                          value={formData.email}
                          onChange={handleChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input 
                          id="company" 
                          name="company" 
                          placeholder="Your company (optional)" 
                          value={formData.company}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject" 
                          name="subject" 
                          placeholder="Message subject" 
                          value={formData.subject}
                          onChange={handleChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        placeholder="How can we help you?" 
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <iframe 
              title="Office Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976397304903!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1616629675193!5m2!1sen!2s" 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
            ></iframe>
          </div>
        </div>
      </section>

      {/* FAQ Teaser Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about ServiceCRM.
            </p>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/faq'}
            >
              Visit FAQ Page
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

// Helper Component
const ContactInfoCard = ({ icon, title, details }: { icon: React.ReactNode, title: string, details: string[] }) => {
  return (
    <div className="flex items-start space-x-4">
      <div className="mt-1">{icon}</div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="mt-1 space-y-1">
          {details.map((detail, index) => (
            <p key={index} className="text-gray-600">{detail}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;