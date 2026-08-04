
import { useRef, useState, type ReactNode } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import { getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import { ShortcutHint } from "@/components/shortcuts";
import styles from "./index.module.css";

export type ComputedValueTone = "green" | "rose" | "amber" | "ink";

export function PageToolbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles["page-toolbar"]}>
      <div>
        <h2>{title}</h2>
      </div>
      {actions && <div className={styles["page-toolbar__actions"]}>{actions}</div>}
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
      <div className={styles.panel__header}>
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
    <article className={cx(styles["metric-card"], styles[`metric-card--${tone}`])}>
      <div className={styles["metric-card__top"]}>
        <p>{title}</p>
        <span className={styles["metric-card__icon"]}>
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

export function MoneyLine({
  label,
  value,
  colorBySign,
}: {
  label: string;
  value: number;
  /** Negative → red, zero → default ink, positive → green. */
  colorBySign?: boolean;
}) {
  const signClass = colorBySign
    ? value < 0
      ? "num--neg"
      : value > 0
        ? "num--pos"
        : "num--zero"
    : "";
  return (
    <div className={styles["money-line"]}>
      <span>{label}</span>
      <strong className={signClass}>{formatMoney(value)}</strong>
    </div>
  );
}

export function Field({
  label,
  required,
  className,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cx("field", error && styles["field--error"], className)} aria-required={required || undefined}>
      <span>
        {label}
        {required && <span className={styles.field__required} aria-hidden="true"> *</span>}
      </span>
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
    <div className={styles["computed-field"]}>
      <span>{label}</span>
      <strong className={cx("computed-field__value", `computed-field__value--${valueTone}`)}>{value}</strong>
    </div>
  );
}

export function FormSectionDivider({ title }: { title: string }) {
  return (
    <div className={styles["form-section-divider"]}>
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
    <div className={styles["loading-block"]} role="status" aria-live="polite">
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
  shortcutId,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  shortcutId?: string;
}) {
  return (
    <div className={styles.segmented} aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={cx(option.value === value && styles["segmented__item--active"])}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
      {shortcutId && <ShortcutHint id={shortcutId} />}
    </div>
  );
}

export function FilterToggle({
  label,
  checked,
  onChange,
  shortcutId,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  shortcutId?: string;
}) {
  return (
    <label className={cx("filter-toggle", checked && "filter-toggle--active")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
      {shortcutId && <ShortcutHint id={shortcutId} />}
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

/** Icon‑aware dropdown: renders icon + label per item, native select cannot. */
export function FilterDropdown({
  placeholder,
  value,
  onChange,
  items,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  items: Array<{ id: string; label: string; icon?: ReactNode }>;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);
  return (
    <div className={cx(styles["filter-dropdown"], open && styles["filter-dropdown--open"])}>
      <button
        type="button"
        className={styles["filter-dropdown__trigger"]}
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <span className={styles["filter-dropdown__selected"]}>
            {selected.icon}
            {selected.label}
          </span>
        ) : (
          <span className={styles["filter-dropdown__placeholder"]}>{placeholder}</span>
        )}
      </button>
      {open && (
        <div className={styles["filter-dropdown__menu"]}>
          <button
            type="button"
            className={cx(styles["filter-dropdown__item"], !value && styles["filter-dropdown__item--active"])}
            onClick={() => { onChange(""); setOpen(false); }}
          >
            {placeholder}
          </button>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={cx(styles["filter-dropdown__item"], value === item.id && styles["filter-dropdown__item--active"])}
              onClick={() => { onChange(item.id); setOpen(false); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Notion-style multi-select: chips in input, searchable dropdown with +/- buttons. */
export function MultiSelect({
  placeholder,
  selectedIds,
  onChange,
  items,
}: {
  placeholder: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  items: Array<{ id: string; label: string; sublabel?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = items.filter((i) => selectedIds.includes(i.id));
  const filtered = items.filter(
    (i) =>
      i.label.toLowerCase().includes(search.toLowerCase()) ||
      (i.sublabel && i.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
    inputRef.current?.focus();
  }

  function handleInputFocus() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  }

  function handleInputBlur() {
    closeTimerRef.current = setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setSearch("");
      }
    }, 150);
  }

  return (
    <div className={styles["multi-select"]} ref={containerRef}>
      <div className={styles["multi-select__picker"]}>
        <div
          className={cx(styles["multi-select__control"], open && styles["multi-select__control--open"])}
          onClick={() => { inputRef.current?.focus(); setOpen(true); }}
        >
          <input
            ref={inputRef}
            type="text"
            className={styles["multi-select__input"]}
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        {open && filtered.length > 0 && (
          <div className={styles["multi-select__dropdown"]}>
            {filtered.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cx(styles["multi-select__option"], isSelected && styles["multi-select__option--selected"])}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(item.id);
                  }}
                >
                  <span className={styles["multi-select__option-content"]}>
                    <span className={styles["multi-select__option-label"]}>{item.label}</span>
                    {item.sublabel && (
                      <span className={styles["multi-select__option-sublabel"]}>{item.sublabel}</span>
                    )}
                  </span>
                  <span className={cx(styles["multi-select__option-action"], isSelected && styles["multi-select__option-action--remove"])}>
                    {isSelected ? "\u2212" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className={styles["multi-select__linked"]}>
          {selected.map((item) => (
            <div key={item.id} className={styles["multi-select__linked-item"]}>
              <span className={styles["multi-select__linked-info"]}>
                <span className={styles["multi-select__linked-label"]}>{item.label}</span>
                {item.sublabel && (
                  <span className={styles["multi-select__linked-sublabel"]}>{item.sublabel}</span>
                )}
              </span>
              <button
                type="button"
                className={styles["multi-select__linked-remove"]}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(item.id);
                }}
              >
                −
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BudgetRow({ label, percent, amount }: { label: string; percent: number; amount: number }) {
  return (
    <div className={styles["budget-row"]}>
      <strong className={styles["budget-row__label"]}>{label}</strong>
      <span className={styles["budget-row__percent"]}>{percent}%</span>
      <span className={styles["budget-row__amount"]}>{formatMoney(amount)}</span>
    </div>
  );
}

export function CategoryCard({
  title,
  detail,
  value,
  icon,
  muted = false,
  onClick,
}: {
  title: string;
  detail: string;
  value: string;
  icon?: ReactNode;
  muted?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      {icon && <span className={styles["category-card__icon"]}>{icon}</span>}
      <p>{title}</p>
      <span>{detail}</span>
      <strong>{value}</strong>
    </>
  );
  const className = cx(styles["category-card"], muted && styles["category-card--muted"], onClick && styles["category-card--button"]);

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <article className={cx(styles["category-card"], muted && styles["category-card--muted"])}>
      {content}
    </article>
  );
}

export function ErrorRow({ code, detail }: { code: string; detail: string }) {
  return (
    <div className={styles["error-row"]}>
      <FileWarning size={16} />
      <div>
        <strong>{code}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

// ── Skeleton loading primitives ─────────────────────────────────────────

/** Single animated bar used as the base primitive for skeleton layouts. */
export function SkeletonBar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`${styles["skeleton-bar"]} ${className ?? ""}`} style={style} aria-hidden="true" />;
}

/** Metric-card-shaped skeleton (used on Dashboard, Monitoring). */
export function MetricCardSkeleton() {
  return (
    <article className={styles["skeleton-metric-card"]} aria-busy="true" aria-label="Loading metric">
      <SkeletonBar className="skeleton-bar--title" style={{ width: "45%", height: 12 }} />
      <SkeletonBar className="skeleton-bar--value" style={{ width: "70%", height: 22 }} />
      <SkeletonBar className="skeleton-bar--detail" style={{ width: "55%", height: 11 }} />
    </article>
  );
}

/** Panel-shaped skeleton wrapping a title + N table rows. */
export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section className="panel" aria-busy="true" aria-label="Loading">
      <div className={styles.panel__header}>
        <SkeletonBar style={{ width: 120, height: 16 }} />
      </div>
      <div className={styles["skeleton-table"]}>
        {Array.from({ length: rows }, (_, i) => (
          <div className={styles["skeleton-table__row"]} key={i}>
            <SkeletonBar style={{ flex: 2, height: 13 }} />
            <SkeletonBar style={{ flex: 1, height: 13 }} />
            <SkeletonBar style={{ flex: 1, height: 13 }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Grid of skeleton metric cards. */
export function MetricCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="metric-grid" aria-busy="true" aria-label="Loading metrics">
      {Array.from({ length: count }, (_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}
