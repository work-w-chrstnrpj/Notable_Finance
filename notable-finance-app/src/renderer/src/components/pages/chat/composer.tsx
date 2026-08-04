import { Flame, Moon, PartyPopper, Send, ShieldCheck, Sparkles, WifiOff, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import type { ChatCredentialDto, ChatOverlayId } from "@shared/finance.types";

const OVERLAY_ICONS: Record<ChatOverlayId, LucideIcon> = {
  default: Sparkles,
  roast: Flame,
  cheer: PartyPopper,
  strict: ShieldCheck,
  quiet: Moon,
};

/**
 * Composer footer: tone/overlay chips, the message textarea + send button, and the
 * Key/Model mini-selects. refactor_development_plan.md Phase 6.2 — pure move out of
 * chat.tsx, unchanged.
 */
function Composer({
  draft,
  setDraft,
  busy,
  offlineNoChat,
  offlineOnlyApple,
  canChatWithoutKey,
  credentials,
  composerUnlocked,
  onSend,
  overlays,
  activeOverlay,
  activeOverlayMeta,
  onSelectOverlay,
  online,
  credentialId,
  onSelectCredential,
  showCustom,
  modelId,
  setModelId,
  models,
  onSelectModel,
  setCustomModel,
}: {
  draft: string;
  setDraft: (value: string) => void;
  busy: boolean;
  offlineNoChat: boolean;
  offlineOnlyApple: boolean;
  canChatWithoutKey: boolean;
  credentials: ChatCredentialDto[];
  composerUnlocked: boolean;
  onSend: () => void | Promise<void>;
  overlays: Array<{ id: ChatOverlayId; slash: string; label: string; hint: string }>;
  activeOverlay: ChatOverlayId;
  activeOverlayMeta: { id: ChatOverlayId; slash: string; label: string; hint: string } | undefined;
  onSelectOverlay: (id: ChatOverlayId) => void | Promise<void>;
  online: boolean;
  credentialId: string;
  onSelectCredential: (id: string) => void;
  showCustom: boolean;
  modelId: string;
  setModelId: (value: string) => void;
  models: Array<{ id: string; label: string; free?: boolean }>;
  onSelectModel: (id: string) => void;
  setCustomModel: (value: boolean) => void;
}) {
  return (
    <footer className="chat-mode__composer">
      <div className="chat-mode__overlays" role="group" aria-label="Chat tone">
        <span className="chat-mode__overlay-active" title={activeOverlayMeta?.hint}>
          Mode: {activeOverlayMeta?.label ?? "Default"}
        </span>
        {overlays.map((o) => {
          const Icon = OVERLAY_ICONS[o.id] ?? Sparkles;
          return (
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
              <Icon size={13} aria-hidden="true" />
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="chat-mode__inputbar">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={
            offlineNoChat
              ? "Chat is unavailable offline — enable Apple Intelligence"
              : offlineOnlyApple
                ? "Ask a question (on-device)… Logging needs a network connection and an API key."
                : canChatWithoutKey && credentials.length === 0
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
          {!online && (
            <span className="chat-mode__offline-chip">
              <WifiOff size={11} aria-hidden="true" />
              {canChatWithoutKey ? "Apple Intelligence (on-device)" : "Offline"}
            </span>
          )}
          {online && (
            <>
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
          </>
          )}
        </div>
      </div>
    </footer>
  );
}

export { Composer };
