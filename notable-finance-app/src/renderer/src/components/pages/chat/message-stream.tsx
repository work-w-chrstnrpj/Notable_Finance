import type { RefObject } from "react";
import Markdown from "react-markdown";
import { Sparkles, User } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import { DraftCard } from "./draft-card";
import type {
  AccountDto,
  ChatDraftDto,
  ChatMessageDto,
  ExpenseCategoryOption,
  IncomeCategoryOption,
} from "@shared/finance.types";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The scrolling message log: empty-state starter, message bubbles (Markdown-rendered
 * for assistant replies), pending draft cards, and the busy/typing indicator.
 * refactor_development_plan.md Phase 6.2 — pure move out of chat.tsx, unchanged.
 */
function MessageStream({
  messages,
  busy,
  greeting,
  dailyAskLine,
  canChatWithoutKey,
  setDraft,
  pendingDrafts,
  accounts,
  incomeCategories,
  expenseCategories,
  draftBusyId,
  needsKey,
  onEditDraft,
  onApproveDraft,
  onCancelDraft,
  bottomRef,
}: {
  messages: ChatMessageDto[];
  busy: boolean;
  greeting: string;
  dailyAskLine: string;
  canChatWithoutKey: boolean;
  setDraft: (value: string) => void;
  pendingDrafts: ChatDraftDto[];
  accounts: AccountDto[];
  incomeCategories: IncomeCategoryOption[];
  expenseCategories: ExpenseCategoryOption[];
  draftBusyId: string | null;
  needsKey: boolean;
  onEditDraft: (draftId: string, edits: Record<string, unknown>) => void | Promise<void>;
  onApproveDraft: (draftId: string) => void | Promise<void>;
  onCancelDraft: (draftId: string) => void | Promise<void>;
  bottomRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="chat-mode__messages" role="log" aria-live="polite">
      {messages.length === 0 && !busy && (
        <div className="chat-mode__starter">
          <div className="chat-mode__starter-badge">
            <Sparkles size={26} />
          </div>
          <h2>{greeting}</h2>
          <p>
            Finance Copilot. {dailyAskLine} Ask about local finances, or log income/expenses and
            workflows. Creates and edits
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
              <div className="chat-msg__bubble">
                {isUser ? (
                  m.content
                ) : (
                  <Markdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 0.5em" }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: "0.5em 0", paddingLeft: "1.5em" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "0.5em 0", paddingLeft: "1.5em" }}>{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong>{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      code: ({ children, className }) => (
                        <code className={className} style={{
                          background: "rgba(255,255,255,0.08)",
                          padding: "0.15em 0.35em",
                          borderRadius: "4px",
                          fontSize: "0.9em",
                        }}>
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre style={{
                          background: "rgba(255,255,255,0.06)",
                          padding: "0.75em",
                          borderRadius: "6px",
                          overflowX: "auto",
                          margin: "0.5em 0",
                        }}>
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => <h3 style={{ margin: "0.75em 0 0.25em" }}>{children}</h3>,
                      h2: ({ children }) => <h4 style={{ margin: "0.75em 0 0.25em" }}>{children}</h4>,
                    }}
                  >
                    {m.content}
                  </Markdown>
                )}
              </div>
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
  );
}

export { MessageStream };
