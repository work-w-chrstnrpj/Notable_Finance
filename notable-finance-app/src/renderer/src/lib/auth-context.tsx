// Desktop auth stub. Single-user / local — profile name + avatar come from persisted UiSettings.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useUiSettings } from "@/lib/ui-settings-context";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarDataUrl: string | null;
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

const NOT_SUPPORTED: Result = {
  ok: false,
  error: "Accounts do not exist in the desktop app — data lives locally on this device.",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { settings, ready } = useUiSettings();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: {
        id: "local",
        email: "local@this-device",
        name: settings.profile.displayName || "Local User",
        avatarDataUrl: settings.profile.avatarDataUrl,
      },
      loading: !ready,
      login: async () => NOT_SUPPORTED,
      register: async () => NOT_SUPPORTED,
      logout: async () => undefined,
      changeEmail: async () => NOT_SUPPORTED,
      changePassword: async () => NOT_SUPPORTED,
      deleteAccount: async () => NOT_SUPPORTED,
    }),
    [settings.profile.displayName, settings.profile.avatarDataUrl, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
