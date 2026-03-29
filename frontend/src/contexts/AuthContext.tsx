import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '@passwordless-id/webauthn';

interface AuthContextType {
  isAuthenticated: boolean;
  isSetup: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  setup: () => Promise<void>;
  logout: () => Promise<void>;
  addDevice: () => Promise<void>;
  credentials: { id: string; created_at: string; last_used_at: string | null }[];
  removeCredential: (id: string) => Promise<void>;
  refreshCredentials: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<{ id: string; created_at: string; last_used_at: string | null }[]>([]);

  // Check auth status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`, {
        credentials: 'include',
      });
      const data = await res.json();
      setIsSetup(data.isSetup);
      setIsAuthenticated(data.isAuthenticated);
      
      if (data.isAuthenticated) {
        await fetchCredentials();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/credentials`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Fetch credentials failed:', error);
    }
  };

  const refreshCredentials = async () => {
    if (isAuthenticated) {
      await fetchCredentials();
    }
  };

  const setup = async () => {
    try {
      // Get challenge from server
      const challengeRes = await fetch(`${API_URL}/auth/register/challenge`, {
        credentials: 'include',
      });
      
      if (!challengeRes.ok) {
        throw new Error('Failed to get challenge');
      }
      
      const { challenge } = await challengeRes.json();

      // Register passkey - v2 API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const registration = await (client as any).register({
        user: 'owner',
        challenge,
        authenticatorType: 'both',
        userVerification: 'required',
        discoverable: 'required',
      });

      // Send to server
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ registration, challenge }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Setup failed');
      }

      await checkStatus();
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  };

  const login = async () => {
    try {
      // Get challenge from server
      const challengeRes = await fetch(`${API_URL}/auth/login/challenge`, {
        credentials: 'include',
      });
      
      if (!challengeRes.ok) {
        const error = await challengeRes.json();
        throw new Error(error.error || 'Failed to get challenge');
      }
      
      const { challenge } = await challengeRes.json();

      // Authenticate with passkey - v2 API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authentication = await (client as any).authenticate({
        challenge,
        userVerification: 'required',
      });

      // Send to server
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ authentication, challenge }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Login failed');
      }

      await checkStatus();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setIsAuthenticated(false);
      setCredentials([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addDevice = async () => {
    // Same as setup, but requires authentication (done automatically by server checking session)
    await setup();
    await fetchCredentials();
  };

  const removeCredential = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/credentials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove credential');
      }

      await fetchCredentials();
    } catch (error) {
      console.error('Remove credential error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isSetup,
        isLoading,
        login,
        setup,
        logout,
        addDevice,
        credentials,
        removeCredential,
        refreshCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
