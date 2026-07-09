"use client";

import { createContext, useContext, useEffect, useState, startTransition } from "react";
import type { ReactNode } from "react";
import { requestBackend, setAuthToken } from "./api-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("nf_token");
    if (saved) {
      setAuthToken(saved);
      requestBackend<AuthUser>("/auth/me", {
        headers: { authorization: `Bearer ${saved}` },
      })
        .then((res) => {
          if (res.success) {
            startTransition(() => setUser(res.data));
          } else {
            localStorage.removeItem("nf_token");
            setAuthToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("nf_token");
          setAuthToken(null);
        })
        .finally(() => startTransition(() => setLoading(false)));
    } else {
      startTransition(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await requestBackend<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.success) {
      return { ok: false, error: res.error.message };
    }
    localStorage.setItem("nf_token", res.data.accessToken);
    setAuthToken(res.data.accessToken);
    setUser(res.data.user);
    return { ok: true };
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await requestBackend<{ accessToken: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.success) {
      return { ok: false, error: res.error.message };
    }
    localStorage.setItem("nf_token", res.data.accessToken);
    setAuthToken(res.data.accessToken);
    setUser(res.data.user);
    return { ok: true };
  };

  const logout = async () => {
    try {
      await requestBackend("/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors
    }
    localStorage.removeItem("nf_token");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
