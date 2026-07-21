import { useEffect, useState } from 'react'
import type { SyncStatus } from '../../shared/finance.types'
import { useApiData } from './lib/hooks'
import { DashboardPage } from './pages/Dashboard'
import { AccountsPage } from './pages/Accounts'
import { IncomeRecordsPage } from './pages/IncomeRecords'
import { ExpensePage } from './pages/Expense'
import { MonitoringPage } from './pages/Monitoring'
import { SyncPage } from './pages/Sync'

// App shell: the nine sections from the shared product scope
// (Dashboard, Accounts, Income, Expense, Monitoring, Transfer, CC Payment, Alkansya,
// Receivables), a New Window action (Phase 1.5), and a local-store status footer.

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'ccPayment', label: 'CC Payment' },
  { id: 'alkansya', label: 'Alkansya' },
  { id: 'receivables', label: 'Receivables' },
  { id: 'sync', label: 'Sync' }
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function Page({ section }: { section: SectionId }) {
  switch (section) {
    case 'dashboard':
      return <DashboardPage />
    case 'accounts':
      return <AccountsPage />
    case 'income':
      return (
        <IncomeRecordsPage
          view="incomes"
          title="Income"
          subtitle="Normal income — auxiliary workflow categories are excluded"
        />
      )
    case 'expense':
      return <ExpensePage />
    case 'monitoring':
      return <MonitoringPage />
    case 'transfer':
      return (
        <IncomeRecordsPage
          view="transfers"
          title="Transfer"
          subtitle="Incomes in the fixed “Transfer” workflow category"
        />
      )
    case 'ccPayment':
      return (
        <IncomeRecordsPage
          view="creditCardPayments"
          title="CC Payment"
          subtitle="Incomes in the fixed “Credit Card Payment” workflow category"
        />
      )
    case 'alkansya':
      return (
        <IncomeRecordsPage
          view="alkansya"
          title="Alkansya"
          subtitle="Incomes in the fixed “Savings” workflow category"
        />
      )
    case 'receivables':
      return (
        <IncomeRecordsPage
          view="receivables"
          title="Receivables"
          subtitle="Incomes with no receiving account yet"
        />
      )
    case 'sync':
      return <SyncPage />
  }
}

function SyncChip() {
  const [sync, setSync] = useState<SyncStatus | null>(null)
  useEffect(() => {
    void window.api.sync.status().then((r) => r.ok && setSync(r.data))
    const off = window.api.on('sync:status', (p) => setSync(p as SyncStatus))
    return off
  }, [])

  if (!sync) return <p className="store-status">Connecting…</p>
  const lastSync = sync.lastPullAt ?? sync.lastPushAt
  return (
    <div className="sync-chip">
      <div className="sync-line">
        <span className={`dot ${sync.online ? 'on' : 'off'}`} />
        {sync.online ? 'Online' : 'Offline'}
        {sync.running && <span className="spinner" aria-label="syncing" />}
        <span className="mode-tag">{sync.mode}</span>
      </div>
      <div className="sync-badges">
        {sync.dirtyCount > 0 && <span className="badge dirty">{sync.dirtyCount} unsynced</span>}
        {sync.conflictCount > 0 && <span className="badge conflict">{sync.conflictCount} conflict</span>}
        {sync.dirtyCount === 0 && sync.conflictCount === 0 && !sync.connected && (
          <span className="badge muted">not connected</span>
        )}
        {sync.dirtyCount === 0 && sync.conflictCount === 0 && sync.connected && (
          <span className="badge ok">all synced</span>
        )}
      </div>
      <p className="sync-when">
        {lastSync ? `Last synced ${new Date(lastSync).toLocaleTimeString()}` : 'Never synced'}
      </p>
    </div>
  )
}

function App() {
  const [section, setSection] = useState<SectionId>('dashboard')
  const health = useApiData(() => window.api.health(), [])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◆</span> Notable Finance
        </div>
        <nav>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-item" onClick={() => void window.api.windows.new()}>
            ⧉ New Window
          </button>
          <SyncChip />
          <p className="store-status">
            {health.data
              ? `Local store · ${health.data.tables.length} tables`
              : health.error
                ? 'Local store unavailable'
                : ''}
          </p>
        </div>
      </aside>
      <main className="content">
        <Page section={section} />
      </main>
    </div>
  )
}

export default App
