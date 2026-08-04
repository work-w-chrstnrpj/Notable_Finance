import { useMemo } from "react";
import { ArrowLeft, MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import type { ChatThreadDto } from "@shared/finance.types";

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

/**
 * Chat history sidebar: back button, new-chat button, grouped thread list, clear-all.
 * refactor_development_plan.md Phase 6.2 — pure move out of chat.tsx, unchanged.
 */
function ChatSidebar({
  threads,
  activeId,
  onSelectThread,
  onNewChat,
  onRename,
  onDeleteThread,
  onClearAllChats,
  goBackToMain,
}: {
  threads: ChatThreadDto[];
  activeId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void | Promise<void>;
  onRename: (thread: ChatThreadDto) => void | Promise<void>;
  onDeleteThread: (thread: ChatThreadDto) => void | Promise<void>;
  onClearAllChats: () => void | Promise<void>;
  goBackToMain: () => void;
}) {
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

  return (
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
                  onClick={() => onSelectThread(thread.id)}
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
      {threads.length > 0 && (
        <button
          type="button"
          className="chat-mode__clear-all"
          onClick={() => void onClearAllChats()}
        >
          <Trash2 size={14} />
          Clear all chats
        </button>
      )}
    </aside>
  );
}

export { ChatSidebar };
