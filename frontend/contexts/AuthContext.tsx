import React, { createContext, useContext, useEffect, useState } from 'react';
import authService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    phone: string;
    fullName: string;
    role?: 'admin' | 'user';
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  setUser: (user: User | null) => void; // Add setUser function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // Re-enable auto auth check to persist login state
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authService.checkAuthStatus();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ username, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    phone: string;
    fullName: string;
    role?: 'admin' | 'user';
  }): Promise<boolean> => {
    try {
      console.log('Attempting to register with data:', userData);
      const response = await authService.register(userData);
      console.log('Register response:', response);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return true;
      }
      
      console.log('Register failed - response not successful');
      return false;
    } catch (error) {
      console.log('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading, setUser }}>
          {children}
        </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
