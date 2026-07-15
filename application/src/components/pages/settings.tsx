"use client";

import Link from "next/link";
import { useState } from "react";
import { Database, KeyRound, LockKeyhole, LogOut, Mail, Palette, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { cx } from "@/lib/finance-helpers";
import { Panel, Field, ComputedField, Badge } from "@/components/ui";
import { StatusPill } from "@/components/ui/date-range";
import { SettingsModalKind, ThemeCustomizeModal, NotionConfigModal, ChangeEmailModal, ChangePasswordModal, DeleteAccountModal } from "@/components/pages/settings-modals";
import type { SchemaHealth } from "@/types/finance";

function SettingsPage({
  schemaHealth,
  onSchemaVerify,
  showFab,
  onShowFabChange,
}: {
  schemaHealth: SchemaHealth;
  onSchemaVerify: () => void;
  showFab: boolean;
  onShowFabChange: (next: boolean) => void;
}) {
  const { user, loading, logout } = useAuth();
  const [modal, setModal] = useState<SettingsModalKind>(null);
  const { mode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } = useTheme();

  return (
    <div className="page-stack">
      <Panel title="Interface">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Quick-action button</p>
            <p className="settings-toggle__hint">
              Show a floating button for adding income/expense and printing
              receipts or monthly insights.
            </p>
          </div>
          <label
            className={cx("switch", showFab && "switch--on")}
            aria-label="Toggle quick-action button"
          >
            <input
              type="checkbox"
              checked={showFab}
              onChange={(event) => onShowFabChange(event.target.checked)}
            />
            <span className="switch__track"><span className="switch__thumb" /></span>
          </label>
        </div>
      </Panel>
      <Panel title="Theme">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Appearance &amp; Colors</p>
            <p className="settings-toggle__hint">
              Click here to{" "}
              <button
                type="button"
                className="settings-inline-link"
                onClick={() => setModal("theme")}
              >
                customize
              </button>{" "}
              your appearance settings.
            </p>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => setModal("theme")}
          >
            <Palette size={16} />
            Customize
          </button>
        </div>
      </Panel>
      <section className="two-column">
        <Panel
          title="Account"
          action={
            user
              ? <Badge tone="green">{user.email}</Badge>
              : <Badge tone="neutral">Not signed in</Badge>
          }
        >
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <div className="form-grid form-grid--single">
              <Field label="Name"><input value={user.name} readOnly /></Field>
              <Field label="Email"><input value={user.email} readOnly /></Field>
              <div className="settings-actions">
                <button type="button" className="button" onClick={() => setModal("email")}>
                  <Mail size={16} />
                  Change Email
                </button>
                <button type="button" className="button" onClick={() => setModal("password")}>
                  <KeyRound size={16} />
                  Change Password
                </button>
                <button type="button" className="button" onClick={logout}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-preview">
              <Link href="/login" className="button button--primary">
                <LockKeyhole size={16} />
                Sign In
              </Link>
              <Link href="/register" className="button">
                <ShieldCheck size={16} />
                Create Account
              </Link>
            </div>
          )}
        </Panel>
        <Panel title="Schema" action={<StatusPill syncState="idle" schemaHealth={schemaHealth} />}>
          <div className="form-grid form-grid--single">
            <Field label="Backend API Base Path">
              <input value="/api/v1" readOnly />
            </Field>
            <ComputedField label="Token Storage" value="Backend only (AES-256-GCM encrypted)" />
            <ComputedField label="Database Mapping" value="Per-user Notion configuration" />
            <button type="button" className="button button--primary" onClick={onSchemaVerify}>
              <Database size={16} />
              Verify Schema
            </button>
          </div>
        </Panel>
      </section>

      {user && (
        <Panel title="Notion Configuration">
          <div className="settings-row">
            <p>Your Notion integration token and database IDs are stored encrypted on the backend.</p>
            <button type="button" className="button button--primary" onClick={() => setModal("notion")}>
              <Database size={16} />
              Manage Configuration
            </button>
          </div>
        </Panel>
      )}

      {user && (
        <Panel title="Danger Zone">
          <div className="settings-row settings-row--danger">
            <p>Permanently delete your account and all associated data. This cannot be undone.</p>
            <button type="button" className="button button--danger" onClick={() => setModal("delete")}>
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </Panel>
      )}

      {modal === "notion" && <NotionConfigModal onClose={() => setModal(null)} />}
      {modal === "email" && <ChangeEmailModal onClose={() => setModal(null)} />}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === "delete" && <DeleteAccountModal onClose={() => setModal(null)} />}
      {modal === "theme" && <ThemeCustomizeModal onClose={() => setModal(null)} />}
    </div>
  );
}

export { SettingsPage };
