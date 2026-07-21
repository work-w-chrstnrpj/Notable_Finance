import { useState } from 'react'
import { useApiData } from './lib/hooks'
import { DashboardPage } from './pages/Dashboard'
import { AccountsPage } from './pages/Accounts'
import { IncomeRecordsPage } from './pages/IncomeRecords'
import { ExpensePage } from './pages/Expense'
import { MonitoringPage } from './pages/Monitoring'

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
  { id: 'receivables', label: 'Receivables' }
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
  }
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
          <p className="store-status">
            {health.data
              ? `Local store · ${health.data.tables.length} tables`
              : health.error
                ? 'Local store unavailable'
                : 'Connecting…'}
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
