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
  
  // Create a wrapper for protected routes
  const ProtectedComponent = ({ component: Component }: { component: React.ComponentType<any> }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/api/login';
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-3">Redirecting to login...</p>
        </div>
      );
    }
    
    return (
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    );
  };

  // Public route for booking
  if (window.location.pathname.startsWith('/booking/')) {
    return (
      <Switch>
        <Route path="/booking/:userId">
          {(params) => <BookingPage userId={params.userId} />}
        </Route>
      </Switch>
    );
  }

  // Main router with protected routes
  return (
    <Switch>
      <Route path="/leads/new">
        <ProtectedComponent component={Leads} />
      </Route>
      <Route path="/leads/:id/edit">
        <ProtectedComponent component={Leads} />
      </Route>
      <Route path="/leads/:id">
        <ProtectedComponent component={Leads} />
      </Route>
      <Route path="/leads">
        <ProtectedComponent component={Leads} />
      </Route>
      <Route path="/clients/new">
        <ProtectedComponent component={Clients} />
      </Route>
      <Route path="/clients/:id">
        <ProtectedComponent component={Clients} />
      </Route>
      <Route path="/clients">
        <ProtectedComponent component={Clients} />
      </Route>
      <Route path="/calendar">
        <ProtectedComponent component={CalendarPage} />
      </Route>
      <Route path="/tasks">
        <ProtectedComponent component={Tasks} />
      </Route>
      <Route path="/inbox">
        <ProtectedComponent component={Inbox} />
      </Route>
      <Route path="/payments">
        <ProtectedComponent component={Payments} />
      </Route>
      <Route path="/reports">
        <ProtectedComponent component={Reports} />
      </Route>
      <Route path="/settings">
        <ProtectedComponent component={Settings} />
      </Route>
      <Route path="/email-sync">
        <ProtectedComponent component={EmailSync} />
      </Route>
      <Route path="/">
        <ProtectedComponent component={Dashboard} />
      </Route>
      <Route>
        <ErrorBoundary>
          <NotFound />
        </ErrorBoundary>
      </Route>
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
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
