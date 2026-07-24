// Shared constants and types used across finance components.

export const prototypeAccent = "#5B6CF9";

export const categoryPalette = [prototypeAccent, "#0D9488", "#D97706", "#E11D48", "#7C3AED", "#64748B"];

export const expenseCategoryFilterWithoutPasabuy = "__without-pasabuy";

export type AccountScope = "all" | "standard" | "credit";

export type AnnualGroupBy = "month" | "account" | "category";

export const ANNUAL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type AnnualRecord = {
  dateIso: string;
  accountId: string | null;
  categoryId: string;
  value: number;
};

export type ForecastKind = "income" | "expense";
export type ForecastIncome = {
  id: string;
  label: string;
  amount: number;
  /** Absent on legacy stored items → treated as income. */
  kind?: ForecastKind;
};
