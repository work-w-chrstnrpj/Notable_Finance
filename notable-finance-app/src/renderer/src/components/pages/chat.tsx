import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  MessageSquarePlus,
  Pencil,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { navigate } from "@/lib/router";
import { useUiSettings } from "@/lib/ui-settings-context";
import { cx } from "@/lib/finance-helpers";
import { AiChatConfigModal } from "@/components/pages/settings-modals";
import type {
  AccountDto,
  ChatCredentialDto,
  ChatDraftDto,
  ChatMessageDto,
  ChatOverlayId,
  ChatProviderCatalogDto,
  ChatThreadDto,
  ExpenseCategoryOption,
  IncomeCategoryOption,
} from "@shared/finance.types";

const PAYMENT_STATUSES = ["Unpaid", "Paid", "Installment", "Cancelled"] as const;
const PAYMENT_FREQUENCIES = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Annually",
] as const;
const PASABUY_STATUSES = [
  "Payment not yet receive",
  "Payment partially received",
  "Payment partially received (installment)",
  "Payment fully received",
] as const;

/** Kinds whose category is fixed by the workflow (locked in the validator). */
const CATEGORY_LOCKED_KINDS = new Set([
  "proposeCreateTransfer",
  "proposeCreateCcPayment",
  "proposeCreateAlkansya",
]);
/** Kinds that move money between two accounts (need a second account field). */
const TRANSACTED_KINDS = new Set(["proposeCreateTransfer", "proposeCreateCcPayment"]);

const FALLBACK_OVERLAYS: Array<{
  id: ChatOverlayId;
  slash: string;
  label: string;
  hint: string;
}> = [
  { id: "default", slash: "/default", label: "Default", hint: "Warm Taglish" },
  { id: "roast", slash: "/roast", label: "Roast", hint: "Tipid coach" },
  { id: "cheer", slash: "/cheer", label: "Cheer", hint: "Dasurv energy" },
  { id: "strict", slash: "/strict", label: "Strict", hint: "Facts only" },
  { id: "quiet", slash: "/quiet", label: "Quiet", hint: "Minimal acks" },
];

/** Prefer current id when still valid; else free-tier, else first, else fallback. */
function pickModelForList(
  currentId: string,
  list: Array<{ id: string; free?: boolean }>,
  fallbackId?: string,
): string {
  if (currentId && list.some((m) => m.id === currentId)) return currentId;
  const free = list.find((m) => m.free);
  return free?.id ?? list[0]?.id ?? fallbackId ?? currentId;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupLabel(updatedAt: number): string {
  const today = startOfDay(Date.now());
  const day = startOfDay(updatedAt);
  const diff = today - day;
  if (diff === 0) return "Today";
  if (diff === 86_400_000) return "Yesterday";
  return "Previous";
}

type DraftForm = {
  name: string;
  amount: string;
  date: string;
  accountId: string;
  categoryId: string;
  transactedAccountId: string;
  paymentStatus: string;
  paymentFrequency: string;
  periodCount: string;
  pasabuyer: string;
  pasabuyStatus: string;
};

function draftToForm(d: ChatDraftDto): DraftForm {
  const p = d.payload as Record<string, unknown>;
  const isIncome = d.resource === "incomes";
  const s = (v: unknown): string => (v == null ? "" : String(v));
  return {
    name: s(isIncome ? p.name : p.description),
    amount: s(isIncome ? p.grossIncome : p.amount),
    date: s(isIncome ? p.date : p.purchaseDate),
    accountId: s(p.accountId),
    categoryId: s(p.categoryId),
    transactedAccountId: s(p.transactedAccountId),
    paymentStatus: s(p.paymentStatus),
    paymentFrequency: s(p.paymentFrequency),
    periodCount: s(p.periodCount),
    pasabuyer: s(p.pasabuyer),
    pasabuyStatus: s(p.pasabuyStatus),
  };
}

type DraftCardProps = {
  draft: ChatDraftDto;
  accounts: AccountDto[];
  incomeCategories: IncomeCategoryOption[];
  expenseCategories: ExpenseCategoryOption[];
  busy: boolean;
  needsKey: boolean;
  onEdit: (draftId: string, edits: Record<string, unknown>) => void | Promise<void>;
  onApprove: (draftId: string) => void | Promise<void>;
  onCancel: (draftId: string) => void | Promise<void>;
};

/**
 * Inline-editable confirm card. Fields recompute server-side on blur / change so
 * `missingRequired` and the Ready state stay authoritative — Approve unlocks the
 * moment the record is complete, with no extra prompt needed.
 */
function DraftCard({
  draft,
  accounts,
  incomeCategories,
  expenseCategories,
  busy,
  needsKey,
  onEdit,
  onApprove,
  onCancel,
}: DraftCardProps) {
  const isIncome = draft.resource === "incomes";
  const isMassUpdate = draft.kind.startsWith("proposeMassUpdate");
  const ready = draft.status === "ready" && draft.missingRequired.length === 0;
  const editable =
    !isMassUpdate && draft.status !== "applied" && draft.status !== "cancelled";
  const dsp = draft.display ?? null;

  const [form, setForm] = useState<DraftForm>(() => draftToForm(draft));
  // Re-sync from the validated server draft after each edit (inputs are already
  // blurred by then, so this never fights the cursor).
  const sig = `${JSON.stringify(draft.payload)}::${draft.status}`;
  useEffect(() => {
    setForm(draftToForm(draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resync on validated payload only
  }, [sig]);

  const profile = (draft.payload._profile ?? {}) as { creditCard?: boolean };
  const showCc = draft.resource === "expenses" && profile.creditCard === true;
  const showPasabuy = draft.resource === "expenses" && draft.payload.isPasabuy === true;
  const showCategory = !CATEGORY_LOCKED_KINDS.has(draft.kind);
  const showTransacted = TRANSACTED_KINDS.has(draft.kind);
  const isCcPayment = draft.kind === "proposeCreateCcPayment";

  const categoryOptions = isIncome
    ? incomeCategories
        .filter((c) => !c.auxiliary)
        .map((c) => ({ id: c.id, label: c.source }))
    : expenseCategories.map((c) => ({ id: c.id, label: c.name }));
  const accountOptions = accounts.map((a) => ({ id: a.id, label: a.name }));

  const setField = (key: keyof DraftForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const commit = (editKey: string, value: string) => {
    void onEdit(draft.id, { [editKey]: value });
  };
  /** Commit only when a text/number/date field actually changed on blur. */
  const commitIfChanged = (key: keyof DraftForm, editKey: string) => {
    if (form[key] !== draftToForm(draft)[key]) commit(editKey, form[key]);
  };

  return (
    <div className="chat-action-card" data-status={draft.status}>
      <div className="chat-action-card__head">
        <div className="chat-action-card__icon" aria-hidden="true">
          {isIncome ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
        </div>
        <div className="chat-action-card__heading">
          <p className="chat-action-card__title">{dsp?.title || draft.summary}</p>
          <p className="chat-action-card__ref">
            {draft.action === "create" ? "New" : "Update"} ·{" "}
            {isIncome ? "Income" : "Expense"}
            {dsp?.note ? ` · ${dsp.note}` : ""}
          </p>
        </div>
        <span
          className={cx(
            "chat-action-card__badge",
            ready
              ? "chat-action-card__badge--ready"
              : "chat-action-card__badge--blocked",
          )}
        >
          {ready ? "Ready" : "Needs info"}
        </span>
      </div>

      {editable ? (
        <div className="chat-action-card__form">
          <label className="chat-field">
            <span className="chat-field__label">
              {isIncome ? "Name" : "Description"}
            </span>
            <input
              className="chat-field__input"
              type="text"
              value={form.name}
              disabled={busy}
              onChange={(e) => setField("name", e.target.value)}
              onBlur={() => commitIfChanged("name", "name")}
            />
          </label>

          <div className="chat-field-row">
            <label className="chat-field">
              <span className="chat-field__label">Amount (PHP)</span>
              <input
                className="chat-field__input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                disabled={busy}
                onChange={(e) => setField("amount", e.target.value)}
                onBlur={() => commitIfChanged("amount", "amount")}
              />
            </label>
            <label className="chat-field">
              <span className="chat-field__label">Date</span>
              <input
                className="chat-field__input"
                type="date"
                value={form.date}
                disabled={busy}
                onChange={(e) => setField("date", e.target.value)}
                onBlur={() => commitIfChanged("date", "date")}
              />
            </label>
          </div>

          <label className="chat-field">
            <span className="chat-field__label">
              {isCcPayment ? "CC Account" : "Account"}
            </span>
            <select
              className="chat-field__input"
              value={form.accountId}
              disabled={busy}
              onChange={(e) => {
                setField("accountId", e.target.value);
                commit("accountId", e.target.value);
              }}
            >
              <option value="">Select account…</option>
              {accountOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {showTransacted && (
            <label className="chat-field">
              <span className="chat-field__label">
                {isCcPayment ? "Payer Account" : "Transfer Account"}
              </span>
              <select
                className="chat-field__input"
                value={form.transactedAccountId}
                disabled={busy}
                onChange={(e) => {
                  setField("transactedAccountId", e.target.value);
                  commit("transactedAccountId", e.target.value);
                }}
              >
                <option value="">Select account…</option>
                {accountOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showCategory && (
            <label className="chat-field">
              <span className="chat-field__label">Category</span>
              <select
                className="chat-field__input"
                value={form.categoryId}
                disabled={busy}
                onChange={(e) => {
                  setField("categoryId", e.target.value);
                  commit("categoryId", e.target.value);
                }}
              >
                <option value="">Select category…</option>
                {categoryOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showCc && (
            <div className="chat-field-row">
              <label className="chat-field">
                <span className="chat-field__label">Payment Status</span>
                <select
                  className="chat-field__input"
                  value={form.paymentStatus}
                  disabled={busy}
                  onChange={(e) => {
                    setField("paymentStatus", e.target.value);
                    commit("paymentStatus", e.target.value);
                  }}
                >
                  <option value="">Select…</option>
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {form.paymentStatus === "Installment" && (
                <label className="chat-field">
                  <span className="chat-field__label">Frequency</span>
                  <select
                    className="chat-field__input"
                    value={form.paymentFrequency}
                    disabled={busy}
                    onChange={(e) => {
                      setField("paymentFrequency", e.target.value);
                      commit("paymentFrequency", e.target.value);
                    }}
                  >
                    <option value="">Select…</option>
                    {PAYMENT_FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {showCc && form.paymentStatus === "Installment" && (
            <label className="chat-field">
              <span className="chat-field__label">Period count</span>
              <input
                className="chat-field__input"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.periodCount}
                disabled={busy}
                onChange={(e) => setField("periodCount", e.target.value)}
                onBlur={() => commitIfChanged("periodCount", "periodCount")}
              />
            </label>
          )}

          {showPasabuy && (
            <div className="chat-field-row">
              <label className="chat-field">
                <span className="chat-field__label">Pasabuyer</span>
                <input
                  className="chat-field__input"
                  type="text"
                  value={form.pasabuyer}
                  disabled={busy}
                  onChange={(e) => setField("pasabuyer", e.target.value)}
                  onBlur={() => commitIfChanged("pasabuyer", "pasabuyer")}
                />
              </label>
              <label className="chat-field">
                <span className="chat-field__label">Pasabuy Status</span>
                <select
                  className="chat-field__input"
                  value={form.pasabuyStatus}
                  disabled={busy}
                  onChange={(e) => {
                    setField("pasabuyStatus", e.target.value);
                    commit("pasabuyStatus", e.target.value);
                  }}
                >
                  <option value="">Select…</option>
                  {PASABUY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {draft.missingRequired.length > 0 && (
            <p className="chat-action-card__missing">
              Missing: {draft.missingRequired.join(", ")}
            </p>
          )}
          {draft.warnings.length > 0 && (
            <p className="chat-action-card__warn">{draft.warnings.join(" · ")}</p>
          )}
        </div>
      ) : (
        <div className="chat-action-card__body">
          <div className="chat-action-card__amount-row">
            <span className="chat-action-card__label">Amount</span>
            <span className="chat-action-card__amount">
              <span className="chat-action-card__currency">PHP</span>
              {typeof dsp?.amount === "number"
                ? dsp.amount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </span>
          </div>
          {draft.missingRequired.length > 0 && (
            <p className="chat-action-card__missing">
              Missing: {draft.missingRequired.join(", ")}
            </p>
          )}
          {draft.warnings.length > 0 && (
            <p className="chat-action-card__warn">{draft.warnings.join(" · ")}</p>
          )}
        </div>
      )}

      <div className="chat-action-card__foot">
        <button
          type="button"
          className="chat-action-card__approve"
          disabled={!ready || busy || needsKey}
          title={needsKey ? "Add an API key to Approve writes" : undefined}
          onClick={() => void onApprove(draft.id)}
        >
          <Check size={15} />
          Approve
        </button>
        <button
          type="button"
          className="chat-action-card__deny"
          disabled={busy}
          onClick={() => void onCancel(draft.id)}
        >
          <X size={15} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function ChatModePage() {
  const { settings, chatEnabled } = useUiSettings();
  const [threads, setThreads] = useState<ChatThreadDto[]>([]);
  const [credentials, setCredentials] = useState<ChatCredentialDto[]>([]);
  const [providers, setProviders] = useState<ChatProviderCatalogDto[]>([]);
  const [models, setModels] = useState<Array<{ id: string; label: string; free?: boolean }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [credentialId, setCredentialId] = useState<string>("");
  const [modelId, setModelId] = useState<string>(settings.chatDefaultModel || "gemini-2.5-flash");
  const [customModel, setCustomModel] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [appleReadOnlyReady, setAppleReadOnlyReady] = useState(false);
  const [applePreferOn, setApplePreferOn] = useState(false);
  const [appleDetail, setAppleDetail] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<ChatDraftDto[]>([]);
  const [draftBusyId, setDraftBusyId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategoryOption[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryOption[]>([]);
  const [overlays, setOverlays] = useState(FALLBACK_OVERLAYS);
  const [activeOverlay, setActiveOverlay] = useState<ChatOverlayId>("default");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  /** Ignore stale chat:models responses when Key changes quickly. */
  const modelsFetchGen = useRef(0);
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;

  /** Ask/summarize allowed without BYOK when Prefer Apple is on (Mac on-device path). */
  const canChatWithoutKey = appleReadOnlyReady;
  const composerUnlocked = credentials.length > 0 || canChatWithoutKey;

  const goBackToMain = useCallback(() => {
    const last = settings.workspace.lastSection;
    const target = last && last !== "chat" ? last : "dashboard";
    navigate(`/${target}`);
  }, [settings.workspace.lastSection]);

  const refreshThreads = useCallback(async () => {
    const api = window.api?.chat;
    if (!api) return;
    const res = await api.listThreads();
    if (res.ok) setThreads(res.data);
  }, []);

  const activeCredential = credentials.find((c) => c.id === credentialId) ?? null;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const applyModelsForCredential = useCallback(
    (credId: string, opts?: { preferModelId?: string | null; persistThreadId?: string | null }) => {
      const cred = credentials.find((c) => c.id === credId) ?? null;
      const catalog = providers.find((p) => p.id === (cred?.providerId ?? ""));
      const prefer = opts?.preferModelId ?? modelIdRef.current;

      if (catalog?.models?.length) {
        const list = catalog.models.map((m) => ({
          id: m.id,
          label: m.label,
          free: m.free,
        }));
        setModels(list);
        const optimistic = pickModelForList(prefer || "", list, catalog.defaultModelId);
        setModelId(optimistic);
        setCustomModel(false);
      }

      const gen = ++modelsFetchGen.current;
      const persistThreadId = opts?.persistThreadId ?? null;
      void (async () => {
        const api = window.api?.chat;
        if (!api) return;
        const modelsRes = await api.models(credId || null);
        if (gen !== modelsFetchGen.current || !modelsRes.ok) return;

        // Prefer the key's own catalogue (GET {base}/models) so the list always
        // matches the provider this key actually talks to. Curated list is the
        // fallback for hosts that don't expose it or reject the key.
        let list = modelsRes.data;
        if (credId && api.remoteModels) {
          const remote = await api.remoteModels(credId);
          if (gen !== modelsFetchGen.current) return;
          if (remote.ok && remote.data.length > 0) list = remote.data;
        }

        setModels(list);
        const picked = pickModelForList(
          modelIdRef.current,
          list,
          catalog?.defaultModelId,
        );
        setModelId(picked);
        setCustomModel(false);
        if (persistThreadId) {
          void api
            .updateThread(persistThreadId, {
              credentialId: credId || null,
              modelId: picked || null,
            })
            .then((r) => {
              if (r.ok) void refreshThreads();
            });
        }
      })();
    },
    [credentials, providers, refreshThreads],
  );

  const refreshCredentials = useCallback(async () => {
    const api = window.api?.chat;
    if (!api) return;
    const res = await api.listCredentials();
    if (res.ok) {
      setCredentials(res.data);
      setNeedsKey(res.data.length === 0);
      setCredentialId((prev) => {
        if (prev && res.data.some((c) => c.id === prev)) return prev;
        const def = res.data.find((c) => c.isDefault) ?? res.data[0];
        return def?.id ?? "";
      });
    }
  }, []);

  const refreshDrafts = useCallback(async (threadId: string | null) => {
    if (!threadId || !window.api?.chat?.listDrafts) {
      setPendingDrafts([]);
      return;
    }
    const res = await window.api.chat.listDrafts(threadId);
    if (res.ok) setPendingDrafts(res.data);
  }, []);

  const onSelectCredential = useCallback((nextCredId: string) => {
    setCredentialId(nextCredId);
  }, []);

  const onSelectModel = useCallback(
    (nextModelId: string) => {
      setCustomModel(false);
      setModelId(nextModelId);
      if (!activeId) return;
      void window.api.chat
        .updateThread(activeId, {
          credentialId: credentialId || null,
          modelId: nextModelId || null,
        })
        .then((r) => {
          if (r.ok) void refreshThreads();
        });
    },
    [activeId, credentialId, refreshThreads],
  );

  useEffect(() => {
    if (!chatEnabled) {
      goBackToMain();
      return;
    }
    void (async () => {
      const api = window.api?.chat;
      if (!api) return;
      if (api.providers) {
        const providersRes = await api.providers();
        if (providersRes.ok && providersRes.data.length > 0) setProviders(providersRes.data);
      }
      if (api.overlays) {
        const overlaysRes = await api.overlays();
        if (overlaysRes.ok && overlaysRes.data.length > 0) setOverlays(overlaysRes.data);
      }
      const statusRes = await api.status();
      if (statusRes.ok) {
        setAppleReadOnlyReady(statusRes.data.canUseAppleReadOnly === true);
        setApplePreferOn(statusRes.data.preferAppleReadOnly === true);
        setAppleDetail(statusRes.data.appleDetail || "");
      } else {
        setAppleReadOnlyReady(false);
        setApplePreferOn(false);
        setAppleDetail("");
      }
      await refreshCredentials();
      await refreshThreads();
      // Reference data for the editable confirm card dropdowns.
      const [accRes, incRes, expRes] = await Promise.all([
        window.api?.accounts?.list({ includeInactive: false }),
        window.api?.categories?.income(),
        window.api?.categories?.expense(),
      ]);
      if (accRes?.ok) setAccounts(accRes.data);
      if (incRes?.ok) setIncomeCategories(incRes.data);
      if (expRes?.ok) setExpenseCategories(expRes.data);
    })();
  }, [chatEnabled, goBackToMain, refreshCredentials, refreshThreads, settings.chatPreferAppleReadOnly]);

  // Race-safe model list refresh when Key changes (including default credential load).
  // Persist onto the active thread so re-opening the chat does not snap back to Gemini.
  useEffect(() => {
    if (!credentialId) {
      const gen = ++modelsFetchGen.current;
      void window.api?.chat?.models(null).then((r) => {
        if (gen !== modelsFetchGen.current || !r.ok) return;
        setModels(r.data);
      });
      return;
    }
    applyModelsForCredential(credentialId, {
      persistThreadId: activeIdRef.current,
    });
    // Intentionally omit applyModelsForCredential identity — only re-run on Key id.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- credential switch only
  }, [credentialId]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setPendingDrafts([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await window.api.chat.listMessages(activeId);
      if (cancelled || !res.ok) return;
      setMessages(res.data);
      await refreshDrafts(activeId);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, refreshDrafts]);

  // Apply thread key/model only when switching chats — not when the model list
  // refreshes (that was snapping Key back to the thread's old Gemini credential).
  useEffect(() => {
    if (!activeId) return;
    const thread = threads.find((t) => t.id === activeId);
    if (!thread) return;
    if (thread.credentialId) setCredentialId(thread.credentialId);
    if (thread.modelId) {
      setModelId(thread.modelId);
      setCustomModel(false);
    }
    const overlayId = (thread.overlay ?? "default") as ChatOverlayId;
    setActiveOverlay(
      FALLBACK_OVERLAYS.some((o) => o.id === overlayId) ? overlayId : "default",
    );
    // intentionally only activeId — not threads/models
    // eslint-disable-next-line react-hooks/exhaustive-deps -- thread switch only
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, pendingDrafts]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChatThreadDto[]>();
    for (const t of threads) {
      const label = groupLabel(t.updatedAt);
      const list = map.get(label) ?? [];
      list.push(t);
      map.set(label, list);
    }
    return ["Today", "Yesterday", "Previous"]
      .map((label) => ({ label, items: map.get(label) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [threads]);

  async function onNewChat() {
    setError(null);
    const res = await window.api.chat.createThread({
      credentialId: credentialId || null,
      modelId: modelId || null,
      overlay: activeOverlay,
    });
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    await refreshThreads();
    setActiveId(res.data.id);
    setMessages([]);
  }

  async function onSelectOverlay(id: ChatOverlayId) {
    setActiveOverlay(id);
    if (!activeId) return;
    const res = await window.api.chat.updateThread(activeId, { overlay: id });
    if (res.ok) await refreshThreads();
  }

  async function onRename(thread: ChatThreadDto) {
    const next = window.prompt("Rename chat", thread.title);
    if (next == null) return;
    const title = next.trim();
    if (!title) return;
    const res = await window.api.chat.updateThread(thread.id, { title });
    if (res.ok) await refreshThreads();
  }

  async function onDeleteThread(thread: ChatThreadDto) {
    if (!window.confirm(`Delete “${thread.title}”? This only removes the chat thread.`)) return;
    const res = await window.api.chat.deleteThread(thread.id);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    if (activeId === thread.id) {
      setActiveId(null);
      setMessages([]);
    }
    await refreshThreads();
  }

  async function onSend() {
    const content = draft.trim();
    if (!content || busy) return;
    if (!credentialId && !canChatWithoutKey) {
      setError("Select an API key (Name) first, or configure one in Settings.");
      return;
    }
    setBusy(true);
    setError(null);
    setDraft("");
    try {
      const res = await window.api.chat.send({
        threadId: activeId,
        content,
        credentialId: credentialId || null,
        modelId: credentialId ? modelId : null,
        overlay: activeOverlay,
      });
      if (!res.ok) {
        setError(res.error.message);
        setDraft(content);
        return;
      }
      setActiveId(res.data.thread.id);
      const nextOverlay = (res.data.thread.overlay ?? activeOverlay) as ChatOverlayId;
      if (FALLBACK_OVERLAYS.some((o) => o.id === nextOverlay)) {
        setActiveOverlay(nextOverlay);
      }
      setMessages((prev) => {
        const withoutDup = prev.filter(
          (m) => m.id !== res.data.userMessage.id && m.id !== res.data.assistantMessage.id,
        );
        return [...withoutDup, res.data.userMessage, res.data.assistantMessage];
      });
      if (res.data.drafts?.length) {
        setPendingDrafts(res.data.drafts);
      } else {
        await refreshDrafts(res.data.thread.id);
      }
      await refreshThreads();
    } finally {
      setBusy(false);
    }
  }

  async function onApproveDraft(draftId: string) {
    setDraftBusyId(draftId);
    setError(null);
    try {
      const res = await window.api.chat.confirmDraft(draftId);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setPendingDrafts((prev) => prev.filter((d) => d.id !== draftId));
      const persisted = res.data.assistantMessage;
      if (persisted) {
        setMessages((prev) =>
          prev.some((m) => m.id === persisted.id) ? prev : [...prev, persisted],
        );
      } else {
        const quip = res.data.quip?.trim();
        const base = `Approved — saved ${res.data.draft.resource} (${res.data.draft.action}).`;
        setMessages((prev) => [
          ...prev,
          {
            id: `local-ok-${draftId}`,
            threadId: activeId ?? "",
            role: "assistant",
            content: quip ? `${base}\n\n${quip}` : base,
            payloadJson: null,
            createdAt: Date.now(),
          },
        ]);
      }
      await refreshThreads();
    } finally {
      setDraftBusyId(null);
    }
  }

  async function onCancelDraft(draftId: string) {
    setDraftBusyId(draftId);
    setError(null);
    try {
      const res = await window.api.chat.cancelDraft(draftId);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setPendingDrafts((prev) => prev.filter((d) => d.id !== draftId));
      const persisted = res.data.assistantMessage;
      if (persisted) {
        setMessages((prev) =>
          prev.some((m) => m.id === persisted.id) ? prev : [...prev, persisted],
        );
        await refreshThreads();
      } else {
        const quip = res.data.quip?.trim();
        if (quip) {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-cancel-${draftId}`,
              threadId: activeId ?? "",
              role: "assistant",
              content: quip,
              payloadJson: null,
              createdAt: Date.now(),
            },
          ]);
        }
      }
    } finally {
      setDraftBusyId(null);
    }
  }

  const onEditDraft = useCallback(
    async (draftId: string, edits: Record<string, unknown>) => {
      if (!window.api?.chat?.updateDraft) return;
      setError(null);
      const res = await window.api.chat.updateDraft(draftId, edits);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setPendingDrafts((prev) =>
        prev.map((d) => (d.id === draftId ? res.data : d)),
      );
    },
    [],
  );

  const showCustom = customModel || !models.some((m) => m.id === modelId);
  const activeOverlayMeta = overlays.find((o) => o.id === activeOverlay) ?? overlays[0];

  return (
    <div className="chat-mode">
      <aside className="chat-mode__nav" aria-label="Chat history">
        <button type="button" className="chat-mode__back" onClick={goBackToMain}>
          <ArrowLeft size={16} />
          Go Back to Main
        </button>
        <button
          type="button"
          className="button button--primary chat-mode__new"
          onClick={() => void onNewChat()}
        >
          <MessageSquarePlus size={16} />
          New chat
        </button>
        <div className="chat-mode__history">
          {grouped.length === 0 && (
            <p className="chat-mode__empty-hint">No conversations yet.</p>
          )}
          {grouped.map((group) => (
            <div key={group.label} className="chat-mode__group">
              <p className="chat-mode__group-title">{group.label}</p>
              {group.items.map((thread) => (
                <div
                  key={thread.id}
                  className={cx(
                    "chat-mode__thread",
                    activeId === thread.id && "chat-mode__thread--active",
                  )}
                >
                  <button
                    type="button"
                    className="chat-mode__thread-main"
                    onClick={() => setActiveId(thread.id)}
                  >
                    {thread.title}
                  </button>
                  <div className="chat-mode__thread-actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Rename"
                      onClick={() => void onRename(thread)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Delete chat"
                      onClick={() => void onDeleteThread(thread)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-mode__pane">
        <header className="chat-mode__toolbar">
          <div className="chat-mode__identity">
            <div className="chat-mode__identity-badge" aria-hidden="true">
              <Sparkles size={15} />
            </div>
            <div className="chat-mode__identity-text">
              <p className="chat-mode__identity-title">Finance Copilot</p>
              <p className="chat-mode__identity-status">
                <span
                  className={cx(
                    "chat-mode__status-dot",
                    !composerUnlocked && "chat-mode__status-dot--off",
                  )}
                />
                {composerUnlocked
                  ? `Active · ${activeCredential?.name ?? "on-device"}`
                  : "Needs an API key"}
              </p>
            </div>
          </div>
          <div className="chat-mode__toolbar-right">
            {pendingDrafts.length > 0 && (
              <span className="chat-mode__pending-pill">
                <span className="chat-mode__pending-dot" />
                {pendingDrafts.length} pending{" "}
                {pendingDrafts.length === 1 ? "action" : "actions"}
              </span>
            )}
            <button
              type="button"
              className="button"
              onClick={() => setShowConfig(true)}
              title="Configure AI"
            >
              <Settings2 size={16} />
              Configure
            </button>
          </div>
        </header>

        {(needsKey || error || (applePreferOn && !appleReadOnlyReady && credentials.length === 0)) && (
          <div className={cx("chat-mode__banner", error && "chat-mode__banner--error")}>
            {error ??
              (canChatWithoutKey
                ? "Apple Intelligence ready (Prefer Apple). Add a named API key only when you want to log or edit records."
                : applePreferOn && credentials.length === 0
                  ? `Prefer Apple is on, but Apple Intelligence isn’t ready yet. ${appleDetail || "Enable it in System Settings → Apple Intelligence, wait for the model, restart the app."} Or add a named API key.`
                  : "Add an API key before chatting.")}
            {(needsKey || (applePreferOn && !appleReadOnlyReady && credentials.length === 0)) && (
              <button type="button" className="button" onClick={() => setShowConfig(true)}>
                Configure AI
              </button>
            )}
          </div>
        )}

        <div className="chat-mode__messages" role="log" aria-live="polite">
          {messages.length === 0 && !busy && (
            <div className="chat-mode__starter">
              <div className="chat-mode__starter-badge">
                <Sparkles size={26} />
              </div>
              <h2>Finance Copilot</h2>
              <p>
                Ask about local finances, or log income/expenses and workflows. Creates and edits
                appear as confirm cards — Approve writes to SQLite; Cancel does nothing. Use slash
                modes ({"/roast"}, {"/cheer"}, …) for tone only — Chat never deletes finance
                records.
                {canChatWithoutKey
                  ? " Prefer Apple is on and Apple Intelligence is ready: ask/summarize works without an API key; logging still needs a key."
                  : ""}
              </p>
              <div className="chat-mode__starters">
                {[
                  ...(canChatWithoutKey
                    ? [
                        "Monitoring summary for this month",
                        "How does Transfer work?",
                        "What's left in Food this month?",
                      ]
                    : []),
                  "Add income, SVI salary, 20000, today, GCash",
                  "Log expense, 300 pesos, dating, yesterday",
                  "Transfer 1000 from GCash to Maya today",
                  ...(!canChatWithoutKey
                    ? [
                        "Monitoring summary for this month",
                        "How does Transfer work?",
                      ]
                    : []),
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="button"
                    onClick={() => setDraft(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={cx("chat-msg", isUser ? "chat-msg--user" : "chat-msg--assistant")}
              >
                <div className="chat-msg__avatar" aria-hidden="true">
                  {isUser ? <User size={16} /> : <Sparkles size={16} />}
                </div>
                <div className="chat-msg__main">
                  <span className="chat-msg__role">{isUser ? "You" : "Copilot"}</span>
                  <div className="chat-msg__bubble">{m.content}</div>
                  <span className="chat-msg__time">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
          {pendingDrafts.map((d) => (
            <DraftCard
              key={d.id}
              draft={d}
              accounts={accounts}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              busy={draftBusyId === d.id}
              needsKey={needsKey}
              onEdit={onEditDraft}
              onApprove={onApproveDraft}
              onCancel={onCancelDraft}
            />
          ))}
          {busy && (
            <div className="chat-msg chat-msg--assistant" aria-live="polite">
              <div className="chat-msg__avatar" aria-hidden="true">
                <Sparkles size={16} />
              </div>
              <div className="chat-msg__main">
                <span className="chat-msg__role">Copilot</span>
                <div className="chat-msg__bubble chat-typing" aria-label="Thinking">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="chat-mode__composer">
          <div className="chat-mode__overlays" role="group" aria-label="Slash overlay">
            <span className="chat-mode__overlay-active" title={activeOverlayMeta?.hint}>
              Mode: {activeOverlayMeta?.slash ?? "/default"}
            </span>
            {overlays.map((o) => (
              <button
                key={o.id}
                type="button"
                className={cx(
                  "chat-mode__overlay-chip",
                  activeOverlay === o.id && "chat-mode__overlay-chip--active",
                )}
                title={o.hint}
                disabled={busy}
                onClick={() => void onSelectOverlay(o.id)}
              >
                {o.slash}
              </button>
            ))}
          </div>
          <div className="chat-mode__inputbar">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder={
                canChatWithoutKey && credentials.length === 0
                  ? "Ask a question (on-device)… Logging needs an API key."
                  : "Message Finance Copilot…  ⏎ to send, ⇧⏎ for newline"
              }
              disabled={busy || !composerUnlocked}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button
              type="button"
              className="chat-mode__send"
              aria-label="Send message"
              disabled={busy || !draft.trim() || !composerUnlocked}
              onClick={() => void onSend()}
            >
              <Send size={17} />
            </button>
          </div>

          {/* Model configuration lives with the composer, not the top bar. */}
          <div className="chat-mode__composer-meta">
            <span className="chat-mode__composer-hint">
              ⏎ to send · ⇧⏎ for newline
            </span>
            <div className="chat-mode__model-config">
              <select
                className="chat-mode__mini-select"
                aria-label="API key"
                value={credentialId}
                onChange={(e) => onSelectCredential(e.target.value)}
                disabled={credentials.length === 0}
              >
                {credentials.length === 0 && <option value="">No keys saved</option>}
                {credentials.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
              <span className="chat-mode__model-sep" aria-hidden="true">
                ·
              </span>
              <select
                className="chat-mode__mini-select"
                aria-label="Model"
                value={showCustom ? "__custom__" : modelId}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setCustomModel(true);
                    return;
                  }
                  onSelectModel(e.target.value);
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.free ? " (free)" : ""}
                  </option>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
              {showCustom && (
                <input
                  className="chat-mode__custom-model"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="model id"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </footer>
      </section>

      {showConfig && (
        <AiChatConfigModal
          onClose={() => {
            setShowConfig(false);
            void refreshCredentials();
            void window.api.chat.status().then((r) => {
              if (r.ok) {
                setAppleReadOnlyReady(r.data.canUseAppleReadOnly === true);
                setApplePreferOn(r.data.preferAppleReadOnly === true);
                setAppleDetail(r.data.appleDetail || "");
              }
            });
          }}
        />
      )}
    </div>
  );
}

export { ChatModePage };
