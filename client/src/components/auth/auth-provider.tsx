import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any;
  loginRedirect: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  loginRedirect: () => window.location.href = '/api/login',
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [authAttempts, setAuthAttempts] = useState(0);

  // Function to redirect to login
  const loginRedirect = () => {
    window.location.href = '/api/login';
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Add a cache-busting parameter to prevent stale responses
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/auth/user?t=${timestamp}`, {
          credentials: 'include', // Always include credentials
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        
        if (response.ok) {
          try {
            const userData = await response.json();
            setUser(userData);
          } catch (jsonError) {
            console.error('Error parsing user data JSON:', jsonError);
            setUser(null);
            setError(new Error('Invalid user data format'));
          }
        } else if (response.status === 401) {
          // Unauthorized - clear any previous user data
          console.log('User not authenticated, clearing user data');
          setUser(null);
        } else {
          console.error('Unexpected response status:', response.status);
          setUser(null);
          setError(new Error(`Server error: ${response.status}`));
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err);
        setUser(null);
        
        // Retry auth if we have network errors
        if (authAttempts < 3) {
          console.log(`Auth attempt ${authAttempts + 1} failed, retrying in 1 second...`);
          setTimeout(() => {
            setAuthAttempts(prev => prev + 1);
          }, 1000);
          return; // Don't set isLoading to false yet
        }
      } finally {
        // Only set loading to false if we're not going to retry
        if (authAttempts >= 3) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();
  }, [authAttempts]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    loginRedirect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};