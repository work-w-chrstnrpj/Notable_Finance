
import { Search, SlidersHorizontal } from "lucide-react";
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
