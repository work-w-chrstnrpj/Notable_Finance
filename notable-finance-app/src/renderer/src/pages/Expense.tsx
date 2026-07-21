import { useState } from 'react'
import type {
  CreateExpenseInput,
  ExpenseRecordDto,
  PasabuyStatus,
  PaymentStatus
} from '../../../shared/finance.types'
import { currentMonth, money, runMutation, today, useApiData } from '../lib/hooks'
import { EmptyState, ErrorNote, Field, Modal, MonthPicker, PageHeader } from '../components/ui'

const PAYMENT_STATUSES: PaymentStatus[] = ['Paid', 'Unpaid', 'Installment', 'Cancelled']
const PASABUY_STATUSES: PasabuyStatus[] = [
  'Payment not yet receive',
  'Payment partially received',
  'Payment partially received (installment)',
  'Payment fully received'
]

interface FormState {
  id?: string
  description: string
  purchaseDate: string
  datePaid: string
  amount: string
  interest: string
  accountId: string
  categoryId: string
  paymentStatus: PaymentStatus
  isPasabuy: boolean
  pasabuyer: string
  pasabuyStatus: PasabuyStatus | ''
}

const emptyForm = (): FormState => ({
  description: '',
  purchaseDate: today(),
  datePaid: '',
  amount: '',
  interest: '0',
  accountId: '',
  categoryId: '',
  paymentStatus: 'Unpaid',
  isPasabuy: false,
  pasabuyer: '',
  pasabuyStatus: ''
})

export function ExpensePage() {
  const [month, setMonth] = useState(currentMonth())
  const [allTime, setAllTime] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showScheduler, setShowScheduler] = useState(false)

  const expenses = useApiData(
    () => window.api.expenses.list(allTime ? {} : { month }),
    [month, allTime]
  )
  const accounts = useApiData(() => window.api.accounts.list(), [])
  const categories = useApiData(() => window.api.categories.expense(), [])
  const scheduler = useApiData(() => window.api.expenseScheduler.list(), [])

  const accountName = (id: string): string =>
    accounts.data?.find((a) => a.id === id)?.name ?? (id ? id.slice(0, 8) : '—')
  const categoryName = (id: string): string =>
    categories.data?.find((c) => c.id === id)?.name ?? (id ? id.slice(0, 8) : '—')

  const openEdit = (r: ExpenseRecordDto): void => {
    setFormError(null)
    setForm({
      id: r.id,
      description: r.description,
      purchaseDate: r.purchaseDate,
      datePaid: r.datePaid ?? '',
      amount: String(r.amount),
      interest: String(r.interest),
      accountId: r.accountId,
      categoryId: r.categoryId,
      paymentStatus: r.paymentStatus,
      isPasabuy: !!r.pasabuyer,
      pasabuyer: r.pasabuyer ?? '',
      pasabuyStatus: r.pasabuyStatus ?? ''
    })
  }

  const submit = async (): Promise<void> => {
    if (!form) return
    const input: CreateExpenseInput = {
      description: form.description,
      purchaseDate: form.purchaseDate,
      datePaid: form.datePaid || null,
      amount: Number(form.amount),
      interest: Number(form.interest || 0),
      accountId: form.accountId,
      categoryId: form.categoryId,
      paymentStatus: form.paymentStatus,
      isPasabuy: form.isPasabuy,
      pasabuyer: form.isPasabuy ? form.pasabuyer || null : null,
      pasabuyStatus: form.isPasabuy && form.pasabuyStatus ? form.pasabuyStatus : null
    }
    const res = form.id
      ? await runMutation(() => window.api.expenses.update(form.id as string, input))
      : await runMutation(() => window.api.expenses.create(input))
    if (res.ok) setForm(null)
    else setFormError(res.error ?? 'Failed')
  }

  return (
    <section>
      <PageHeader
        title="Expense"
        subtitle="Local expenses — instant offline writes, marked for sync"
        actions={
          <>
            <label className="toggle">
              <input type="checkbox" checked={allTime} onChange={(e) => setAllTime(e.target.checked)} />
              All time
            </label>
            {!allTime && <MonthPicker value={month} onChange={setMonth} />}
            <button type="button" onClick={() => setShowScheduler(!showScheduler)}>
              {showScheduler ? 'Hide scheduler' : `Scheduler (${scheduler.data?.length ?? 0})`}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setFormError(null)
                setForm(emptyForm())
              }}
            >
              + New
            </button>
          </>
        }
      />
      <ErrorNote error={expenses.error ?? accounts.error ?? categories.error} />

      {showScheduler && (
        <div className="panel">
          <h3>Expense scheduler</h3>
          {scheduler.data && scheduler.data.length === 0 ? (
            <EmptyState message="No scheduled expenses." hint="Scheduled definitions materialize into expenses with Generate." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th><th className="num">Amount</th><th>Frequency</th>
                  <th>Next run</th><th>Active</th><th />
                </tr>
              </thead>
              <tbody>
                {scheduler.data?.map((s) => (
                  <tr key={s.id}>
                    <td>{s.title}</td>
                    <td className="num">{money(s.amount)}</td>
                    <td>{s.frequency ?? '—'}</td>
                    <td>{s.nextRunDate ?? '—'}</td>
                    <td>{s.active ? 'Yes' : 'No'}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        onClick={() => void runMutation(() => window.api.expenseScheduler.generate(s.id))}
                      >
                        Generate
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => void runMutation(() => window.api.expenseScheduler.softDelete(s.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {expenses.data && expenses.data.length === 0 ? (
        <EmptyState message={`No expenses${allTime ? '' : ` in ${month}`}.`} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Purchased</th>
              <th className="num">Amount</th>
              <th className="num">Interest</th>
              <th>Status</th>
              <th>Paid</th>
              <th>Account</th>
              <th>Category</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {expenses.data?.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.description}
                  {r.pasabuyer && <span className="tag">Pasabuy: {r.pasabuyer}</span>}
                </td>
                <td>{r.purchaseDate}</td>
                <td className="num">{money(r.amount)}</td>
                <td className="num">{money(r.interest)}</td>
                <td>
                  <span className={`status status-${r.paymentStatus.toLowerCase()}`}>{r.paymentStatus}</span>
                </td>
                <td>{r.datePaid ?? '—'}</td>
                <td>{accountName(r.accountId)}</td>
                <td>{categoryName(r.categoryId)}</td>
                <td className="row-actions">
                  <button type="button" onClick={() => openEdit(r)}>Edit</button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void runMutation(() => window.api.expenses.softDelete(r.id))}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Modal title={form.id ? 'Edit expense' : 'New expense'} onClose={() => setForm(null)}>
          <ErrorNote error={formError} />
          <div className="form-grid">
            <Field label="Description">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Purchase date">
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </Field>
            <Field label="Amount">
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Interest">
              <input type="number" step="0.01" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} />
            </Field>
            <Field label="Account">
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                <option value="">(choose)</option>
                {accounts.data?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">(choose)</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment status">
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Date paid">
              <input type="date" value={form.datePaid} onChange={(e) => setForm({ ...form, datePaid: e.target.value })} />
            </Field>
            <Field label="Pasabuy">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.isPasabuy}
                  onChange={(e) => setForm({ ...form, isPasabuy: e.target.checked })}
                />
                This is a Pasabuy expense
              </label>
            </Field>
            {form.isPasabuy && (
              <>
                <Field label="Pasabuyer">
                  <input value={form.pasabuyer} onChange={(e) => setForm({ ...form, pasabuyer: e.target.value })} />
                </Field>
                <Field label="Pasabuy status">
                  <select
                    value={form.pasabuyStatus}
                    onChange={(e) => setForm({ ...form, pasabuyStatus: e.target.value as PasabuyStatus })}
                  >
                    <option value="">(none)</option>
                    {PASABUY_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setForm(null)}>Cancel</button>
            <button type="button" className="primary" onClick={() => void submit()}>
              {form.id ? 'Save' : 'Create'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
