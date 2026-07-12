const moneyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const wholeMoneyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatMoney(value: number, options?: { compact?: boolean }) {
  if (options?.compact) {
    return wholeMoneyFormatter.format(value);
  }

  return moneyFormatter.format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return dateFormatter.format(parsed);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

/** Convert a YYYY-MM-DD date string to YYMMDD format (e.g. "2026-07-30" → "260730"). */
export function toYYMMDD(isoDate: string): string | null {
  if (!isoDate) return null;
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[1].slice(2)}${match[2]}${match[3]}`;
}
