"use client";

import { createContext, useContext, useEffect, useState, startTransition } from "react";
import type { ReactNode } from "react";
import { authApi, requestBackend, setAuthToken } from "./api-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

type Result = { ok: boolean; error?: string };

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (email: string, password: string, name?: string) => Promise<Result>;
  logout: () => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<Result>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  deleteAccount: (currentPassword: string) => Promise<Result>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Best-effort user reconstruction from a JWT payload (no verification). */
function decodeUserFromToken(token: string): AuthUser | null {
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { id?: string; email?: string };
    if (!payload.id || !payload.email) return null;
    return { id: payload.id, email: payload.email, name: payload.email.split("@")[0] };
  } catch {
    return null;
  }
}

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
          }
          // A definitive 401 is handled centrally by requestBackend (it clears
          // the token and redirects to /login), so nothing to do here.
        })
        .catch(() => {
          // Transient/network error (e.g. backend restarting) — keep the saved
          // token and optimistically restore the user from it, so a blip does
          // not silently sign the user out.
          const optimistic = decodeUserFromToken(saved);
          if (optimistic) {
            startTransition(() => setUser(optimistic));
          }
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

  const changeEmail = async (currentPassword: string, newEmail: string) => {
    const res = await authApi.changeEmail({ currentPassword, newEmail });
    if (!res.success) return { ok: false, error: res.error.message };
    // A fresh token carrying the new email is returned — persist it.
    localStorage.setItem("nf_token", res.data.accessToken);
    setAuthToken(res.data.accessToken);
    setUser(res.data.user);
    return { ok: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await authApi.changePassword({ currentPassword, newPassword });
    if (!res.success) return { ok: false, error: res.error.message };
    return { ok: true };
  };

  const deleteAccount = async (currentPassword: string) => {
    const res = await authApi.deleteAccount({ currentPassword });
    if (!res.success) return { ok: false, error: res.error.message };
    localStorage.removeItem("nf_token");
    setAuthToken(null);
    setUser(null);
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        changeEmail,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
