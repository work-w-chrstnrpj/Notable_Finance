"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { userNotionConfigApi } from "@/lib/api-client";

const REQUIRED_DB_KEYS = [
  { key: "accounts", label: "Accounts DB ID" },
  { key: "incomeCategories", label: "Income Categories DB ID" },
  { key: "incomes", label: "Incomes DB ID" },
  { key: "expenseCategories", label: "Expense Categories DB ID" },
  { key: "expenses", label: "Expenses DB ID" },
] as const;

const OPTIONAL_DB_KEYS = [
  { key: "monthlyMonitoring", label: "Monthly Monitoring DB ID (optional)" },
] as const;

type DbIdMap = Record<string, string>;

const emptyDbIds: DbIdMap = Object.fromEntries(
  [...REQUIRED_DB_KEYS, ...OPTIONAL_DB_KEYS].map((f) => [f.key, ""]),
);

export default function NotionConnectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [token, setToken] = useState("");
  const [dbIds, setDbIds] = useState<DbIdMap>(emptyDbIds);
  const [alreadyConfigured, setAlreadyConfigured] = useState(false);
  const [tokenAlreadySet, setTokenAlreadySet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/notion-connect");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const res = await userNotionConfigApi.get();
      if (cancelled) return;
      if (res.success) {
        setAlreadyConfigured(res.data.configured);
        setTokenAlreadySet(res.data.tokenConfigured);
        setDbIds({ ...emptyDbIds, ...res.data.dbIds });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setDbId = useCallback((key: string, value: string) => {
    setDbIds((prev) => ({ ...prev, [key]: value.trim() }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    const missing = REQUIRED_DB_KEYS.filter((f) => !dbIds[f.key]);
    if (missing.length > 0) {
      setError(`Missing required DB IDs: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    if (!tokenAlreadySet && !token.trim()) {
      setError("Notion integration token is required.");
      return;
    }

    const payload: { token?: string; dbIds: DbIdMap } = {
      dbIds: Object.fromEntries(
        Object.entries(dbIds).filter(([, v]) => v.trim().length > 0),
      ),
    };
    if (token.trim()) {
      payload.token = token.trim();
    }

    setSubmitting(true);
    const res = await userNotionConfigApi.save(payload);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error.message || "Failed to save Notion configuration.");
      return;
    }

    setToken("");
    setTokenAlreadySet(true);
    setAlreadyConfigured(true);
    setNotice("Notion connection saved.");
    router.push("/dashboard");
  }

  async function handleDisconnect() {
    if (!alreadyConfigured) return;
    if (!window.confirm("Disconnect Notion? This clears your token and DB IDs.")) {
      return;
    }
    setError("");
    setNotice("");
    setSubmitting(true);
    const res = await userNotionConfigApi.remove();
    setSubmitting(false);
    if (!res.success) {
      setError(res.error.message || "Failed to disconnect.");
      return;
    }
    setToken("");
    setDbIds(emptyDbIds);
    setAlreadyConfigured(false);
    setTokenAlreadySet(false);
    setNotice("Notion connection removed.");
  }

  if (authLoading || loading) {
    return (
      <div className="auth-page">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form auth-form--wide" onSubmit={handleSubmit}>
        <h1>Connect Notion</h1>
        <p className="auth-form__subtitle">
          Paste your internal integration token and the 5 database IDs the integration
          has been shared with. Your token is encrypted at rest.
        </p>

        {error && <div className="auth-form__error">{error}</div>}
        {notice && <div className="auth-form__notice">{notice}</div>}

        <label>
          Notion Integration Token
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={tokenAlreadySet ? "•••••••• (set — leave blank to keep)" : "ntn_…"}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <fieldset className="notion-connect__fieldset">
          <legend>Required databases</legend>
          {REQUIRED_DB_KEYS.map((f) => (
            <label key={f.key}>
              {f.label}
              <input
                type="text"
                value={dbIds[f.key] ?? ""}
                onChange={(e) => setDbId(f.key, e.target.value)}
                spellCheck={false}
                autoComplete="off"
                required
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="notion-connect__fieldset">
          <legend>Optional</legend>
          {OPTIONAL_DB_KEYS.map((f) => (
            <label key={f.key}>
              {f.label}
              <input
                type="text"
                value={dbIds[f.key] ?? ""}
                onChange={(e) => setDbId(f.key, e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="button button--primary"
          disabled={submitting}
        >
          {submitting ? "Saving…" : alreadyConfigured ? "Update Connection" : "Save Connection"}
        </button>

        {alreadyConfigured && (
          <button
            type="button"
            className="button button--ghost"
            onClick={handleDisconnect}
            disabled={submitting}
          >
            Disconnect Notion
          </button>
        )}

        <p className="auth-form__footer">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </form>
    </div>
  );
}
