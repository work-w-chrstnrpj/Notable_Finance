import { useState } from 'react'
import { currentMonth, money, useApiData } from '../lib/hooks'
import { EmptyState, ErrorNote, MonthPicker, PageHeader, StatCard } from '../components/ui'

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth())
  const summary = useApiData(() => window.api.reports.dashboard(month), [month])
  const accounts = useApiData(() => window.api.accounts.list(), [])

  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Derived in real time from the local store — works fully offline"
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />
      <ErrorNote error={summary.error ?? accounts.error} />

      {summary.data && (
        <div className="stat-grid">
          <StatCard label="Total income" value={summary.data.totalIncome} tone="pos" />
          <StatCard label="Total expense" value={summary.data.totalExpense} tone="neg" />
          <StatCard label="Gross margin" value={summary.data.grossMargin} />
          <StatCard label="Total cash flow" value={summary.data.totalCashFlow} />
          <StatCard label="Active accounts" value={summary.data.activeAccountCount} count />
          <StatCard label="Pending expenses" value={summary.data.pendingExpenseCount} count />
        </div>
      )}

      <h3 className="section-title">Accounts snapshot</h3>
      {accounts.data && accounts.data.length === 0 ? (
        <EmptyState
          message="No accounts in the local reference cache yet."
          hint="Accounts are read-only reference data — seeded locally for now, pulled from Notion in Phase 3."
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Type</th>
              <th className="num">Current balance</th>
              <th className="num">Available limit</th>
            </tr>
          </thead>
          <tbody>
            {accounts.data?.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td className={`num strong ${a.currentBalance < 0 ? 'neg-text' : ''}`}>
                  {money(a.currentBalance)}
                </td>
                <td className="num">{a.availableLimit === null ? '—' : money(a.availableLimit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
