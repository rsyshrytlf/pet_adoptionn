/// <reference types="vite/client" />

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const ADMIN_EMAIL = 'admin@meowmyhome.com';
const ADMIN_PASSWORD = 'admin123';

const translateAuthError = (message?: string) => {
  if (!message) return 'Registrasi gagal';

  const lower = message.toLowerCase();
  if (lower.includes('email has already been taken')) {
    return 'Email sudah terdaftar. Silakan gunakan email lain.';
  }
  if (lower.includes('email field must be a valid email')) {
    return 'Format email belum valid.';
  }
  if (lower.includes('password field must be at least')) {
    return 'Password minimal 6 karakter.';
  }

  return message;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAdmin: (username: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, address: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Login user biasa — hit ke backend API
  const login = async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const apiUser = data.user;

      // Tolak jika role-nya admin (user biasa tidak boleh login di sini)
      if (apiUser.role === 'admin') return false;

      const loggedInUser: User = {
        id: String(apiUser.id),
        email: apiUser.email,
        name: apiUser.name ?? normalizedEmail,
        address: apiUser.address ?? '',
        phone: apiUser.phone ?? '',
        isAdmin: false,
      };

      setUser(loggedInUser);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      return true;
    } catch {
      return false;
    }
  };

  // Login admin — hit ke backend API, pastikan role === 'admin'
  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const loginLocalAdmin = () => {
      if (normalizedEmail !== ADMIN_EMAIL || normalizedPassword !== ADMIN_PASSWORD) {
        return false;
      }

      const adminUser: User = {
        id: '1',
        email: ADMIN_EMAIL,
        name: 'Admin',
        address: '',
        phone: '',
        isAdmin: true,
      };

      setUser(adminUser);
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      return true;
    };

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      if (!res.ok) return loginLocalAdmin();

      const data = await res.json();
      const apiUser = data.user;

      if (apiUser.role !== 'admin') return loginLocalAdmin();

      const adminUser: User = {
        id: String(apiUser.id),
        email: apiUser.email,
        name: apiUser.name ?? 'Administrator',
        address: '',
        phone: '',
        isAdmin: true,
      };

      setUser(adminUser);
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      return true;
    } catch {
      return loginLocalAdmin();
    }
  };

  // Register user baru — hit ke backend API
  const register = async (
    email: string,
    password: string,
    name: string,
    address: string,
    phone: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          address: address.trim(),
          phone: phone.trim(),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        // Ambil pesan error dari Laravel validation
        const errors = data.errors as Record<string, string[]> | undefined;
        const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
        const errMsg = data.message || firstError || 'Registrasi gagal';
        return { success: false, message: translateAuthError(errMsg) };
      }

      const apiUser = data.user;
      const newUser: User = {
        id: String(apiUser.id),
        email: apiUser.email,
        name: apiUser.name,
        address: address,
        phone: phone,
        isAdmin: false,
      };

      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.removeItem('cart'); // Bersihkan keranjang saat daftar baru
      window.dispatchEvent(new Event('cart_clear'));
      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, message: 'Registrasi gagal. Pastikan backend Laravel berjalan dan coba lagi.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart'); // Bersihkan keranjang saat logout
    window.dispatchEvent(new Event('cart_clear'));
  };

  const value = {
    user,
    login,
    loginAdmin,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
