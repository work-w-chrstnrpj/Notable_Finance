import type { ApiResult } from '../../shared/finance.types'
import { syncStatus } from '../sync'
import { broadcast } from '../windows'
import { ValidationError } from '../domain/validation'
import { logDevOperation } from '../dev-logs/store'

/**
 * Wraps a handler body in the discriminated ApiResult envelope every IPC channel returns.
 * refactor_development_plan.md Phase 7.1 — pure move out of ipc/index.ts, unchanged.
 */
export async function result<T>(fn: () => T | Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error instanceof ValidationError ? error.code : 'E_IPC_HANDLER',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/** Broadcasts the standard write-side event trio to every window. */
export function changed(resource: 'incomes' | 'expenses' | 'expenseScheduler', ids: string[]): void {
  broadcast('records:changed', { resource, ids })
  broadcast('derived:updated', {})
  broadcast('sync:status', syncStatus())
  logDevOperation('records:changed', `Broadcast ${resource}`, { resource, ids })
}
