import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Family } from '../types';
import * as authService from '../services/authService';
import * as familyService from '../services/familyService';
import * as documentService from '../services/documentService';

interface AuthContextType {
  user: User | null;
  family: Family | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshFamily: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('paperless_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [family, setFamily] = useState<Family | null>(() => {
    try {
      const saved = localStorage.getItem('paperless_family');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const res = await authService.getCurrentUser();
        if (res && res.data) {
          setUser(res.data);
          localStorage.setItem('paperless_user', JSON.stringify(res.data));
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // Keep cached user if available
    }
  }, []);

  const refreshFamily = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const res = await familyService.getMyFamily();
        if (res && res.data) {
          setFamily(res.data);
          localStorage.setItem('paperless_family', JSON.stringify(res.data));
        }
      } else {
        setFamily(null);
      }
    } catch (err) {
      console.warn('Could not fetch family:', err);
      const cached = localStorage.getItem('paperless_family');
      if (cached) {
        try {
          setFamily(JSON.parse(cached));
        } catch {}
      } else {
        setFamily(null);
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await Promise.allSettled([refreshUser(), refreshFamily()]);
        } catch (e) {
          console.error('Auth initialization error:', e);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [refreshUser, refreshFamily]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    localStorage.removeItem('paperless_family');
    setFamily(null);
    try {
      const res = await authService.login(email, password);
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('paperless_user', JSON.stringify(res.data.user));
      } else {
        await refreshUser();
      }
      try {
        await refreshFamily();
      } catch (fErr) {
        console.warn('Family fetch warning:', fErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    localStorage.removeItem('paperless_family');
    setFamily(null);
    try {
      const res = await authService.register(name, email, password);
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('paperless_user', JSON.stringify(res.data.user));
      } else {
        await refreshUser();
      }
      try {
        await refreshFamily();
      } catch (fErr) {
        console.warn('Family fetch warning:', fErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    documentService.clearVaultSession();
    setUser(null);
    setFamily(null);
    documentService.notifyVaultUpdated();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        loading,
        login,
        register,
        logout,
        refreshUser,
        refreshFamily,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
