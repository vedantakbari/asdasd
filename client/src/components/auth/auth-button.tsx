import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, LogOut } from "lucide-react";

export const AuthButton = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const { toast } = useToast();

  const handleAuth = () => {
    if (isAuthenticated) {
      // Use the logout function from auth context
      logout();
    } else {
      // Use the login function from auth context
      login();
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleAuth}
    >
      {isAuthenticated ? (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Logout {user?.firstName || user?.email?.split('@')[0] || ''}
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </>
      )}
    </Button>
  );
};