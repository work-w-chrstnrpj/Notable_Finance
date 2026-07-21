import { useEffect, useState } from 'react'
import type { HealthData } from '../../shared/finance.types'

// Phase 0 landing view: proves the window boots (0.1), React renders, the preload bridge
// is reachable, the IPC roundtrip works (0.4), and the local SQLite store is wired (0.2).
// Real pages (Dashboard, Accounts, Income, Expense, Monitoring, …) are ported in Phase 1.4.
function App() {
  const versions = window.api?.versions
  const [count, setCount] = useState(0)
  const [ping, setPing] = useState<string>('…')
  const [health, setHealth] = useState<HealthData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const p = await window.api.ping()
      setPing(p.ok ? p.data : `error: ${p.error.message}`)

      const h = await window.api.health()
      if (h.ok) setHealth(h.data)
      else setError(h.error.message)
    })()
  }, [])

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Notable Finance</p>
        <h1>Desktop app is running</h1>
        <p className="lede">Offline-first Electron shell. Phase 0 — scaffold, local DB &amp; IPC.</p>

        <div className="hmr">
          <button type="button" onClick={() => setCount((c) => c + 1)}>
            HMR state check: {count}
          </button>
          <span className="hint">
            Edit <code>src/renderer/src/App.tsx</code> — the view updates while this count is
            preserved.
          </span>
        </div>

        <dl className="versions">
          <div>
            <dt>Electron</dt>
            <dd>{versions?.electron ?? '—'}</dd>
          </div>
          <div>
            <dt>Chromium</dt>
            <dd>{versions?.chrome ?? '—'}</dd>
          </div>
          <div>
            <dt>Node</dt>
            <dd>{versions?.node ?? '—'}</dd>
          </div>
        </dl>

        <div className="ipc">
          <div className="ipc-row">
            <span className="k">IPC ping</span>
            <span className={`v ${ping === 'pong' ? 'ok' : ''}`}>{ping}</span>
          </div>
          <div className="ipc-row">
            <span className="k">SQLite</span>
            <span className="v">
              {error ? (
                <span className="bad">error: {error}</span>
              ) : health ? (
                `${health.tables.length} tables`
              ) : (
                '…'
              )}
            </span>
          </div>
          {health && (
            <p className="tables">{health.tables.join(' · ')}</p>
          )}
        </div>

        <p className={`bridge ${versions ? 'ok' : 'bad'}`}>
          {versions
            ? 'Preload bridge connected (window.api reachable)'
            : 'Preload bridge NOT reachable'}
        </p>
      </section>
    </main>
  )
}

export default App
