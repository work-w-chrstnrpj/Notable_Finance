import { useCallback, useEffect, useRef, useState } from "react";
import { Settings2, Sparkles } from "lucide-react";
import { navigate } from "@/lib/router";
import { useUiSettings } from "@/lib/ui-settings-context";
import { useAuth } from "@/lib/auth-context";
import { cx } from "@/lib/finance-helpers";
import { AiChatConfigModal } from "@/components/pages/settings-modals";
import { useNetworkStatus } from "@/lib/use-network-status";
import { ChatSidebar } from "./chat-sidebar";
import { MessageStream } from "./message-stream";
import { Composer } from "./composer";
import { useChatCredentials } from "./use-chat-credentials";
import type {
  AccountDto,
  ChatDraftDto,
  ChatMessageDto,
  ChatOverlayId,
  ChatThreadDto,
  ExpenseCategoryOption,
  IncomeCategoryOption,
} from "@shared/finance.types";

/**
 * Display-only greeting for the empty chat state. Never sent as a message —
 * purely a time-of-day + name + rotating prompt line.
 */
const DAILY_ASK_LINES = [
  "Ask me how much you spent this month, or how a category is tracking against its budget.",
  "Tipid tip: try 50/30/20 — 50% needs, 30% wants, 20% savings.",
  "Ask for a Monitoring summary — income vs expense and budget health at a glance.",
  "Wondering how much is left on an installment? Ask me about Unpaid CC.",
  "Ask me for a Pasabuy check — who still owes, and how much.",
  "Compare two months: ask something like “July vs June spending”.",
];

function greetingForHour(hour: number): string {
  if (hour >= 22 || hour < 5) return "Good evening, night owl";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

function ChatModePage() {
  const { settings, chatEnabled } = useUiSettings();
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThreadDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const refreshThreads = useCallback(async () => {
    const api = window.api?.chat;
    if (!api) return;
    const res = await api.listThreads();
    if (res.ok) setThreads(res.data);
  }, []);

  const {
    credentials,
    setProviders,
    models,
    credentialId, setCredentialId,
    modelId, setModelId,
    setCustomModel,
    needsKey,
    activeCredential,
    showCustom,
    refreshCredentials,
    onSelectCredential,
    onSelectModel,
  } = useChatCredentials({
    chatDefaultModel: settings.chatDefaultModel,
    activeIdRef,
    refreshThreads,
  });

  const [threadsReady, setThreadsReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleReadOnlyReady, setAppleReadOnlyReady] = useState(false);
  const [applePreferOn, setApplePreferOn] = useState(false);
  const [appleDetail, setAppleDetail] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<ChatDraftDto[]>([]);
  const [draftBusyId, setDraftBusyId] = useState<string | null>(null);
  /** Ask/summarize allowed without BYOK when Prefer Apple is on (Mac on-device path). */
  const canChatWithoutKey = appleReadOnlyReady;
  const composerUnlocked = credentials.length > 0 || canChatWithoutKey;

    const online = useNetworkStatus();
  // Display-only greeting: time-of-day + first name + a daily rotating prompt.
  // Deterministic per calendar day so it doesn't flicker between renders.
  const now = new Date();
  const daySeed = Math.floor(now.getTime() / 86_400_000);
  const greetingName =
    user?.name && user.name !== "Local User" ? user.name.trim().split(/\s+/)[0] : "";
  const greeting = `${greetingForHour(now.getHours())}${greetingName ? `, ${greetingName}` : ""}!`;
  const dailyAskLine = DAILY_ASK_LINES[daySeed % DAILY_ASK_LINES.length];
  // When offline, API-key models cannot reach their endpoints. Only Apple
  // Intelligence (on-device) can respond. We auto-disable credentials and
  // model selection so the user isn't misled into picking a broken config.
  const offlineOnlyApple = !online && canChatWithoutKey;
  const offlineNoChat = !online && !canChatWithoutKey;
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategoryOption[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryOption[]>([]);
  const [overlays, setOverlays] = useState(FALLBACK_OVERLAYS);
  const [activeOverlay, setActiveOverlay] = useState<ChatOverlayId>("default");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  /** Guards the auto-create in the "always keep one chat" effect from double-firing. */
  const ensuringThreadRef = useRef(false);

  const goBackToMain = useCallback(() => {
    const last = settings.workspace.lastSection;
    const target = last && last !== "chat" ? last : "dashboard";
    navigate(`/${target}`);
  }, [settings.workspace.lastSection]);

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
      // Threads have loaded at least once — the "always keep one chat" effect may run.
      setThreadsReady(true);
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

  // Always keep exactly one usable chat. If the active thread is gone (e.g. the user
  // deleted the last one), select the most recent remaining thread, or create a fresh
  // blank one when none exist — so the sidebar always shows a "New chat" and the
  // composer always has a home to type into.
  useEffect(() => {
    if (!chatEnabled || !threadsReady) return;
    if (activeId && threads.some((t) => t.id === activeId)) return;
    if (threads.length > 0) {
      setActiveId(threads[0].id); // list is ordered by updatedAt DESC
      return;
    }
    if (ensuringThreadRef.current) return;
    ensuringThreadRef.current = true;
    void onNewChat().finally(() => {
      ensuringThreadRef.current = false;
    });
    // onNewChat is stable in practice; re-run only on these signals.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep-one-chat guard
  }, [chatEnabled, threadsReady, threads, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, pendingDrafts]);

  async function onNewChat() {
    setError(null);
    // Don't pile up blank chats: a thread keeps the title "New chat" until its first
    // user message, so an existing "New chat" is unused — just open it instead.
    const reusable = threads.find((t) => t.title === "New chat");
    if (reusable) {
      setActiveId(reusable.id);
      setMessages([]);
      return;
    }
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

  async function onClearAllChats() {
    if (threads.length === 0) return;
    if (
      !window.confirm(
        "Delete all chats? This permanently removes every conversation and cannot be undone.",
      )
    )
      return;
    const res = await window.api.chat.deleteAllThreads();
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setActiveId(null);
    setMessages([]);
    setPendingDrafts([]);
    await refreshThreads();
    // The "always keep one chat" effect then creates a fresh blank chat to type into.
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
    // Optimistic: show the user message immediately while the API call is in flight.
    const tempId = `temp-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticUser: ChatMessageDto = {
      id: tempId,
      threadId: activeId ?? "",
      role: "user",
      content,
      payloadJson: null,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
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
        // Remove the optimistic message and restore the draft.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setDraft(content);
        return;
      }
      setActiveId(res.data.thread.id);
      const nextOverlay = (res.data.thread.overlay ?? activeOverlay) as ChatOverlayId;
      if (FALLBACK_OVERLAYS.some((o) => o.id === nextOverlay)) {
        setActiveOverlay(nextOverlay);
      }
      // Replace the optimistic user message with the real one and append the assistant reply.
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== tempId);
        const withoutDup = withoutOptimistic.filter(
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

  const activeOverlayMeta = overlays.find((o) => o.id === activeOverlay) ?? overlays[0];

  return (
    <div className="chat-mode">
      <ChatSidebar
        threads={threads}
        activeId={activeId}
        onSelectThread={setActiveId}
        onNewChat={onNewChat}
        onRename={onRename}
        onDeleteThread={onDeleteThread}
        onClearAllChats={onClearAllChats}
        goBackToMain={goBackToMain}
      />

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
                {!online
                  ? "Offline · on-device only"
                  : composerUnlocked
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

        {(needsKey || error || (applePreferOn && !appleReadOnlyReady && credentials.length === 0) || offlineNoChat) && (
          <div className={cx("chat-mode__banner", (error || offlineNoChat) && "chat-mode__banner--error")}>
            {error ??
              (offlineNoChat
                ? `Network is offline and Apple Intelligence isn’t ready. ${appleDetail || "Enable Apple Intelligence in System Settings to chat without internet."}`
                : offlineOnlyApple
                  ? "Network is offline — using Apple Intelligence on-device. API-key models are unavailable until connectivity is restored."
                  : canChatWithoutKey
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

        <MessageStream
          messages={messages}
          busy={busy}
          greeting={greeting}
          dailyAskLine={dailyAskLine}
          canChatWithoutKey={canChatWithoutKey}
          setDraft={setDraft}
          pendingDrafts={pendingDrafts}
          accounts={accounts}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          draftBusyId={draftBusyId}
          needsKey={needsKey}
          onEditDraft={onEditDraft}
          onApproveDraft={onApproveDraft}
          onCancelDraft={onCancelDraft}
          bottomRef={bottomRef}
        />

        <Composer
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          offlineNoChat={offlineNoChat}
          offlineOnlyApple={offlineOnlyApple}
          canChatWithoutKey={canChatWithoutKey}
          credentials={credentials}
          composerUnlocked={composerUnlocked}
          onSend={onSend}
          overlays={overlays}
          activeOverlay={activeOverlay}
          activeOverlayMeta={activeOverlayMeta}
          onSelectOverlay={onSelectOverlay}
          online={online}
          credentialId={credentialId}
          onSelectCredential={onSelectCredential}
          showCustom={showCustom}
          modelId={modelId}
          setModelId={setModelId}
          models={models}
          onSelectModel={(nextModelId) => onSelectModel(nextModelId, activeId)}
          setCustomModel={setCustomModel}
        />
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
