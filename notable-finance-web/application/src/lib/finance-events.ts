// Lightweight cross-component signal that open Income/Expense lists should
// refetch after a quick-add elsewhere. Extracted from finance-workspace.tsx
// (P4-2) so page modules can import it once they are split out.

export const DATA_CHANGED_EVENT = "nf:data-changed";

/** Broadcast so open Income/Expense lists refetch after a quick add. */
export function emitDataChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
}
