import type {
  ExpenseViewMode,
  FinanceSectionId,
  IncomeViewMode,
  MonitoringViewMode,
} from "@/types/finance";

export type ViewUnit = "day" | "week" | "month" | "quarter" | "half" | "year";

/** Months per fixed calendar period: a quarter is 3 months (Q1 Jan to Mar), a half is 6 (H1 Jan to Jun). */
const PERIOD_MONTHS: Partial<Record<ViewUnit, number>> = { quarter: 3, half: 6 };

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

export function incomeModeToUnit(mode: IncomeViewMode): ViewUnit | null {
  switch (mode) {
    case "All Records":
      return null;
    case "Daily":
      return "day";
    case "Weekly":
      return "week";
    case "Quarterly":
      return "quarter";
    case "Semi-Annually":
      return "half";
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
export function expenseModeToUnit(mode: ExpenseViewMode | IncomeViewMode): ViewUnit | null {
  switch (mode) {
    case "Daily":
      return "day";
    case "Weekly":
      return "week";
    case "Monthly":
      return "month";
    case "Quarterly":
      return "quarter";
    case "Semi-Annually":
      return "half";
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
      return "half";
    case "Quarterly":
      return "quarter";
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
  const periodMonths = PERIOD_MONTHS[unit];
  if (periodMonths) {
    // Fixed calendar quarter / half containing the anchor (ADR-0012).
    const firstMonth = Math.floor(m / periodMonths) * periodMonths; // 0-indexed
    const end = new Date(Date.UTC(y, firstMonth + periodMonths, 0, 12)); // last day of the period
    return { start: isoDate(y, firstMonth + 1, 1), end: fmt(end) };
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
  else if (PERIOD_MONTHS[unit]) {
    // Whole quarters / halves: land on the first day of the target period so it always lies inside it.
    const size = PERIOD_MONTHS[unit]!;
    const firstMonth = Math.floor(d.getUTCMonth() / size) * size + delta * size;
    return fmt(new Date(Date.UTC(d.getUTCFullYear(), firstMonth, 1, 12)));
  } else d.setUTCFullYear(d.getUTCFullYear() + delta);
  return fmt(d);
}

/** The fixed calendar quarter (1 to 4) containing the anchor. */
export function quarterOf(anchorIso: string): 1 | 2 | 3 | 4 {
  return (Math.floor(parse(anchorIso).getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

/** The fixed calendar half (1 = Jan to Jun, 2 = Jul to Dec) containing the anchor. */
export function halfOf(anchorIso: string): 1 | 2 {
  return parse(anchorIso).getUTCMonth() < 6 ? 1 : 2;
}

/** Inclusive [start, end] bounds of the period the anchor belongs to (an alias of computeRange, named for pages). */
export function periodContaining(unit: ViewUnit, anchorIso: string): { start: string; end: string } {
  return computeRange(unit, anchorIso);
}

/** 0-indexed months (0 = Jan) of the quarter or half containing the anchor; empty for other units. */
export function periodMonthIndexes(unit: ViewUnit, anchorIso: string): number[] {
  const size = PERIOD_MONTHS[unit];
  if (!size) return [];
  const first = Math.floor(parse(anchorIso).getUTCMonth() / size) * size;
  return Array.from({ length: size }, (_, i) => first + i);
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
  if (unit === "quarter" || unit === "half") {
    const months = periodMonthIndexes(unit, anchorIso);
    const first = MONTH_NAMES[months[0]].slice(0, 3);
    const last = MONTH_NAMES[months[months.length - 1]].slice(0, 3);
    const tag = unit === "quarter" ? `Q${quarterOf(anchorIso)}` : `H${halfOf(anchorIso)}`;
    return `${tag} ${y} · ${first} – ${last}`;
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
  workflowViewMode: IncomeViewMode = "Monthly",
): ViewUnit | null {
  switch (section) {
    case "income":
      return incomeModeToUnit(incomeViewMode);
    case "expense":
      return expenseModeToUnit(expenseViewMode);
    case "dashboard":
      return "month";
    case "monthly-monitoring":
      return monitoringModeToUnit(monitoringViewMode);
    case "transfer":
    case "credit-card-payment":
    case "alkansya":
    case "borrowings":
    case "receivables":
      return incomeModeToUnit(workflowViewMode);
    default:
      return null;
  }
}
