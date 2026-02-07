import React, { createContext, useCallback, useContext, useState } from 'react';
import * as storage from '../storage';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(storage.isAdminAuthenticated);

  const login = useCallback((password: string): boolean => {
    const ok = storage.checkAdminPassword(password);
    if (ok) {
      storage.setAdminAuthenticated(true);
      setIsAuthenticated(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    storage.setAdminAuthenticated(false);
    setIsAuthenticated(false);
  }, []);

  const value: AuthContextValue = { isAuthenticated, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
