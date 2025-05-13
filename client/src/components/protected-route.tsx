import React, { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Redirect } from 'wouter';
import ErrorBoundary from './error-boundary';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/api/login';
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  // Return children wrapped in an error boundary
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ProtectedRoute;