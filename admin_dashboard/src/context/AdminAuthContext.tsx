import React, { createContext, useContext, useState, useEffect } from "react";
import { AdminUser, AdminAuthResponse } from "@/types";
import { adminAuthApi } from "@/api/auth";

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("aura_admin_token");
    if (token) {
      adminAuthApi
        .getProfile()
        .then((data) => setAdmin(data))
        .catch(() => {
          localStorage.removeItem("aura_admin_token");
          setAdmin(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res: AdminAuthResponse = await adminAuthApi.login(data);
    localStorage.setItem("aura_admin_token", res.token.access_token);
    setAdmin(res.admin);
  };

  const logout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem("aura_admin_token");
      setAdmin(null);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
