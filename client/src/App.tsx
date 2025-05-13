import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Clients from "@/pages/clients";
import CalendarPage from "@/pages/calendar";
import BookingPage from "@/pages/booking";
import Tasks from "@/pages/tasks";
import Inbox from "@/pages/inbox";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import EmailSync from "@/pages/email-sync";
import NotFound from "@/pages/not-found";

// Simple component for rendering routes
function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={Leads} />
      <Route path="/clients" component={Clients} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/booking/:userId" component={BookingPage} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/payments" component={Payments} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/email-sync" component={EmailSync} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App component
function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Mobile Sidebar */}
        <MobileSidebar 
          isOpen={isMobileSidebarOpen} 
          onClose={() => setIsMobileSidebarOpen(false)} 
        />
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-10">
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
            <div className="w-6"></div> {/* Spacer */}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppRouter />
        </div>
        
        {/* Toaster for notifications */}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;