import type { ReactNode } from 'react'
import { money } from '../lib/hooks'

// Small shared UI primitives for the Phase 1 pages.

export function PageHeader(props: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{props.title}</h1>
        {props.subtitle && <p className="subtitle">{props.subtitle}</p>}
      </div>
      <div className="actions">{props.actions}</div>
    </header>
  )
}

export function MonthPicker(props: { value: string; onChange: (month: string) => void }) {
  return (
    <input
      className="month-picker"
      type="month"
      value={props.value}
      onChange={(e) => e.target.value && props.onChange(e.target.value)}
    />
  )
}

export function StatCard(props: { label: string; value: number; tone?: 'pos' | 'neg' | 'plain'; count?: boolean }) {
  const tone = props.tone ?? (props.value < 0 ? 'neg' : 'plain')
  return (
    <div className={`stat-card ${tone}`}>
      <span className="stat-label">{props.label}</span>
      <span className="stat-value">{props.count ? props.value : money(props.value)}</span>
    </div>
  )
}

export function EmptyState(props: { message: string; hint?: string }) {
  return (
    <div className="empty-state">
      <p>{props.message}</p>
      {props.hint && <p className="hint">{props.hint}</p>}
    </div>
  )
}

export function ErrorNote(props: { error: string | null }) {
  if (!props.error) return null
  return <p className="error-note">{props.error}</p>
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{props.title}</h2>
          <button type="button" className="icon-btn" onClick={props.onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {props.children}
      </div>
    </div>
  )
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      {props.children}
    </label>
  )
}

/** Per-record sync badge (offline-and-state-model.md): dirty and conflict are shown. */
export function SyncBadge({ state }: { state?: 'clean' | 'dirty' | 'conflict' }) {
  if (state === 'dirty') return <span className="sync-badge dirty">Not yet synced</span>
  if (state === 'conflict') return <span className="sync-badge conflict">Conflict</span>
  return null
}
