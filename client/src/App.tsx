import React, { useState, useEffect, ErrorInfo, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Clients from "@/pages/clients";
import CalendarPage from "@/pages/calendar";
import BookingPage from "@/pages/booking"; // Public booking page
import Tasks from "@/pages/tasks";
import Inbox from "@/pages/inbox"; // New Inbox page
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import EmailSync from "@/pages/email-sync"; // New Email Sync page
import NotFound from "./pages/not-found";
import LandingPage from "./pages/landing";
import AboutPage from "./pages/about";
import ContactPage from "./pages/contact";
import FAQPage from "./pages/faq";
import PrivacyPage from "./pages/privacy";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";

// Error boundary class component
class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode, fallback: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error }: { error?: Error | null }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <div className="text-red-500 text-6xl mb-4">⚠️</div>
    <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
    <p className="text-gray-600 mb-6 max-w-md text-center px-4">
      {error ? error.message : 'The application encountered an unexpected error. Please try again.'}
    </p>
    <div className="flex space-x-4">
      <button
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors"
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
      <a 
        href="/api/login" 
        className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-md text-white transition-colors"
      >
        Sign In
      </a>
    </div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (error) {
    return <ErrorFallback error={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Public route for booking
  if (window.location.pathname.startsWith('/booking/')) {
    return (
      <Switch>
        <Route path="/booking/:userId" component={BookingPage} />
      </Switch>
    );
  }

  // Show landing pages for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Show CRM app for authenticated users
  return (
    <Switch>
      <Route path="/leads/new" component={Leads} />
      <Route path="/leads/:id/edit" component={Leads} />
      <Route path="/leads/:id" component={Leads} />
      <Route path="/leads" component={Leads} />
      <Route path="/clients/new" component={Clients} />
      <Route path="/clients/:id" component={Clients} />
      <Route path="/clients" component={Clients} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/payments" component={Payments} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/email-sync" component={EmailSync} />
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [appError, setAppError] = useState<Error | null>(null);
  
  // Global error handling
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setAppError(event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (appError) {
    return <ErrorFallback error={appError} />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Only show sidebar and mobile header for authenticated users */}
      {isAuthenticated && !window.location.pathname.startsWith('/booking/') && (
        <>
          <Sidebar />
          <MobileSidebar 
            isOpen={isMobileSidebarOpen} 
            onClose={() => setIsMobileSidebarOpen(false)} 
          />
          
          {/* Mobile Header */}
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
            <div className="flex items-center justify-between h-16 px-4">
              <button 
                type="button" 
                className="text-gray-500 focus:outline-none"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">ServiceCRM</h1>
              <button type="button" className="text-gray-500 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
      
      <Toaster />
      <div className={`flex-1 flex flex-col overflow-hidden ${!isAuthenticated || window.location.pathname.startsWith('/booking/') ? 'w-full' : ''}`}>
        <Suspense fallback={<LoadingSpinner />}>
          <Router />
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
