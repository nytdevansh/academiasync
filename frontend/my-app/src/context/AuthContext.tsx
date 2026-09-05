import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { getMe, refreshToken as apiRefreshToken, login as apiLogin, logout as apiLogout } from '../api/auth';
import { DEMO_CREDENTIALS } from '../utils/constants';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  quickLogin: (roleKey: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate session against backend /api/v1/auth/me
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch {
      // If backend verification fails or is unreachable in demo, preserve existing valid state
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request refreshed JWT from backend
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await apiRefreshToken();
      if (res.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        setToken(res.data.token);
        return res.data.token;
      }
    } catch {
      // Refresh failed
    }
    return null;
  }, []);

  // Initial session hydration
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Cross-tab synchronization & unauthorized event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(e.newValue);
        if (!e.newValue) {
          setUser(null);
        }
      }
      if (e.key === 'user') {
        if (e.newValue) {
          try { setUser(JSON.parse(e.newValue)); } catch { setUser(null); }
        } else {
          setUser(null);
        }
      }
    };

    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    if (!newToken || !newUser) return;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      apiLogout(storedRefreshToken).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Quick Login for testing with backend validation
  const quickLogin = async (roleKey: string): Promise<User> => {
    setIsLoading(true);
    const cred = DEMO_CREDENTIALS.find(d => 
      d.role.toLowerCase().includes(roleKey.toLowerCase()) || 
      d.email.toLowerCase().includes(roleKey.toLowerCase())
    ) || DEMO_CREDENTIALS[0];

    try {
      const res: any = await apiLogin(cred.email, cred.password);
      if (res.success && res.data) {
        const receivedToken = res.data.token;
        const receivedRefreshToken = res.data.refreshToken;
        const receivedUser = res.data.user || {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          department: res.data.department,
          status: res.data.status || 'active',
        };
        if (receivedToken && receivedUser?._id) {
          login(receivedToken, receivedUser, receivedRefreshToken);
          setIsLoading(false);
          return receivedUser;
        }
      }
      throw new Error('Authentication failed');
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.response?.data?.error || err.message || 'Authentication failed');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      refreshUser,
      refreshToken,
      quickLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
