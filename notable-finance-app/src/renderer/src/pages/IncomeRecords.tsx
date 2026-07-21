import { useMemo, useState } from 'react'
import type {
  CreateIncomeInput,
  IncomeRecordDto,
  IncomeView
} from '../../../shared/finance.types'
import { INCOME_VIEW_FIXED_CATEGORY } from '../../../shared/finance.types'
import { currentMonth, money, runMutation, today, useApiData } from '../lib/hooks'
import { EmptyState, ErrorNote, Field, Modal, MonthPicker, PageHeader } from '../components/ui'

// Shared page for all income-backed sections, mirroring the web app's view semantics:
// Income (excludes auxiliary categories), Transfer / CC Payment / Alkansya (fixed
// category), Receivables (no receiving account yet).

interface Props {
  view: IncomeView
  title: string
  subtitle: string
}

interface FormState {
  id?: string
  name: string
  date: string
  grossIncome: string
  capitalExpenditure: string
  accountId: string
  categoryId: string
  notes: string
}

const emptyForm = (): FormState => ({
  name: '',
  date: today(),
  grossIncome: '',
  capitalExpenditure: '0',
  accountId: '',
  categoryId: '',
  notes: ''
})

export function IncomeRecordsPage({ view, title, subtitle }: Props) {
  const [month, setMonth] = useState(currentMonth())
  const [allTime, setAllTime] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const params = allTime ? { view } : { view, month }
  const records = useApiData(() => window.api.incomes.list(params), [view, month, allTime])
  const accounts = useApiData(() => window.api.accounts.list(), [])
  const categories = useApiData(() => window.api.categories.income(), [])

  const fixedCategorySource = INCOME_VIEW_FIXED_CATEGORY[view]
  const fixedCategory = useMemo(
    () => categories.data?.find((c) => c.source === fixedCategorySource),
    [categories.data, fixedCategorySource]
  )
  // Plain income form offers non-auxiliary categories (web: normalOnly).
  const selectableCategories = useMemo(() => {
    if (!categories.data) return []
    if (fixedCategorySource) return fixedCategory ? [fixedCategory] : []
    if (view === 'incomes') return categories.data.filter((c) => !c.auxiliary)
    return categories.data
  }, [categories.data, fixedCategory, fixedCategorySource, view])

  const accountName = (id: string | null): string =>
    accounts.data?.find((a) => a.id === id)?.name ?? (id ? id.slice(0, 8) : '—')
  const categoryName = (id: string): string =>
    categories.data?.find((c) => c.id === id)?.source ?? (id ? id.slice(0, 8) : '—')

  const openCreate = (): void => {
    const f = emptyForm()
    if (fixedCategory) f.categoryId = fixedCategory.id
    setFormError(null)
    setForm(f)
  }

  const openEdit = (r: IncomeRecordDto): void => {
    setFormError(null)
    setForm({
      id: r.id,
      name: r.name,
      date: r.date,
      grossIncome: String(r.grossIncome),
      capitalExpenditure: String(r.capitalExpenditure),
      accountId: r.accountId ?? '',
      categoryId: r.categoryId,
      notes: ''
    })
  }

  const submit = async (): Promise<void> => {
    if (!form) return
    const input: CreateIncomeInput = {
      name: form.name,
      date: form.date,
      grossIncome: Number(form.grossIncome),
      capitalExpenditure: Number(form.capitalExpenditure || 0),
      accountId: form.accountId || null,
      categoryId: form.categoryId,
      notes: form.notes || null
    }
    const res = form.id
      ? await runMutation(() => window.api.incomes.update(form.id as string, input))
      : await runMutation(() => window.api.incomes.create(input))
    if (res.ok) setForm(null)
    else setFormError(res.error ?? 'Failed')
  }

  const remove = async (r: IncomeRecordDto): Promise<void> => {
    await runMutation(() => window.api.incomes.softDelete(r.id))
  }

  const createDisabled = fixedCategorySource !== undefined && !fixedCategory

  return (
    <section>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <label className="toggle">
              <input type="checkbox" checked={allTime} onChange={(e) => setAllTime(e.target.checked)} />
              All time
            </label>
            {!allTime && <MonthPicker value={month} onChange={setMonth} />}
            <button type="button" className="primary" onClick={openCreate} disabled={createDisabled}>
              + New
            </button>
          </>
        }
      />
      {createDisabled && (
        <p className="hint-banner">
          Requires the “{fixedCategorySource}” income category in the local reference data
          (seeded or pulled from Notion).
        </p>
      )}
      <ErrorNote error={records.error ?? accounts.error ?? categories.error} />

      {records.data && records.data.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} records${allTime ? '' : ` in ${month}`}.`} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th className="num">Gross</th>
              <th className="num">Capital</th>
              <th className="num">Net</th>
              <th>Account</th>
              <th>Category</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {records.data?.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.date}</td>
                <td className="num">{money(r.grossIncome)}</td>
                <td className="num">{money(r.capitalExpenditure)}</td>
                <td className="num strong">{money(r.grossIncome - r.capitalExpenditure)}</td>
                <td>{accountName(r.accountId)}</td>
                <td>{categoryName(r.categoryId)}</td>
                <td className="row-actions">
                  <button type="button" onClick={() => openEdit(r)}>Edit</button>
                  <button type="button" className="danger" onClick={() => void remove(r)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {form && (
        <Modal title={form.id ? `Edit ${title}` : `New ${title}`} onClose={() => setForm(null)}>
          <ErrorNote error={formError} />
          <div className="form-grid">
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Gross income">
              <input
                type="number" step="0.01" value={form.grossIncome}
                onChange={(e) => setForm({ ...form, grossIncome: e.target.value })}
              />
            </Field>
            <Field label="Capital expenditure">
              <input
                type="number" step="0.01" value={form.capitalExpenditure}
                onChange={(e) => setForm({ ...form, capitalExpenditure: e.target.value })}
              />
            </Field>
            <Field label={view === 'receivables' ? 'Account (leave empty while receivable)' : 'Account'}>
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                <option value="">(none)</option>
                {accounts.data?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={form.categoryId}
                disabled={fixedCategorySource !== undefined}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">(choose)</option>
                {selectableCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.source}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
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
