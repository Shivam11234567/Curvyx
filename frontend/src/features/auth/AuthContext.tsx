"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthResponse } from "@/types";
import { authApi } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("aura_customer_token");
    if (token) {
      authApi
        .getProfile()
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem("aura_customer_token");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res: AuthResponse = await authApi.login(data);
    localStorage.setItem("aura_customer_token", res.token.access_token);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res: AuthResponse = await authApi.register(data);
    localStorage.setItem("aura_customer_token", res.token.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("aura_customer_token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
