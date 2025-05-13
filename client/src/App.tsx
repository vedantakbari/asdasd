import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, Suspense, lazy } from "react";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import ErrorBoundary from "@/components/error-boundary";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
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
    // Redirect to the login page
    window.location.href = '/api/login';
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-3">Redirecting to login...</p>
      </div>
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
        <Router />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
