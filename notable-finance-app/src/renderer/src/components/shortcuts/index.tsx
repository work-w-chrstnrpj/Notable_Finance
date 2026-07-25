import { useEffect } from "react";
import { X } from "lucide-react";
import { navigate } from "@/lib/router";
import {
  IS_MAC,
  useShortcuts,
} from "@/lib/shortcuts/context";
import {
  SHORTCUTS,
  SHORTCUT_GROUPS,
  shortcutKeys,
  type ShortcutDef,
} from "@/lib/shortcuts/registry";
import type { FinanceSectionId } from "@/types/finance";

const DEF_BY_ID = new Map(SHORTCUTS.map((s) => [s.id, s]));

/** Sidebar section id → its navigation shortcut id. */
export const SECTION_SHORTCUT_ID: Partial<Record<FinanceSectionId, string>> = {
  dashboard: "nav.dashboard",
  accounts: "nav.accounts",
  income: "nav.income",
  expense: "nav.expense",
  "monthly-monitoring": "nav.monitoring",
  transfer: "nav.transfer",
  "credit-card-payment": "nav.cc",
  alkansya: "nav.alkansya",
  receivables: "nav.receivables",
  history: "nav.history",
  chat: "nav.chat",
  sync: "nav.sync",
  "dev-logs": "nav.devlogs",
  settings: "nav.settings",
};

/** A key-cap badge that only appears while shortcuts are revealed (Cmd/Ctrl held). */
export function ShortcutHint({ id, className }: { id: string; className?: string }) {
  const def = DEF_BY_ID.get(id);
  if (!def) return null;
  return (
    <kbd className={`shortcut-hint${className ? ` ${className}` : ""}`} aria-hidden="true">
      {shortcutKeys(def, IS_MAC)}
    </kbd>
  );
}

/** Registers the always-on global shortcuts (navigation + sync). Renders nothing. */
export function GlobalShortcuts() {
  const { registerAction } = useShortcuts();
  useEffect(() => {
    const routes: Record<string, string> = {
      "nav.dashboard": "/dashboard",
      "nav.accounts": "/accounts",
      "nav.income": "/income",
      "nav.expense": "/expense",
      "nav.monitoring": "/monthly-monitoring",
      "nav.transfer": "/transfer",
      "nav.cc": "/credit-card-payment",
      "nav.alkansya": "/alkansya",
      "nav.receivables": "/receivables",
      "nav.history": "/history",
      "nav.chat": "/chat",
      "nav.sync": "/sync",
      "nav.devlogs": "/dev-logs",
      "nav.settings": "/settings",
    };
    const offs: Array<() => void> = [];
    for (const [id, href] of Object.entries(routes)) {
      offs.push(registerAction(id, () => navigate(href)));
    }
    const sync = () => window.api?.sync;
    offs.push(registerAction("sync.push", () => void sync()?.push?.()));
    offs.push(registerAction("sync.pull", () => void sync()?.pull?.()));
    offs.push(registerAction("sync.full", () => void sync()?.now?.()));
    return () => offs.forEach((f) => f());
  }, [registerAction]);
  return null;
}

function CheatGroup({ group }: { group: string }) {
  const rows = SHORTCUTS.filter((s: ShortcutDef) => s.group === group);
  if (rows.length === 0) return null;
  return (
    <div className="cheat-sheet__group">
      <h3 className="cheat-sheet__group-title">{group}</h3>
      <ul className="cheat-sheet__list">
        {rows.map((s) => (
          <li key={s.id} className="cheat-sheet__row">
            <div className="cheat-sheet__label">
              <span>{s.label}</span>
              {s.note && <span className="cheat-sheet__note">{s.note}</span>}
            </div>
            <kbd className="cheat-sheet__keys">{shortcutKeys(s, IS_MAC)}</kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The grouped, scrollable cheat sheet — opened from Settings or via ⌘/. */
export function CheatSheet() {
  const { cheatOpen, closeCheat } = useShortcuts();
  useEffect(() => {
    if (!cheatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCheat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cheatOpen, closeCheat]);

  if (!cheatOpen) return null;
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeCheat();
      }}
    >
      <section
        className="modal-panel cheat-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cheat-sheet-title"
      >
        <div className="modal-panel__header">
          <div>
            <h2 id="cheat-sheet-title">Keyboard shortcuts</h2>
            <p>
              Hold {IS_MAC ? "⌘" : "Ctrl"} to reveal shortcut hints on buttons and tabs.
            </p>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={closeCheat}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body cheat-sheet__body">
          {SHORTCUT_GROUPS.map((group) => (
            <CheatGroup key={group} group={group} />
          ))}
        </div>
      </section>
    </div>
  );
}
