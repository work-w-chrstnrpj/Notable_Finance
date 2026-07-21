import { useEffect, useState } from 'react'
import type {
  ConflictGroup,
  ConflictResolution,
  DiscoveredDb,
  MappableResource,
  NotionMapping,
  PullResult,
  SchemaReport,
  SyncNowResult,
  SyncSettings,
  SyncStatus
} from '../../../shared/finance.types'

const fmt = (v: unknown): string => (v === null || v === undefined || v === '' ? '—' : String(v))
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
  const [pullResult, setPullResult] = useState<PullResult | null>(null)
  const [syncResult, setSyncResult] = useState<SyncNowResult | null>(null)
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([])
  const [settings, setSettings] = useState<SyncSettings | null>(null)

  const savedMapping = useApiData(() => window.api.notion.getMapping(), [])

  const reloadConflicts = async (): Promise<void> => {
    const c = await window.api.sync.listConflicts()
    if (c.ok) setConflicts(c.data)
  }

  const refreshStatus = async (): Promise<void> => {
    const s = await window.api.sync.status()
    if (s.ok) setStatus(s.data)
    await reloadConflicts()
  }

  useEffect(() => {
    void refreshStatus()
    void window.api.sync.getSettings().then((r) => r.ok && setSettings(r.data))
    const off = window.api.on('sync:status', (payload) => {
      setStatus(payload as SyncStatus)
      void reloadConflicts()
    })
    return off
  }, [])

  const resolve = (
    table: 'incomes' | 'expenses',
    id: string,
    resolution: ConflictResolution
  ): Promise<void> =>
    run('resolve', async () => {
      const res = await window.api.sync.resolveConflict(table, id, resolution)
      if (res.ok) {
        setConflicts(res.data)
        return { ok: true }
      }
      return { ok: false, error: res.error.message }
    })

  const changeMode = (patch: Partial<SyncSettings>): Promise<void> =>
    run('mode', async () => {
      const res = await window.api.sync.setMode(patch)
      if (res.ok) {
        setSettings(res.data)
        return { ok: true }
      }
      return { ok: false, error: res.error.message }
    })

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

  const initialPull = (): Promise<void> =>
    run('initialPull', async () => {
      const res = await window.api.sync.initialPull()
      if (res.ok) {
        setPullResult(res.data)
        return { ok: true }
      }
      return { ok: false, error: res.error.message }
    })

  const syncNow = (): Promise<void> =>
    run('sync', async () => {
      const res = await window.api.sync.now()
      if (res.ok) {
        setSyncResult(res.data)
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

      {/* initial pull */}
      <div className="panel">
        <h3>4 · Initial pull</h3>
        <div className="push-row">
          <span className="dirty-count">Populate the local store from Notion (accounts, categories, incomes, expenses).</span>
          <button
            type="button"
            disabled={!status?.connected || !status?.mapped || status?.running || busy !== null}
            onClick={() => void initialPull()}
          >
            {busy === 'initialPull' ? 'Pulling…' : 'Pull from Notion'}
          </button>
        </div>
        {pullResult && (
          <p className="hint">
            Pulled: {pullResult.referenceUpserted} reference rows, {pullResult.inserted} new records,{' '}
            {pullResult.updated} updated, {pullResult.autoMerged} auto-merged,{' '}
            {pullResult.conflicts} conflict(s).
            {pullResult.errors.length > 0 && ` Error: ${pullResult.errors[0]}`}
          </p>
        )}
      </div>

      {/* sync now (push + pull) */}
      <div className="panel">
        <h3>5 · Sync (push + pull)</h3>
        <div className="push-row">
          <span className="dirty-count">
            {status ? `${status.dirtyCount} local change(s) to push` : '…'}
            {status && status.conflictCount > 0 && ` · ${status.conflictCount} conflict(s)`}
            {status?.running && ' · syncing…'}
          </span>
          <button
            type="button"
            className="primary"
            disabled={!status?.connected || !status?.mapped || status?.running || busy !== null}
            onClick={() => void syncNow()}
          >
            {busy === 'sync' || status?.running ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        <div className="sync-times">
          {status?.lastPushAt && <span className="hint">Last push: {new Date(status.lastPushAt).toLocaleString()}</span>}
          {status?.lastPullAt && <span className="hint">Last pull: {new Date(status.lastPullAt).toLocaleString()}</span>}
        </div>
        {settings && (
          <div className="mode-row">
            <label className="toggle">
              <input
                type="radio"
                name="syncmode"
                checked={settings.mode === 'manual'}
                onChange={() => void changeMode({ mode: 'manual' })}
              />
              Manual
            </label>
            <label className="toggle">
              <input
                type="radio"
                name="syncmode"
                checked={settings.mode === 'auto'}
                onChange={() => void changeMode({ mode: 'auto' })}
              />
              Auto every
            </label>
            <input
              className="interval-input"
              type="number"
              min={30}
              step={30}
              value={settings.intervalSeconds}
              disabled={settings.mode !== 'auto'}
              onChange={(e) => setSettings({ ...settings, intervalSeconds: Number(e.target.value) })}
              onBlur={() => settings.mode === 'auto' && void changeMode({ intervalSeconds: settings.intervalSeconds })}
            />
            <span className="hint">seconds (min 30)</span>
          </div>
        )}
        {status?.lastError && <ErrorNote error={status.lastError} />}
        {syncResult && (
          <p className="hint">
            Pull: {syncResult.pull.inserted} new, {syncResult.pull.updated} updated,{' '}
            {syncResult.pull.autoMerged} auto-merged, {syncResult.pull.conflicts} conflict(s). ·
            Push: {syncResult.push.created} created, {syncResult.push.updated} updated,{' '}
            {syncResult.push.failed} failed.
          </p>
        )}
        <p className="hint">
          Reconcile (pull) runs first: a three-way merge auto-merges disjoint edits and flags
          same-field conflicts below; push then sends the rest. Your unpushed edits are never
          clobbered.
        </p>
      </div>

      {/* conflicts resolver (Phase 4.2) */}
      {conflicts.length > 0 && (
        <div className="panel conflict-panel">
          <h3>
            Conflicts <span className="status status-cancelled">{conflicts.length} to resolve</span>
          </h3>
          {conflicts.map((g) => (
            <div key={`${g.recordTable}:${g.recordId}`} className="conflict-card">
              <div className="conflict-head">
                <strong>{g.title}</strong>
                <span className="conflict-meta">{g.recordTable}</span>
                <div className="conflict-actions">
                  <button type="button" onClick={() => void resolve(g.recordTable, g.recordId, { all: 'local' })}>
                    Keep all mine
                  </button>
                  <button type="button" onClick={() => void resolve(g.recordTable, g.recordId, { all: 'remote' })}>
                    Keep all Notion
                  </button>
                </div>
              </div>
              <table className="data-table conflict-fields">
                <thead>
                  <tr><th>Field</th><th>Mine (local)</th><th>Notion (remote)</th><th /></tr>
                </thead>
                <tbody>
                  {g.fields.map((f) => (
                    <tr key={f.field}>
                      <td>{f.field}</td>
                      <td>{fmt(f.local)}</td>
                      <td>{fmt(f.remote)}</td>
                      <td className="row-actions">
                        <button type="button" onClick={() => void resolve(g.recordTable, g.recordId, { perField: { [f.field]: 'local' } })}>
                          Mine
                        </button>
                        <button type="button" onClick={() => void resolve(g.recordTable, g.recordId, { perField: { [f.field]: 'remote' } })}>
                          Notion
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
