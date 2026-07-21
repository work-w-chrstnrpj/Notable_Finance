import { useState } from 'react'
import { money, useApiData } from '../lib/hooks'
import { EmptyState, ErrorNote, PageHeader } from '../components/ui'

export function AccountsPage() {
  const [includeInactive, setIncludeInactive] = useState(false)
  const accounts = useApiData(
    () => window.api.accounts.list({ includeInactive }),
    [includeInactive]
  )

  return (
    <section>
      <PageHeader
        title="Accounts"
        subtitle="Read-only reference — balances computed locally from records"
        actions={
          <label className="toggle">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
        }
      />
      <ErrorNote error={accounts.error} />

      {accounts.data && accounts.data.length === 0 ? (
        <EmptyState
          message="No accounts yet."
          hint="Accounts are maintained in Notion (pulled in Phase 3) or seeded locally for development."
        />
      ) : (
        <div className="account-grid">
          {accounts.data?.map((a) => (
            <div key={a.id} className={`account-card ${a.inactive ? 'inactive' : ''}`}>
              <div className="account-head">
                <span className="account-name">{a.name}</span>
                <span className="account-type">{a.type}</span>
              </div>
              <div className={`account-balance ${a.currentBalance < 0 ? 'neg-text' : ''}`}>
                {money(a.currentBalance)}
              </div>
              <dl className="account-meta">
                <div>
                  <dt>Starting</dt>
                  <dd>{money(a.startingBalance)}</dd>
                </div>
                {a.creditLimit !== null && (
                  <>
                    <div>
                      <dt>Credit limit</dt>
                      <dd>{money(a.creditLimit)}</dd>
                    </div>
                    <div>
                      <dt>Available</dt>
                      <dd>{a.availableLimit === null ? '—' : money(a.availableLimit)}</dd>
                    </div>
                  </>
                )}
                {a.inactive && (
                  <div>
                    <dt>Status</dt>
                    <dd>Inactive</dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
