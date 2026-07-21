// Pure, framework-free helpers shared across the finance workspace. Extracted
// from finance-workspace.tsx (P4-2) so page/UI modules can import them without
// pulling in the whole monolith. No React, JSX, or hooks belong here.

import { calculateNetIncome } from "./finance-rules";
import type { ExpenseRecord, IncomeRecord } from "@/types/finance";

/**
 * Update the [YYMMDDx] tag in a description string based on a new date.
 * - If the description has no tag, prepend [YYMMDDx] with default code 'x'.
 * - If the description already has a [..] tag, replace the date portion
 *   while preserving the existing transaction code letter.
 * Preserves any text after the tag.
 */
export function applyNotionTag(description: string, yyymmdd: string | null): string {
  if (!yyymmdd) return description;
  const tagRegex = /^\[(\d{6})([a-zA-Z])\]\s*/;
  const match = description.match(tagRegex);
  if (match) {
    // Preserve existing transaction code letter
    const code = match[2];
    const rest = description.slice(match[0].length);
    return `[${yyymmdd}${code}] ${rest}`;
  }
  // No existing tag — prepend with default code 'x'
  return `[${yyymmdd}x] ${description}`;
}

/**
 * Update the [YYMMDD] tag in an income name string based on a new date.
 * Income uses [YYMMDD] format (no transaction code letter).
 */
export function applyIncomeTag(name: string, yyymmdd: string | null): string {
  if (!yyymmdd) return name;
  const tagRegex = /^\[(\d{6})\]\s*/;
  const match = name.match(tagRegex);
  if (match) {
    const rest = name.slice(match[0].length);
    return `[${yyymmdd}] ${rest}`;
  }
  // No existing tag — prepend
  return `[${yyymmdd}] ${name}`;
}

/** Strip Notion's [YYMMDD] or [YYMMDDx] prefix from names/descriptions for display. */
export function stripNotionTag(text: string): string {
  return text.replace(/^\[.*?\]\s*/, "");
}

export function getMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function parseNumberInput(value: string) {
  const parsed = Number(value.replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOptionalNumberInput(value: string) {
  if (value.trim() === "") {
    return null;
  }

  return parseNumberInput(value);
}

export function getIncomeGrossTotal(records: IncomeRecord[]) {
  return records.reduce((sum, record) => sum + record.grossIncome, 0);
}

export function getIncomeCapitalExpenditureTotal(records: IncomeRecord[]) {
  return records.reduce((sum, record) => sum + record.capitalExpenditure, 0);
}

export function getIncomeNetTotal(records: IncomeRecord[]) {
  return records.reduce(
    (sum, record) => sum + calculateNetIncome(record.grossIncome, record.capitalExpenditure),
    0,
  );
}

export function getExpenseTotal(records: ExpenseRecord[]) {
  return records.reduce((sum, record) => sum + record.amount, 0);
}
