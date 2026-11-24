
import { CalendarDays, LayoutPanelTop, Search, SlidersHorizontal } from "lucide-react";
import { ShortcutHint } from "@/components/shortcuts";

export function SearchToggle({
  active,
  onToggle,
  shortcutId,
}: {
  active: boolean;
  onToggle: () => void;
  shortcutId?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-button search-toggle${active ? " search-toggle--active" : ""}`}
      onClick={onToggle}
      aria-label={active ? "Close search" : "Search"}
    >
      <Search size={16} />
      {shortcutId && <ShortcutHint id={shortcutId} />}
    </button>
  );
}

export function SearchInput({
  query,
  onQueryChange,
  placeholder,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-bar">
      <Search size={14} className="search-bar__icon" />
      <input
        className="search-bar__input"
        type="text"
        placeholder={placeholder ?? "Search..."}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        autoFocus
      />
      {query && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onQueryChange("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function FilterToggle({
  active,
  onToggle,
  shortcutId,
}: {
  active: boolean;
  onToggle: () => void;
  shortcutId?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-button filter-toggle${active ? " filter-toggle--active" : ""}`}
      onClick={onToggle}
      aria-label={active ? "Close filters" : "Filters"}
    >
      <SlidersHorizontal size={16} />
      {shortcutId && <ShortcutHint id={shortcutId} />}
    </button>
  );
}

/** Header icon that hides or shows a page's period picker. Highlighted while the picker is shown, like the filter icon. */
export function PeriodToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`icon-button filter-toggle${hidden ? "" : " filter-toggle--active"}`}
      onClick={onToggle}
      aria-label={hidden ? "Show period picker" : "Hide period picker"}
      aria-pressed={!hidden}
      title={hidden ? "Show period picker" : "Hide period picker"}
    >
      <CalendarDays size={16} />
    </button>
  );
}

/** Header icon that hides or shows a page's other view switches (Table/Cards, Default/Custom, Table/Chart). */
export function ViewsToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`icon-button filter-toggle${hidden ? "" : " filter-toggle--active"}`}
      onClick={onToggle}
      aria-label={hidden ? "Show view switches" : "Hide view switches"}
      aria-pressed={!hidden}
      title={hidden ? "Show view switches" : "Hide view switches"}
    >
      <LayoutPanelTop size={16} />
    </button>
  );
}
