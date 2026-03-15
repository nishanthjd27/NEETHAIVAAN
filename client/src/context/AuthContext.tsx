// path: client/src/context/AuthContext.tsx
// Global authentication state. Persists JWT to localStorage.
// All components access auth via useAuth() hook.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';

interface User {
  _id:   string;
  name:  string;
  email: string;
  role:  'user' | 'lawyer' | 'admin';
}

interface AuthContextType {
  user:     User | null;
  token:    string | null;
  login:    (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout:   () => Promise<void>;
  loading:  boolean;
}

interface RegisterData {
  name: string; email: string; password: string; role?: string; phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(localStorage.getItem('nv_token'));
  const [loading, setLoading] = useState(true);

  // Set axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch current user profile
      axios.get(`${API_BASE}/auth/me`)
        .then((r) => setUser(r.data.user))
        .catch(() => { setToken(null); localStorage.removeItem('nv_token'); })
        .finally(() => setLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    localStorage.setItem('nv_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (formData: RegisterData) => {
    const { data } = await axios.post(`${API_BASE}/auth/register`, formData);
    localStorage.setItem('nv_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try { await axios.post(`${API_BASE}/auth/logout`); } catch { /* ignore */ }
    localStorage.removeItem('nv_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
