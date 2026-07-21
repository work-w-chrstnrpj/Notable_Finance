import { useState } from 'react'
import { currentMonth, money, useApiData } from '../lib/hooks'
import { EmptyState, ErrorNote, MonthPicker, PageHeader, StatCard } from '../components/ui'

export function MonitoringPage() {
  const [month, setMonth] = useState(currentMonth())
  const report = useApiData(() => window.api.reports.monthlyMonitoring(month), [month])

  const m = report.data
  return (
    <section>
      <PageHeader
        title="Monthly Monitoring"
        subtitle="Read-only monitoring — computed locally per month"
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />
      <ErrorNote error={report.error} />

      {m && (
        <>
          <div className="stat-grid">
            <StatCard label="Monthly income (net)" value={m.monthlyIncome} tone="pos" />
            <StatCard label="Monthly gross income" value={m.monthlyGrossIncome} />
            <StatCard label="Monthly expense" value={m.monthlyExpense} tone="neg" />
            <StatCard label="Gross margin" value={m.grossMargin} />
          </div>

          <h3 className="section-title">50 / 30 / 20 split</h3>
          <div className="stat-grid three">
            <StatCard label="For needs (50%)" value={m.forNeeds} />
            <StatCard label="For wants (30%)" value={m.forWants} />
            <StatCard label="For savings (20%)" value={m.forSavings} />
          </div>

          <h3 className="section-title">Income categories</h3>
          {m.incomeCategories.length === 0 ? (
            <EmptyState message="No income categories in the reference cache." />
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Source</th><th className="num">Total (net)</th></tr>
              </thead>
              <tbody>
                {m.incomeCategories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.source}</td>
                    <td className="num">{money(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="section-title">Expense categories</h3>
          {m.expenseCategories.length === 0 ? (
            <EmptyState message="No expense categories in the reference cache." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Budget</th>
                  <th className="num">Spending</th>
                  <th className="num">Remaining</th>
                  <th className="num">Share of total</th>
                </tr>
              </thead>
              <tbody>
                {m.expenseCategories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="num">{money(c.budget)}</td>
                    <td className="num">{money(c.spending)}</td>
                    <td className={`num strong ${c.remaining < 0 ? 'neg-text' : ''}`}>
                      {money(c.remaining)}
                    </td>
                    <td className="num">{c.totalOverview.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  )
}
