import type {
  ExpenseViewMode,
  FinanceSectionId,
  IncomeViewMode,
  MonitoringViewMode,
} from "@/types/finance";

export type ViewUnit = "day" | "week" | "month" | "year";

/** ISO YYYY-MM-DD for today (local). */
export function todayIso(): string {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function isoDate(y: number, m: number, d: number): string {
  return `${y.toString().padStart(4, "0")}-${m
    .toString()
    .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}

/** Parse a YYYY-MM-DD string into a UTC-noon Date (timezone-safe). */
function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
}

function fmt(date: Date): string {
  return isoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

export function incomeModeToUnit(mode: IncomeViewMode): ViewUnit {
  switch (mode) {
    case "Daily":
      return "day";
    case "Weekly":
      return "week";
    case "Annually":
      return "year";
    case "Monthly":
    default:
      return "month";
  }
}

/**
 * Expense calendar modes map to a date unit. The workflow/status modes
 * (Unpaid Pasabuy, To pay, To buy, Installments, Unpaid CC) are not
 * date-scoped and return null.
 */
export function expenseModeToUnit(mode: ExpenseViewMode): ViewUnit | null {
  switch (mode) {
    case "Daily":
      return "day";
    case "Weekly":
      return "week";
    case "Monthly":
      return "month";
    case "Annually":
      return "year";
    default:
      return null;
  }
}

export function monitoringModeToUnit(mode: MonitoringViewMode): ViewUnit {
  switch (mode) {
    case "Annually":
      return "year";
    case "Semi-Annually":
    case "Quarterly":
    case "Monthly":
    default:
      return "month";
  }
}

/** Inclusive [start, end] ISO bounds for the unit containing the anchor. */
export function computeRange(
  unit: ViewUnit,
  anchorIso: string,
): { start: string; end: string } {
  const d = parse(anchorIso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();

  if (unit === "day") {
    return { start: anchorIso, end: anchorIso };
  }
  if (unit === "year") {
    return { start: isoDate(y, 1, 1), end: isoDate(y, 12, 31) };
  }
  if (unit === "month") {
    const end = new Date(Date.UTC(y, m + 1, 0, 12)); // last day of month
    return { start: isoDate(y, m + 1, 1), end: fmt(end) };
  }
  // week: Monday → Sunday containing the anchor
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: fmt(monday), end: fmt(sunday) };
}

/** Step the anchor forward/back by one unit. */
export function stepAnchor(
  unit: ViewUnit,
  anchorIso: string,
  delta: number,
): string {
  const d = parse(anchorIso);
  if (unit === "day") d.setUTCDate(d.getUTCDate() + delta);
  else if (unit === "week") d.setUTCDate(d.getUTCDate() + delta * 7);
  else if (unit === "month") d.setUTCMonth(d.getUTCMonth() + delta);
  else d.setUTCFullYear(d.getUTCFullYear() + delta);
  return fmt(d);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Human label for the current anchor + unit (shown in the selector). */
export function rangeLabel(unit: ViewUnit, anchorIso: string): string {
  const d = parse(anchorIso);
  const y = d.getUTCFullYear();
  const monthName = MONTH_NAMES[d.getUTCMonth()];
  if (unit === "day") {
    return `${monthName} ${d.getUTCDate()}, ${y}`;
  }
  if (unit === "year") {
    return `${y}`;
  }
  if (unit === "month") {
    return `${monthName} ${y}`;
  }
  const { start, end } = computeRange("week", anchorIso);
  const s = parse(start);
  const e = parse(end);
  const sLabel = `${MONTH_NAMES[s.getUTCMonth()].slice(0, 3)} ${s.getUTCDate()}`;
  const eLabel = `${MONTH_NAMES[e.getUTCMonth()].slice(0, 3)} ${e.getUTCDate()}`;
  return `${sLabel} – ${eLabel}, ${y}`;
}

/** YYYY-MM for the anchor (used by month-scoped sections). */
export function anchorMonth(anchorIso: string): string {
  return anchorIso.slice(0, 7);
}

/**
 * The date unit the global selector should step by for the active section.
 * Returns null when the section has no date scope (accounts, sync, settings)
 * or the active view mode is not date-scoped (Unpaid Pasabuy, To pay, etc.).
 */
export function activeSelectorUnit(
  section: FinanceSectionId,
  incomeViewMode: IncomeViewMode,
  expenseViewMode: ExpenseViewMode,
  monitoringViewMode: MonitoringViewMode = "Monthly",
): ViewUnit | null {
  switch (section) {
    case "income":
      return incomeModeToUnit(incomeViewMode);
    case "expense":
      return expenseModeToUnit(expenseViewMode);
    case "dashboard":
    case "transfer":
    case "credit-card-payment":
      return "month";
    case "monthly-monitoring":
      return monitoringModeToUnit(monitoringViewMode);
    // Alkansya (Savings) and Receivables are month-independent buckets, so
    // they show no date selector and query every matching record.
    case "alkansya":
    case "receivables":
      return null;
    default:
      return null;
  }
}
