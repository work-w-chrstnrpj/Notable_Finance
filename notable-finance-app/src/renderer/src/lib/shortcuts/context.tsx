import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SHORTCUTS, type ShortcutDef, type ShortcutScope } from "./registry";

export const IS_MAC = /mac/i.test(
  (typeof navigator !== "undefined" &&
    ((navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ||
      navigator.platform ||
      navigator.userAgent)) ||
    "",
);

/** A concrete action fired for a shortcut id. `arg` carries the digit for numbered tabs. */
export type ShortcutHandler = (arg?: number) => void;

type Registry = Map<string, ShortcutHandler[]>;

/** Undo/redo entry — an inverse operation to run, plus its redo. Session only. */
export interface UndoEntry {
  label: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

interface ShortcutContextValue {
  revealed: boolean;
  cheatOpen: boolean;
  openCheat: () => void;
  closeCheat: () => void;
  registerAction: (id: string, handler: ShortcutHandler) => () => void;
  pushUndo: (entry: UndoEntry) => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Ctx = createContext<ShortcutContextValue | null>(null);

// ── combo parsing ──────────────────────────────────────────────────────
function tokenFromCode(code: string, key: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1];
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (digit) return digit[1];
  if (code === "Backquote") return "Backquote";
  if (code === "Slash") return "Slash";
  if (code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight") return code;
  if (code === "Enter" || code === "NumpadEnter") return "Enter";
  if (code === "Escape") return "Escape";
  if (code === "Backspace") return "Backspace";
  if (code === "Delete") return "Delete";
  // Fall back to key for anything else (rare).
  if (key === "Escape") return "Escape";
  return null;
}

/** Build the normalized combo string from a keyboard event, or null if unusable. */
function comboFromEvent(e: KeyboardEvent): { combo: string; digit: number | null } | null {
  // "Mod" = Option/Alt on every platform. Alt owns almost nothing at the OS or
  // menu level, so native Cmd/Ctrl editing stays intact and there are no clashes.
  const mod = e.altKey;
  const token = tokenFromCode(e.code, e.key);
  if (!token) return null;
  const parts: string[] = [];
  if (mod) parts.push("Mod");
  if (e.shiftKey) parts.push("Shift");
  parts.push(token);
  const digit = /^\d$/.test(token) ? Number(token) : null;
  return { combo: parts.join("+"), digit };
}

/** Scope priority: higher wins when the same combo maps to several shortcuts. */
const SCOPE_PRIORITY: Record<ShortcutScope, number> = {
  recordModal: 4,
  massSelect: 3,
  view: 2,
  navigation: 1,
  global: 0,
};

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable === true
  );
}

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);
  const registry = useRef<Registry>(new Map());

  // Undo/redo session stacks.
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);
  const [undoVersion, setUndoVersion] = useState(0);

  const registerAction = useCallback((id: string, handler: ShortcutHandler) => {
    const list = registry.current.get(id) ?? [];
    list.push(handler);
    registry.current.set(id, list);
    return () => {
      const cur = registry.current.get(id);
      if (!cur) return;
      const idx = cur.lastIndexOf(handler);
      if (idx >= 0) cur.splice(idx, 1);
      if (cur.length === 0) registry.current.delete(id);
    };
  }, []);

  const hasHandler = useCallback((id: string) => (registry.current.get(id)?.length ?? 0) > 0, []);
  const fire = useCallback((id: string, arg?: number): boolean => {
    const list = registry.current.get(id);
    if (!list || list.length === 0) return false;
    list[list.length - 1]!(arg);
    return true;
  }, []);

  const pushUndo = useCallback((entry: UndoEntry) => {
    undoStack.current.push(entry);
    redoStack.current = [];
    setUndoVersion((v) => v + 1);
  }, []);

  const runUndo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    redoStack.current.push(entry);
    setUndoVersion((v) => v + 1);
    void entry.undo();
  }, []);
  const runRedo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    undoStack.current.push(entry);
    setUndoVersion((v) => v + 1);
    void entry.redo();
  }, []);

  const openCheat = useCallback(() => setCheatOpen(true), []);
  const closeCheat = useCallback(() => setCheatOpen(false), []);

  const clearReveal = useCallback(() => {
    setRevealed(false);
  }, []);

  // Candidate shortcuts for a combo, most-specific scope first.
  const candidates = useMemo(() => {
    const byCombo = new Map<string, ShortcutDef[]>();
    for (const def of SHORTCUTS) {
      const list = byCombo.get(def.combo) ?? [];
      list.push(def);
      byCombo.set(def.combo, list);
    }
    for (const list of byCombo.values()) {
      list.sort((a, b) => SCOPE_PRIORITY[b.scope] - SCOPE_PRIORITY[a.scope]);
    }
    return byCombo;
  }, []);

  const dispatch = useCallback(
    (e: KeyboardEvent): boolean => {
      const parsed = comboFromEvent(e);
      if (!parsed) return false;
      const typing = isTypingTarget(e.target);

      // Digit combos are dynamic: Mod+<n> = navigation, Mod+Shift+<n> = filter tab.
      let matches: ShortcutDef[] = candidates.get(parsed.combo) ?? [];
      if (parsed.digit != null && matches.length === 0) {
        if (parsed.combo === `Mod+Shift+${parsed.digit}`) {
          matches = candidates.get("Mod+Shift+Digit") ?? [];
        }
      }
      if (matches.length === 0) return false;

      const modalOpen = SHORTCUTS.some((s) => s.scope === "recordModal" && hasHandler(s.id));

      for (const def of matches) {
        // Navigation is suppressed while a record modal is open.
        if (def.scope === "navigation" && modalOpen) continue;
        // Respect typing guard unless the shortcut opts in.
        if (typing && !def.whileTyping) continue;
        // Scoped shortcuts only fire when a component has registered them.
        if (def.scope !== "global" && def.scope !== "navigation") {
          if (!hasHandler(def.id)) continue;
        }

        // Global built-ins handled by the provider itself.
        if (def.id === "general.cheatSheet") {
          e.preventDefault();
          setCheatOpen((o) => !o);
          return true;
        }
        if (def.id === "edit.undo") {
          // Alt+Z is app-level undo; native Cmd/Ctrl+Z stays field text-undo.
          e.preventDefault();
          runUndo();
          return true;
        }
        if (def.id === "edit.redo") {
          e.preventDefault();
          runRedo();
          return true;
        }

        if (def.scope === "navigation") {
          const fired = fire(def.id);
          if (fired) {
            e.preventDefault();
            return true;
          }
          continue;
        }

        // Scoped / global registered actions.
        const fired = fire(def.id, parsed.digit ?? undefined);
        if (fired) {
          e.preventDefault();
          return true;
        }
      }
      return false;
    },
    [candidates, fire, hasHandler, runRedo, runUndo],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Option+K (Alt+K) toggles shortcut hints.
      if (e.altKey && e.code === "KeyK" && !e.repeat) {
        setRevealed((r) => !r);
        return;
      }
      // Any other keydown hides the reveal and may trigger a shortcut.
      setRevealed(false);
      dispatch(e);
    };
    const onKeyUp = (_e: KeyboardEvent) => {
      // no-op — reveal persists until next keydown or click/blur.
    };
    const onPointer = () => clearReveal();
    const onBlur = () => clearReveal();

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("mousedown", onPointer, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("mousedown", onPointer, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [dispatch, clearReveal]);

  // Reflect reveal state on <body> so CSS-only hints can show/hide.
  useEffect(() => {
    document.body.classList.toggle("shortcuts-revealed", revealed);
  }, [revealed]);

  const value = useMemo<ShortcutContextValue>(
    () => ({
      revealed,
      cheatOpen,
      openCheat,
      closeCheat,
      registerAction,
      pushUndo,
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    }),
    // undoVersion drives canUndo/canRedo recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revealed, cheatOpen, openCheat, closeCheat, registerAction, pushUndo, undoVersion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShortcuts(): ShortcutContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutProvider");
  return ctx;
}

/**
 * Register a handler for a shortcut id while `active` (default true). Passing a
 * state flag (e.g. modal open, rows selected) keeps the engine's scope tracking
 * accurate — a scope is "active" only while its handlers are registered.
 */
export function useShortcutAction(id: string, handler: ShortcutHandler, active = true): void {
  const { registerAction } = useShortcuts();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    return registerAction(id, (arg) => ref.current(arg));
  }, [id, active, registerAction]);
}
