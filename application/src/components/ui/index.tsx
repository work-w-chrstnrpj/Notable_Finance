"use client";

import type { ReactNode } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import { getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";

export type ComputedValueTone = "green" | "rose" | "amber" | "ink";

export function PageToolbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-toolbar">
      <div>
        <h2>{title}</h2>
      </div>
      {actions && <div className="page-toolbar__actions">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "green" | "rose" | "blue" | "amber";
}) {
  return (
    <article className={cx("metric-card", `metric-card--${tone}`)}>
      <div className="metric-card__top">
        <p>{title}</p>
        <span className="metric-card__icon">
          <Icon size={14} />
        </span>
      </div>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

export function Badge({ tone, children }: { tone: "green" | "rose" | "blue" | "amber" | "neutral"; children: ReactNode }) {
  return <span className={cx("badge", `badge--${tone}`)}>{children}</span>;
}

export function MoneyLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="money-line">
      <span>{label}</span>
      <strong>{formatMoney(value)}</strong>
    </div>
  );
}

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cx("field", className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function ComputedField({
  label,
  value,
  valueTone = "ink",
}: {
  label: string;
  value: string;
  valueTone?: ComputedValueTone;
}) {
  return (
    <div className="computed-field">
      <span>{label}</span>
      <strong className={cx("computed-field__value", `computed-field__value--${valueTone}`)}>{value}</strong>
    </div>
  );
}

export function FormSectionDivider({ title }: { title: string }) {
  return (
    <div className="form-section-divider">
      <span>{title}</span>
    </div>
  );
}

export function MoneyValue({ value }: { value: number }) {
  const tone = getMoneyValueTone(value);

  return (
    <span className={cx("money-value", `money-value--${tone}`)}>
      {formatMoney(value)}
    </span>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <RefreshCw size={16} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={cx(option.value === value && "segmented__item--active")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cx("filter-toggle", checked && "filter-toggle--active")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function FilterSelect({
  placeholder,
  placeholderDisabled = true,
  value,
  onChange,
  children,
}: {
  placeholder: string;
  placeholderDisabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="filter-select">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled={placeholderDisabled}>
          {placeholder}
        </option>
        {children}
      </select>
    </label>
  );
}

export function BudgetRow({ label, percent, amount }: { label: string; percent: number; amount: number }) {
  return (
    <div className="budget-row">
      <strong className="budget-row__label">{label}</strong>
      <span className="budget-row__percent">{percent}%</span>
      <span className="budget-row__amount">{formatMoney(amount)}</span>
    </div>
  );
}

export function CategoryCard({
  title,
  detail,
  value,
  muted = false,
  onClick,
}: {
  title: string;
  detail: string;
  value: string;
  muted?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <p>{title}</p>
      <span>{detail}</span>
      <strong>{value}</strong>
    </>
  );
  const className = cx("category-card", muted && "category-card--muted", onClick && "category-card--button");

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <article className={cx("category-card", muted && "category-card--muted")}>
      {content}
    </article>
  );
}

export function ErrorRow({ code, detail }: { code: string; detail: string }) {
  return (
    <div className="error-row">
      <FileWarning size={16} />
      <div>
        <strong>{code}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
