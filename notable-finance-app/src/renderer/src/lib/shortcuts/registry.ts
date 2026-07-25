// Single source of truth for every keyboard shortcut. The key handler, the
// reveal overlay, and the Settings cheat-sheet all read from this list so they
// can never drift apart.
//
// Combos use the token "Mod" for the primary modifier — Cmd on macOS, Ctrl on
// Windows/Linux ("when I say cmd it also means ctrl"). Other tokens: Shift,
// Alt, and a key name (single char, digit, "ArrowUp", "Enter", "Escape",
// "Backspace", "Backquote", "Slash", "Delete").

export type ShortcutScope =
  | "global" // always active (unless typing, per whileTyping)
  | "navigation" // section routing — only when nothing is open
  | "view" // section pages with filter tabs / search / filters
  | "recordModal" // a record create/edit modal is open
  | "massSelect"; // one or more rows are selected in a list

export interface ShortcutDef {
  id: string;
  group: string;
  label: string;
  scope: ShortcutScope;
  /** Normalized combo, e.g. "Mod+S", "Mod+Shift+H", "Mod+Shift+ArrowUp". */
  combo: string;
  /** Human display combo when it varies by context (numbered tabs). */
  displayCombo?: string;
  /** Fires even while a text field is focused (Save, Delete, Duplicate…). */
  whileTyping?: boolean;
  /** Extra note shown in the cheat sheet. */
  note?: string;
}

export const SHORTCUT_GROUPS = [
  "Navigation",
  "Section views",
  "Record modal",
  "Selection",
  "Sync",
  "Editing",
  "General",
] as const;

export const SHORTCUTS: ShortcutDef[] = [
  // ── Navigation (only when nothing is open) ────────────────────────────
  { id: "nav.dashboard", group: "Navigation", label: "Dashboard", scope: "navigation", combo: "Mod+1" },
  { id: "nav.accounts", group: "Navigation", label: "Accounts", scope: "navigation", combo: "Mod+2" },
  { id: "nav.income", group: "Navigation", label: "Income", scope: "navigation", combo: "Mod+3" },
  { id: "nav.expense", group: "Navigation", label: "Expense", scope: "navigation", combo: "Mod+4" },
  { id: "nav.monitoring", group: "Navigation", label: "Monitoring", scope: "navigation", combo: "Mod+5" },
  { id: "nav.transfer", group: "Navigation", label: "Transfer", scope: "navigation", combo: "Mod+6" },
  { id: "nav.cc", group: "Navigation", label: "CC Payment", scope: "navigation", combo: "Mod+7" },
  { id: "nav.alkansya", group: "Navigation", label: "Alkansya", scope: "navigation", combo: "Mod+8" },
  { id: "nav.receivables", group: "Navigation", label: "Receivables", scope: "navigation", combo: "Mod+9" },
  { id: "nav.history", group: "Navigation", label: "History", scope: "navigation", combo: "Mod+Shift+H" },
  { id: "nav.chat", group: "Navigation", label: "Chat", scope: "navigation", combo: "Mod+Shift+C" },
  { id: "nav.sync", group: "Navigation", label: "Sync Center", scope: "navigation", combo: "Mod+Shift+O" },
  { id: "nav.devlogs", group: "Navigation", label: "Dev Logs", scope: "navigation", combo: "Mod+Shift+L" },
  { id: "nav.settings", group: "Navigation", label: "Settings", scope: "navigation", combo: "Mod+Shift+S" },

  // ── Section views (filter tabs / view toggles) ────────────────────────
  {
    id: "view.filterTab",
    group: "Section views",
    label: "Jump to filter tab (Daily, Weekly, …)",
    scope: "view",
    combo: "Mod+Shift+Digit",
    displayCombo: "Mod+Shift+1…9",
    note: "On Accounts: 1 = All, 2 = Standard, 3 = Credit.",
  },
  {
    id: "view.toggleAccountLayout",
    group: "Section views",
    label: "Accounts: toggle Card / Table view",
    scope: "view",
    combo: "Mod+Shift+Backquote",
    displayCombo: "Mod+Shift+~",
  },
  {
    id: "view.toggleHideZero",
    group: "Section views",
    label: "Accounts: toggle Hide zero balance",
    scope: "view",
    combo: "Mod+Shift+0",
  },
  { id: "view.search", group: "Section views", label: "Open search", scope: "view", combo: "Mod+F" },
  { id: "view.filters", group: "Section views", label: "Open filters", scope: "view", combo: "Mod+G" },
  { id: "view.newRecord", group: "Section views", label: "New record", scope: "view", combo: "Mod+N" },

  // ── Record modal ──────────────────────────────────────────────────────
  { id: "modal.save", group: "Record modal", label: "Save", scope: "recordModal", combo: "Mod+S", whileTyping: true },
  { id: "modal.saveEnter", group: "Record modal", label: "Save", scope: "recordModal", combo: "Enter", whileTyping: false, note: "Enter also saves when the form is complete." },
  { id: "modal.edit", group: "Record modal", label: "Toggle edit", scope: "recordModal", combo: "Mod+E", whileTyping: true },
  { id: "modal.duplicate", group: "Record modal", label: "Duplicate", scope: "recordModal", combo: "Mod+D", whileTyping: true },
  { id: "modal.delete", group: "Record modal", label: "Delete (soft/hard)", scope: "recordModal", combo: "Mod+Backspace", displayCombo: "Mod+⌫", whileTyping: true },
  { id: "modal.close", group: "Record modal", label: "Close", scope: "recordModal", combo: "Escape", whileTyping: true },

  // ── Selection (mass select) ───────────────────────────────────────────
  { id: "mass.selectAll", group: "Selection", label: "Select all rows", scope: "massSelect", combo: "Mod+A" },
  { id: "mass.duplicate", group: "Selection", label: "Duplicate selected", scope: "massSelect", combo: "Mod+D" },
  { id: "mass.edit", group: "Selection", label: "Mass edit", scope: "massSelect", combo: "Mod+E" },
  { id: "mass.disable", group: "Selection", label: "Disable / enable selected", scope: "massSelect", combo: "Mod+I" },
  { id: "mass.delete", group: "Selection", label: "Delete selected (soft/hard)", scope: "massSelect", combo: "Mod+Backspace", displayCombo: "Mod+⌫" },

  // ── Sync ──────────────────────────────────────────────────────────────
  { id: "sync.push", group: "Sync", label: "Push sync (up to cloud)", scope: "global", combo: "Mod+Shift+ArrowUp" },
  { id: "sync.pull", group: "Sync", label: "Pull sync (down from cloud)", scope: "global", combo: "Mod+Shift+ArrowDown" },
  { id: "sync.full", group: "Sync", label: "Full sync", scope: "global", combo: "Mod+Shift+Enter" },

  // ── Editing (undo/redo — session stack) ───────────────────────────────
  { id: "edit.undo", group: "Editing", label: "Undo last change", scope: "global", combo: "Mod+Z", whileTyping: true, note: "Undoes text while a field is focused; otherwise steps back through your create / edit / delete actions this session." },
  { id: "edit.redo", group: "Editing", label: "Redo", scope: "global", combo: "Mod+Y", whileTyping: true },

  // ── General ───────────────────────────────────────────────────────────
  { id: "general.cheatSheet", group: "General", label: "Show keyboard shortcuts", scope: "global", combo: "Mod+Slash", displayCombo: "Mod+/", whileTyping: true },
];

/** Platform-aware display of a combo, e.g. "Mod+Shift+H" → "⌘⇧H" or "Ctrl+Shift+H". */
export function displayCombo(combo: string, isMac: boolean): string {
  const parts = combo.split("+");
  const map: Record<string, string> = isMac
    ? { Mod: "⌘", Shift: "⇧", Alt: "⌥", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Enter: "↵", Escape: "Esc", Backspace: "⌫", Delete: "⌦", Backquote: "~", Slash: "/", Digit: "1…9" }
    : { Mod: "Ctrl", Shift: "Shift", Alt: "Alt", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Enter: "Enter", Escape: "Esc", Backspace: "Backspace", Delete: "Del", Backquote: "~", Slash: "/", Digit: "1…9" };
  const sep = isMac ? "" : "+";
  return parts.map((p) => map[p] ?? p).join(sep);
}

/** Best display string for a shortcut (uses displayCombo override when present). */
export function shortcutKeys(def: ShortcutDef, isMac: boolean): string {
  if (def.displayCombo) return displayCombo(def.displayCombo, isMac);
  return displayCombo(def.combo, isMac);
}
