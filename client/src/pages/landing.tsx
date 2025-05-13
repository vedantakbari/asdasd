import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CalendarDays, 
  Mails, 
  UserCircle2, 
  Kanban, 
  CreditCard, 
  LineChart, 
  BarChart, 
  CheckCircle2
} from 'lucide-react';

import LandingLayout from '../components/landing/landing-layout';

const LandingPage = () => {
  const [_, setLocation] = useLocation();
  
  const handleGetStarted = () => {
    window.location.href = '/api/login';
  };
  
  return (
    <LandingLayout>
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                <span className="block">The Complete CRM for</span>
                <span className="block text-primary">All Business Types</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Manage your leads, clients, appointments, and payments all in one place. 
                Streamline your workflow and grow your business with our powerful, yet simple CRM solution designed for businesses of any size or industry.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleGetStarted} className="bg-primary hover:bg-primary/90 text-white font-semibold px-8">
                  Get Started — It's FREE!
                </Button>
                <Button variant="outline" size="lg" onClick={() => setLocation('/features')}>
                  See All Features
                </Button>
              </div>
              <div className="mt-6 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                <p className="text-gray-600">No credit card required</p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="ServiceCRM Dashboard Preview" 
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary/10 rounded-full h-32 w-32 z-0"></div>
              <div className="absolute -top-6 -left-6 bg-primary/10 rounded-full h-24 w-24 z-0"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Run Your Business Efficiently</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive toolkit helps you streamline operations, delight your customers, and grow your business - whether you're a retail store, consulting firm, or any other industry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<UserCircle2 className="h-10 w-10 text-primary" />}
              title="Lead Management"
              description="Easily capture, track, and nurture leads. Never miss a potential client again."
            />
            <FeatureCard 
              icon={<Kanban className="h-10 w-10 text-primary" />}
              title="Client Pipeline"
              description="Visualize your sales process with customizable pipelines. Move clients from prospect to paying customer."
            />
            <FeatureCard 
              icon={<CalendarDays className="h-10 w-10 text-primary" />}
              title="Smart Scheduling"
              description="Manage appointments, set reminders, and sync with Google Calendar for seamless scheduling."
            />
            <FeatureCard 
              icon={<Mails className="h-10 w-10 text-primary" />}
              title="Email Integration"
              description="Send and receive emails directly in the CRM. Keep all client communications in one place."
            />
            <FeatureCard 
              icon={<CreditCard className="h-10 w-10 text-primary" />}
              title="Payment Processing"
              description="Accept payments, track invoices, and monitor revenue streams all within the platform."
            />
            <FeatureCard 
              icon={<LineChart className="h-10 w-10 text-primary" />}
              title="Performance Analytics"
              description="Gain valuable insights with robust reporting and analytics tools to make data-driven decisions."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start for free and unlock premium features as your business grows.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200 hover:border-primary transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Free Forever</p>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-5xl font-extrabold text-gray-900">$0</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <FeatureItem>Up to 50 leads</FeatureItem>
                  <FeatureItem>Basic Email Integration</FeatureItem>
                  <FeatureItem>Appointment Scheduling</FeatureItem>
                  <FeatureItem>Client Management</FeatureItem>
                  <FeatureItem>Mobile Access</FeatureItem>
                </div>
                <div className="mt-8">
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="border-2 border-primary relative lg:scale-105 z-10 shadow-xl">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-md rounded-tr-md">
                MOST POPULAR
              </div>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pro</p>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-5xl font-extrabold text-gray-900">$29</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <FeatureItem>Unlimited leads & clients</FeatureItem>
                  <FeatureItem>Advanced Email Integration</FeatureItem>
                  <FeatureItem>Payment Processing</FeatureItem>
                  <FeatureItem>Custom Pipelines</FeatureItem>
                  <FeatureItem>Basic Analytics</FeatureItem>
                  <FeatureItem>Team Collaboration</FeatureItem>
                </div>
                <div className="mt-8">
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Start Free Trial
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="border-2 border-gray-200 hover:border-primary transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Enterprise</p>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-5xl font-extrabold text-gray-900">$79</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <FeatureItem>Everything in Pro, plus:</FeatureItem>
                  <FeatureItem>Advanced Analytics</FeatureItem>
                  <FeatureItem>API Access</FeatureItem>
                  <FeatureItem>Dedicated Support</FeatureItem>
                  <FeatureItem>Custom Integrations</FeatureItem>
                  <FeatureItem>White Labeling</FeatureItem>
                </div>
                <div className="mt-8">
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Businesses of All Types</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See why businesses across industries choose our CRM to manage their operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="This CRM has transformed how I run my retail business. The lead tracking and client management tools have saved me hours every week and increased our sales."
              author="Thomas Wilson"
              role="Owner, Wilson Retail Group"
            />
            <TestimonialCard 
              quote="As a consultant, keeping track of client interactions and follow-ups is crucial. This platform has simplified my workflow and helped me grow my client base substantially."
              author="Sarah Johnson"
              role="Johnson Consulting"
            />
            <TestimonialCard 
              quote="The email integration feature is amazing. Being able to communicate with clients without switching between apps has made our marketing agency much more efficient."
              author="Robert Garcia"
              role="Garcia Marketing Agency"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to streamline your business operations?</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Join thousands of businesses across all industries who use ServiceCRM to manage their operations more effectively.
            </p>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-primary hover:bg-gray-100 px-8"
            >
              Get Started For Free
            </Button>
          </div>
        </div>
      </section>


    </LandingLayout>
  );
};

// Helper Components
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300 h-full">
      <CardContent className="p-6">
        <div className="mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
};

const FeatureItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center">
      <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
      <span className="text-gray-700">{children}</span>
    </div>
  );
};

const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => {
  return (
    <Card className="border border-gray-200 hover:shadow-md transition-all duration-300 h-full">
      <CardContent className="p-6">
        <div className="mb-4 text-primary">
          <svg width="45" height="36" fill="currentColor" className="opacity-30">
            <path d="M13.415.43c-2.523 0-4.75 1.173-6.682 3.52C4.8 6.298 3.756 9.395 3.756 12.43c0 3.035 1.043 5.782 3.126 8.24 2.083 2.462 4.378 3.692 6.884 3.692 1.682 0 3.126-.4 4.33-1.197 1.204-.798 1.806-1.91 1.806-3.34 0-1.432-.602-2.544-1.806-3.342-1.204-.798-2.648-1.197-4.33-1.197a5.19 5.19 0 0 1-1.14.127c.285-1.348 1.075-2.695 2.37-4.042 1.293-1.347 2.56-2.02 3.802-2.02.38 0 .67.09.865.275.195.183.292.494.292.932 0 .44-.097.75-.292.934-.195.183-.486.274-.865.274-.38 0-.76.24-1.14.72-.38.48-.57.883-.57 1.216 0 .333.277.72.832 1.2.554.482 1.21.723 1.97.723 1.683 0 3.078-.814 4.184-2.44 1.205-1.63 1.807-3.374 1.807-5.234C21.18 6.924 19.54 5 16.24 3.48 15.976 1.16 14.79 0 13.414 0Z"></path>
          </svg>
        </div>
        <p className="text-gray-700 mb-6">{quote}</p>
        <div>
          <p className="font-semibold text-gray-900">{author}</p>
          <p className="text-gray-500 text-sm">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LandingPage;