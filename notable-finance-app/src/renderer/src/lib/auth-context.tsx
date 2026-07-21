// Desktop auth stub. The desktop app is single-user and fully local — there is no login,
// registration, or account management (per product decision). This keeps the web
// components' `useAuth()` contract so they render as "signed in" without a cloud backend.
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

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

const LOCAL_USER: AuthUser = {
  id: "local",
  email: "local@this-device",
  name: "Local User",
};

const NOT_SUPPORTED: Result = {
  ok: false,
  error: "Accounts do not exist in the desktop app — data lives locally on this device.",
};

const value: AuthContextValue = {
  user: LOCAL_USER,
  loading: false,
  login: async () => NOT_SUPPORTED,
  register: async () => NOT_SUPPORTED,
  logout: async () => undefined,
  changeEmail: async () => NOT_SUPPORTED,
  changePassword: async () => NOT_SUPPORTED,
  deleteAccount: async () => NOT_SUPPORTED,
};

const AuthContext = createContext<AuthContextValue>(value);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
