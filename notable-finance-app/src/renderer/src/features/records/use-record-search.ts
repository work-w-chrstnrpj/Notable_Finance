import { useCallback, useMemo, useState } from "react";
import { fuzzyFilterIndices } from "@/lib/fuzzy-search";

/**
 * Client-side fuzzy search over a record list — the search-toggle state plus the derived
 * filtered list that Income and Expense each carried an identical copy of
 * (refactor_development_plan.md F2). Workflow has no search UI, so this is a 2-call-site
 * extraction, not 3 as the plan originally estimated.
 *
 * `extraDeps` mirrors the explicit dependency array the original inline `useMemo`s used
 * (they closed over `accountNameById` / `categoryNameById`, so results must recompute when
 * those reference maps change). Following the same convention as `useDebouncedPersist`
 * rather than ref-ing the extractor, which would silently go stale.
 */
export function useRecordSearch<T>(
  records: T[],
  /** Fields to match the query against for one record. */
  extractFields: (record: T) => string[],
  /** Values `extractFields` closes over, e.g. `[accountNameById, categoryNameById]`. */
  extraDeps: unknown[] = [],
) {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = useMemo(
    () => {
      if (!searchActive || !searchQuery.trim()) return records;
      return fuzzyFilterIndices(records, searchQuery, extractFields).map((i) => records[i]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit extraDeps
    [records, searchActive, searchQuery, ...extraDeps],
  );

  /**
   * Toggle the search box, clearing the query when it closes.
   *
   * Both entry points (the SearchToggle button and the `view.search` keyboard shortcut) use
   * this. They previously diverged — the shortcut flipped `searchActive` without clearing the
   * query, so closing via keyboard left a stale query that silently re-applied on reopen.
   * That was an unintentional inconsistency and has been deliberately unified (an approved,
   * explicitly-scoped behaviour change, not a silent one).
   */
  const toggleSearch = useCallback(() => {
    setSearchActive((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }, []);

  /** Full reset — used when the view mode changes. */
  const resetSearch = useCallback(() => {
    setSearchActive(false);
    setSearchQuery("");
  }, []);

  return {
    searchActive,
    searchQuery,
    setSearchQuery,
    filteredRecords,
    toggleSearch,
    resetSearch,
  };
}
