import { useCallback, useState } from "react";
import type { ApiResult } from "@/lib/api-client";

/**
 * The optimistic write cycle shared by Income and Expense (refactor_development_plan.md F2):
 * insert a temporary row immediately, fire the request, then either swap in the server record
 * or roll the temp row back with a notice.
 *
 * ── Sequencing is load-bearing and preserved exactly ──────────────────────────
 * The original inline copies interleaved `pendingIds` and `applyLocal` updates in a specific
 * order per branch, and `optimistic-save.test.tsx` pins the observable result:
 *   • success  → applyLocal(replace) THEN drop pending   (row stops being "pending" only
 *                once the real record is in place)
 *   • failure  → drop pending THEN applyLocal(remove)
 *   • throw    → drop pending THEN applyLocal(remove)
 * Callers close their modal *before* awaiting, so the form never shows a blocking
 * "Saving…" state — that stays the caller's responsibility, not this hook's.
 */
export function useOptimisticRecords<T extends { id: string }>({
  applyLocal,
  invalidate,
  refetch,
  onNotice,
}: {
  /** Write straight into the query cache (from `useIncomes` / `useExpenses`). */
  applyLocal: (updater: (rows: T[]) => T[]) => void;
  /** Invalidate the affected query families after a successful write. */
  invalidate: () => void;
  /** Re-read from main; used only when a whole bulk request fails. */
  refetch: () => Promise<void> | void;
  /** Surface a transient message to the user (the page's Toast). */
  onNotice: (message: string) => void;
}) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const addPending = useCallback((id: string) => {
    setPendingIds((prev) => new Set(prev).add(id));
  }, []);

  const dropPending = useCallback((id: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /** Row class for a pending row — both pages rendered this identical helper inline. */
  const pendingRowClassName = useCallback(
    (recordId: string): string | undefined =>
      recordId && pendingIds.has(recordId) ? "record-pending record-pending-appear" : undefined,
    [pendingIds],
  );

  /**
   * Create-or-update one record. Pass `existingId` when editing (the row is replaced in
   * place); pass `null` to create (the row is prepended).
   */
  const commit = useCallback(
    async ({
      existingId,
      buildOptimistic,
      save,
    }: {
      existingId: string | null;
      /** Build the placeholder row shown while the request is in flight. */
      buildOptimistic: (tempId: string) => T;
      save: () => Promise<ApiResult<T>>;
    }): Promise<void> => {
      const isEdit = existingId != null;
      const tempId = existingId ?? `pending-${Date.now()}`;
      const optimistic = buildOptimistic(tempId);

      addPending(tempId);
      applyLocal((rows) => {
        if (isEdit) {
          const idx = rows.findIndex((r) => r.id === tempId);
          if (idx === -1) return rows;
          const next = rows.slice();
          next[idx] = optimistic;
          return next;
        }
        return [optimistic, ...rows];
      });

      try {
        const res = await save();
        if (!res.success) {
          dropPending(tempId);
          applyLocal((rows) => rows.filter((r) => r.id !== tempId));
          onNotice(`Save failed: ${res.error.message}`);
          return;
        }
        const saved = res.data;
        applyLocal((rows) => {
          const idx = rows.findIndex((r) => r.id === tempId);
          if (idx === -1) return [saved, ...rows];
          const next = rows.slice();
          next[idx] = saved;
          return next;
        });
        dropPending(tempId);
        invalidate();
      } catch (err) {
        dropPending(tempId);
        applyLocal((rows) => rows.filter((r) => r.id !== tempId));
        onNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
      }
    },
    [addPending, applyLocal, dropPending, invalidate, onNotice],
  );

  /**
   * Create many records at once (bulk duplicate). Temp rows are prepended one per source
   * record, then reconciled positionally against `created`.
   */
  const commitMany = useCallback(
    async ({
      buildOptimistic,
      count,
      save,
      failureLabel,
      partialFailureNoun,
    }: {
      /** Placeholder row `i`, given a fresh temp id. */
      buildOptimistic: (tempId: string, index: number) => T;
      count: number;
      save: () => Promise<ApiResult<{ created: T[]; failed: unknown[] }>>;
      /** e.g. "Bulk duplicate failed" */
      failureLabel: string;
      /** e.g. "duplicate" → "2 of 5 items failed to duplicate." */
      partialFailureNoun: string;
    }): Promise<void> => {
      const tempIds: string[] = [];
      for (let i = 0; i < count; i++) {
        const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        tempIds.push(tempId);
        addPending(tempId);
        const optimistic = buildOptimistic(tempId, i);
        applyLocal((rows) => [optimistic, ...rows]);
      }

      const rollbackAll = (): void => {
        // Note the inverted order vs `commit`'s failure path — bulk removed the row first,
        // then dropped the pending marker. Preserved as-is.
        for (const tempId of tempIds) {
          applyLocal((rows) => rows.filter((r) => r.id !== tempId));
          dropPending(tempId);
        }
      };

      try {
        const res = await save();
        if (!res.success) {
          rollbackAll();
          void refetch();
          onNotice(`${failureLabel}: ${res.error.message}`);
          return;
        }
        const { created, failed } = res.data;
        for (let i = 0; i < tempIds.length; i++) {
          const tempId = tempIds[i];
          const match = created[i];
          if (match) {
            applyLocal((rows) => {
              const idx = rows.findIndex((r) => r.id === tempId);
              if (idx === -1) return [match, ...rows];
              const next = rows.slice();
              next[idx] = match;
              return next;
            });
          } else {
            applyLocal((rows) => rows.filter((r) => r.id !== tempId));
          }
          dropPending(tempId);
        }
        if (failed.length > 0) {
          onNotice(`${failed.length} of ${count} items failed to ${partialFailureNoun}.`);
        }
        invalidate();
      } catch (err) {
        rollbackAll();
        onNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
      }
    },
    [addPending, applyLocal, dropPending, invalidate, onNotice, refetch],
  );

  /**
   * Delete many records. Unlike `commit`/`commitMany` there are no temp rows: the target rows
   * are removed from the cache immediately and their real ids are marked pending, then
   * reconciled against the `deleted` / `failed` lists the bulk API returns.
   */
  const commitDelete = useCallback(
    async ({
      ids,
      save,
      failureLabel,
      partialFailureNoun,
    }: {
      ids: string[];
      save: () => Promise<ApiResult<{ deleted: string[]; failed: Array<{ id: string }> }>>;
      /** e.g. "Bulk delete failed" */
      failureLabel: string;
      /** e.g. "delete" → "2 of 5 items failed to delete." */
      partialFailureNoun: string;
    }): Promise<void> => {
      for (const id of ids) addPending(id);
      applyLocal((rows) => rows.filter((r) => !ids.includes(r.id)));

      try {
        const res = await save();
        if (!res.success) {
          for (const id of ids) dropPending(id);
          void refetch();
          onNotice(`${failureLabel}: ${res.error.message}`);
          return;
        }
        const { deleted, failed } = res.data;
        for (const id of deleted) dropPending(id);
        if (failed.length > 0) {
          for (const f of failed) dropPending(f.id);
          void refetch();
          onNotice(`${failed.length} of ${ids.length} items failed to ${partialFailureNoun}.`);
        }
        invalidate();
      } catch (err) {
        for (const id of ids) dropPending(id);
        void refetch();
        onNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
      }
    },
    [addPending, applyLocal, dropPending, invalidate, onNotice, refetch],
  );

  return { pendingIds, pendingRowClassName, commit, commitMany, commitDelete };
}
