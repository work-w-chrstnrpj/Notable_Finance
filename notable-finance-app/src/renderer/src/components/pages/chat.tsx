import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  MessageSquarePlus,
  Pencil,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { navigate } from "@/lib/router";
import { useUiSettings } from "@/lib/ui-settings-context";
import { cx } from "@/lib/finance-helpers";
import { AiChatConfigModal } from "@/components/pages/settings-modals";
import type {
  ChatCredentialDto,
  ChatDraftDto,
  ChatMessageDto,
  ChatOverlayId,
  ChatThreadDto,
} from "@shared/finance.types";

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

function ChatModePage() {
  const { settings, chatEnabled } = useUiSettings();
  const [threads, setThreads] = useState<ChatThreadDto[]>([]);
  const [credentials, setCredentials] = useState<ChatCredentialDto[]>([]);
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
  const [overlays, setOverlays] = useState(FALLBACK_OVERLAYS);
  const [activeOverlay, setActiveOverlay] = useState<ChatOverlayId>("default");
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  const refreshModelsForCredential = useCallback(async (credId: string) => {
    const api = window.api?.chat;
    if (!api) return;
    const modelsRes = await api.models(credId || null);
    if (!modelsRes.ok) return;
    setModels(modelsRes.data);
    setModelId((prev) => {
      if (modelsRes.data.some((m) => m.id === prev)) return prev;
      const free = modelsRes.data.find((m) => m.free);
      return free?.id ?? modelsRes.data[0]?.id ?? prev;
    });
    setCustomModel(false);
  }, []);

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

  useEffect(() => {
    if (!chatEnabled) {
      goBackToMain();
      return;
    }
    void (async () => {
      const api = window.api?.chat;
      if (!api) return;
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
    })();
  }, [chatEnabled, goBackToMain, refreshCredentials, refreshThreads, settings.chatPreferAppleReadOnly]);

  useEffect(() => {
    if (!credentialId) {
      void window.api?.chat?.models(null).then((r) => {
        if (r.ok) setModels(r.data);
      });
      return;
    }
    void refreshModelsForCredential(credentialId);
  }, [credentialId, refreshModelsForCredential]);

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
      const thread = threads.find((t) => t.id === activeId);
      if (thread?.credentialId) setCredentialId(thread.credentialId);
      if (thread?.modelId) {
        const known = models.some((m) => m.id === thread.modelId);
        setCustomModel(!known);
        setModelId(thread.modelId);
      }
      const overlayId = (thread?.overlay ?? "default") as ChatOverlayId;
      setActiveOverlay(
        FALLBACK_OVERLAYS.some((o) => o.id === overlayId) ? overlayId : "default",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, threads, models, refreshDrafts]);

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
          <label className="chat-mode__picker">
            <span>Key</span>
            <select
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              disabled={credentials.length === 0}
            >
              {credentials.length === 0 && <option value="">No keys saved</option>}
              {credentials.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.providerId ? ` · ${c.providerId}` : ""}
                  {c.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="chat-mode__picker">
            <span>Model</span>
            <select
              value={showCustom ? "__custom__" : modelId}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setCustomModel(true);
                  return;
                }
                setCustomModel(false);
                setModelId(e.target.value);
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
          </label>
          {showCustom && (
            <input
              className="chat-mode__custom-model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="model id"
              spellCheck={false}
            />
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
                </div>
              </div>
            );
          })}
          {pendingDrafts.map((d) => (
            <div key={d.id} className="chat-draft-card" data-status={d.status}>
              <div className="chat-draft-card__header">
                <FileText size={14} />
                <strong>
                  {d.action === "create" ? "New" : "Update"}{" "}
                  {d.resource === "incomes" ? "income" : "expense"}
                </strong>
                <span className="chat-draft-card__badge">
                  {d.status === "ready" ? "Ready to approve" : "Needs info"}
                </span>
              </div>
              <p className="chat-draft-card__summary">{d.summary}</p>
              {d.missingRequired.length > 0 && (
                <p className="chat-draft-card__missing">
                  Missing: {d.missingRequired.join(", ")}
                </p>
              )}
              {d.warnings.length > 0 && (
                <p className="chat-draft-card__warn">{d.warnings.join(" · ")}</p>
              )}
              {d.computedPreview && (
                <pre className="chat-draft-card__preview">
                  {JSON.stringify(d.computedPreview, null, 2)}
                </pre>
              )}
              <div className="chat-draft-card__actions">
                <button
                  type="button"
                  className="button button--primary"
                  disabled={
                    d.status !== "ready" ||
                    d.missingRequired.length > 0 ||
                    draftBusyId === d.id ||
                    needsKey
                  }
                  title={needsKey ? "Add an API key to Approve writes" : undefined}
                  onClick={() => void onApproveDraft(d.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={draftBusyId === d.id}
                  onClick={() => void onCancelDraft(d.id)}
                >
                  Cancel
                </button>
              </div>
            </div>
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
