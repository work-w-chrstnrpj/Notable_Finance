import { useEffect, useState } from 'react'
import type {
  DiscoveredDb,
  MappableResource,
  NotionMapping,
  PushResult,
  SchemaReport,
  SyncStatus
} from '../../../shared/finance.types'
import { runMutation, useApiData } from '../lib/hooks'
import { ErrorNote, Field, PageHeader } from '../components/ui'

// Sync & Notion Connect (Phase 2). Onboarding: token → discover → map → verify → push.
// The token is write-only: it goes into main once and is never displayed back.

const RESOURCES: Array<{ key: MappableResource; label: string }> = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'incomeCategories', label: 'Income Categories' },
  { key: 'expenseCategories', label: 'Expense Categories' },
  { key: 'incomes', label: 'Incomes' },
  { key: 'expenses', label: 'Expenses' }
]

export function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [databases, setDatabases] = useState<DiscoveredDb[] | null>(null)
  const [mapping, setMapping] = useState<NotionMapping>({})
  const [report, setReport] = useState<SchemaReport | null>(null)
  const [pushResult, setPushResult] = useState<PushResult | null>(null)

  const savedMapping = useApiData(() => window.api.notion.getMapping(), [])

  const refreshStatus = async (): Promise<void> => {
    const s = await window.api.sync.status()
    if (s.ok) setStatus(s.data)
  }

  useEffect(() => {
    void refreshStatus()
    const off = window.api.on('sync:status', (payload) => setStatus(payload as SyncStatus))
    return off
  }, [])

  useEffect(() => {
    if (savedMapping.data) setMapping(savedMapping.data)
  }, [savedMapping.data])

  const run = async (label: string, action: () => Promise<{ ok: boolean; error?: string }>): Promise<void> => {
    setBusy(label)
    setError(null)
    const res = await action()
    if (!res.ok) setError(res.error ?? `${label} failed`)
    setBusy(null)
    void refreshStatus()
  }

  const connect = (): Promise<void> =>
    run('connect', async () => {
      const res = await runMutation(() => window.api.notion.connect(token))
      if (res.ok) setToken('')
      return res
    })

  const discover = (): Promise<void> =>
    run('discover', async () => {
      const res = await window.api.notion.discoverDatabases()
      if (res.ok) {
        setDatabases(res.data)
        return { ok: true }
      }
      return { ok: false, error: res.error.message }
    })

  const saveMapping = (): Promise<void> =>
    run('saveMapping', () => runMutation(() => window.api.notion.saveMapping(mapping)))

  const verify = (): Promise<void> =>
    run('verify', async () => {
      const res = await window.api.notion.verifySchema()
      if (res.ok) {
        setReport(res.data)
        return { ok: true }
      }
      return { ok: false, error: res.error.message }
    })

  const pushNow = (): Promise<void> =>
    run('push', async () => {
      const res = await window.api.sync.now()
      if (res.ok) {
        setPushResult(res.data)
        return { ok: true }
      }
      return { ok: false, error: res.error.message }
    })

  return (
    <section>
      <PageHeader
        title="Sync"
        subtitle="Bring-your-own-Notion: connect, map databases, verify schema, push local changes"
      />
      <ErrorNote error={error} />

      {/* connection */}
      <div className="panel">
        <h3>
          1 · Notion connection{' '}
          <span className={`status ${status?.connected ? 'status-paid' : 'status-unpaid'}`}>
            {status?.connected ? 'Connected' : 'Not connected'}
          </span>
        </h3>
        {status?.connected ? (
          <button
            type="button"
            className="danger"
            disabled={busy !== null}
            onClick={() => void run('disconnect', () => runMutation(() => window.api.notion.disconnect()))}
          >
            Disconnect
          </button>
        ) : (
          <div className="connect-row">
            <input
              type="password"
              placeholder="Notion integration token (ntn_…)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button type="button" className="primary" disabled={busy !== null || !token} onClick={() => void connect()}>
              {busy === 'connect' ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        )}
        <p className="hint">
          The token is encrypted with the OS keychain in the main process. It is never shown
          again, never stored in the database, and never available to this window.
        </p>
      </div>

      {/* mapping */}
      <div className="panel">
        <h3>2 · Database mapping {status?.mapped && <span className="status status-paid">Mapped</span>}</h3>
        <button type="button" disabled={!status?.connected || busy !== null} onClick={() => void discover()}>
          {busy === 'discover' ? 'Discovering…' : 'Discover databases'}
        </button>
        {databases && (
          <>
            <div className="form-grid mapping-grid">
              {RESOURCES.map((r) => (
                <Field key={r.key} label={r.label}>
                  <select
                    value={mapping[r.key] ?? ''}
                    onChange={(e) => setMapping({ ...mapping, [r.key]: e.target.value || undefined })}
                  >
                    <option value="">(not mapped)</option>
                    {databases.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.title} · {db.propertyCount} props
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="primary" disabled={busy !== null} onClick={() => void saveMapping()}>
                Save mapping
              </button>
            </div>
          </>
        )}
      </div>

      {/* schema verification */}
      <div className="panel">
        <h3>3 · Schema verification {report && (
          <span className={`status ${report.ok ? 'status-paid' : 'status-cancelled'}`}>
            {report.ok ? 'Pass' : 'Drift found'}
          </span>
        )}</h3>
        <button type="button" disabled={!status?.connected || busy !== null} onClick={() => void verify()}>
          {busy === 'verify' ? 'Verifying…' : 'Verify schema'}
        </button>
        {report && (
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Resource</th><th>Status</th><th>Errors (writable)</th><th>Warnings (computed)</th></tr>
            </thead>
            <tbody>
              {report.resources.map((r) => (
                <tr key={r.resource}>
                  <td>{r.resource}</td>
                  <td>
                    <span className={`status ${r.ok ? 'status-paid' : 'status-cancelled'}`}>
                      {r.databaseId === null ? 'Not mapped' : r.ok ? 'OK' : 'Drift'}
                    </span>
                  </td>
                  <td className="drift-cell">
                    {r.errors.length === 0
                      ? '—'
                      : r.errors.map((i) => `${i.property} (${i.actualType ?? 'missing'} ≠ ${i.expectedType})`).join(', ')}
                  </td>
                  <td className="drift-cell">
                    {r.warnings.length === 0
                      ? '—'
                      : r.warnings.map((i) => `${i.property} (${i.actualType ?? 'missing'})`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* push */}
      <div className="panel">
        <h3>4 · Push local changes</h3>
        <div className="push-row">
          <span className="dirty-count">
            {status ? `${status.dirtyCount} record(s) waiting to sync` : '…'}
            {status?.running && ' · syncing…'}
          </span>
          <button
            type="button"
            className="primary"
            disabled={!status?.connected || !status?.mapped || status?.running || busy !== null}
            onClick={() => void pushNow()}
          >
            {busy === 'push' || status?.running ? 'Pushing…' : 'Sync now'}
          </button>
        </div>
        {status?.lastPushAt && (
          <p className="hint">Last push: {new Date(status.lastPushAt).toLocaleString()}</p>
        )}
        {status?.lastError && <ErrorNote error={status.lastError} />}
        {pushResult && (
          <p className="hint">
            Result: {pushResult.pushed} pushed ({pushResult.created} created, {pushResult.updated}{' '}
            updated), {pushResult.skipped} skipped, {pushResult.failed} failed.
            {pushResult.errors.length > 0 && ` First error: ${pushResult.errors[0]}`}
          </p>
        )}
        <p className="hint">
          Push sends writable fields only. Records referencing accounts/categories that have no
          Notion page id yet are skipped until the initial pull (Phase 3) links them.
        </p>
      </div>
    </section>
  )
}
