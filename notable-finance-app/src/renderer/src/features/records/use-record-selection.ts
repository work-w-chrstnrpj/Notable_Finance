import { useCallback, useState } from "react";

/**
 * Row selection + local enable/disable state shared by the record pages
 * (Income / Expense / Workflow), which previously each carried a byte-identical copy
 * of this logic — see refactor_development_plan.md F2.
 *
 * `disabledIds` is deliberately local/ephemeral: "disable" here only greys a row out of
 * the current view's totals and receipts, it is never persisted or sent to Notion.
 *
 * Every callback is `useCallback`-stable with no dependencies, so the `DataTable` props
 * built from them keep referential identity across renders (plan §0.6 — extraction must
 * not introduce new renders).
 */
export function useRecordSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());

  const toggleRowSelect = useCallback((recordId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(recordId);
      else next.delete(recordId);
      return next;
    });
  }, []);

  /** Select-all over whatever list the page considers "currently visible". */
  const selectAll = useCallback((ids: Array<string | null | undefined>) => {
    setSelectedIds(new Set(ids.filter((id): id is string => Boolean(id))));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /** Drop both selection and the disabled overlay (pages call this when the view mode changes). */
  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setDisabledIds(new Set());
  }, []);

  /**
   * The "enable"/"disable" bulk action: flip the given ids in `disabledIds`, then clear the
   * selection — matching the existing behaviour on all three pages exactly.
   */
  const applyDisabled = useCallback((ids: Iterable<string>, shouldDisable: boolean) => {
    setDisabledIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (shouldDisable) next.add(id);
        else next.delete(id);
      }
      return next;
    });
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    disabledIds,
    hasSelection: selectedIds.size > 0,
    toggleRowSelect,
    selectAll,
    clearSelection,
    resetSelection,
    applyDisabled,
  };
}
