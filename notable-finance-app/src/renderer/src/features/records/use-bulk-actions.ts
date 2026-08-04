import { useCallback } from "react";

/** The full action set the DataTable's bulk toolbar can emit. */
export type BulkAction =
  | "enable"
  | "disable"
  | "duplicate"
  | "delete"
  | "edit"
  | "print"
  | "cover";

/**
 * Dispatcher for the bulk toolbar. Owns only what all three record pages did identically —
 * the enable/disable branch, the selection guards, and collecting ids for delete confirmation.
 *
 * The action *bodies* stay with each page on purpose: they genuinely differ (Expense and
 * Income build different create payloads; Workflow's duplicate is a simpler non-optimistic
 * implementation; print/cover are Expense-only). Forcing those into one parameterised
 * implementation would be the "DRY at any cost" that plan §0.2 rules out.
 *
 * **Capabilities are gated by omission**: a page that doesn't pass `onEdit` / `onPrint` /
 * `onCover` simply has no such action. That mirrors what the UI already does — Workflow
 * renders `showBulkEdit={false}`, and Expense shows Cover only on the Unpaid CC view — so the
 * per-page drift stays explicit rather than being silently unified (plan §0.1). `cover` in
 * particular must NOT become available on Income/Workflow; that would be a feature change.
 */
export function useBulkActions({
  selectedIds,
  applyDisabled,
  clearSelection,
  onEdit,
  onPrint,
  onCover,
  onDuplicate,
  onDelete,
}: {
  selectedIds: Set<string>;
  applyDisabled: (ids: Iterable<string>, shouldDisable: boolean) => void;
  clearSelection: () => void;
  onEdit?: () => void;
  onPrint?: () => void;
  onCover?: () => void;
  /**
   * Runs the page's own duplicate flow. Takes no arguments: each page resolves its own source
   * list, and they differ (Expense duplicates from `visibleExpenseRecords` but prints from
   * `searchFilteredRecords`), so passing one list here would quietly change behaviour.
   */
  onDuplicate?: () => Promise<void> | void;
  /** Receives the ids to delete; pages open their own confirmation modal. */
  onDelete?: (ids: string[]) => void;
}) {
  return useCallback(
    async (action: BulkAction): Promise<void> => {
      // Local-only view state; deliberately works the same on every page.
      if (action === "enable" || action === "disable") {
        applyDisabled(selectedIds, action === "disable");
        return;
      }
      if (action === "edit") {
        if (selectedIds.size === 0) return;
        onEdit?.();
        return;
      }
      if (action === "print") {
        if (selectedIds.size === 0) return;
        onPrint?.();
        return;
      }
      if (action === "cover") {
        if (selectedIds.size === 0) return;
        onCover?.();
        return;
      }
      if (action === "duplicate") {
        // The empty-selection guard lives in the page's handler, which has the record list.
        await onDuplicate?.();
        return;
      }
      if (action === "delete") {
        // Intentionally taken straight from the selection rather than intersected with the
        // visible rows — a selected record that has since been filtered out still deletes.
        const idsToDelete = Array.from(selectedIds).filter((id): id is string => id != null);
        if (idsToDelete.length === 0) {
          clearSelection();
          return;
        }
        onDelete?.(idsToDelete);
      }
    },
    [selectedIds, applyDisabled, clearSelection, onEdit, onPrint, onCover, onDuplicate, onDelete],
  );
}
