import type { ReactNode } from "react";
import { formatMoney, formatDate } from "@/lib/format";
import {
  calculateGrossPrice,
  calculateInstallmentAmount,
  calculatePaidAmount,
  calculateRemainingBalance,
  calculateExpectedPaymentDate,
} from "@/lib/finance-rules";
import { stripNotionTag, getExpenseTotal } from "@/lib/finance-helpers";
import type { Account, ExpenseRecord, ExpenseViewMode } from "@/types/finance";

/**
 * Per-view-mode table shape for the Expense page, as DATA rather than a 4-deep JSX ternary
 * chain (refactor_development_plan.md F1, Phase 4.1). `DataTable` and every prop it receives
 * are unchanged — only *how the shape is chosen* moved here.
 *
 * The four configs below are transcribed cell-for-cell from the original branches. Where the
 * original was odd, the oddity is preserved verbatim (see the Unpaid Pasabuy footer note).
 */

/** Derived credit/installment figures for one record — mirrors the form modal's math. */
export interface ExpenseComputed {
  gross: number;
  installment: number | null;
  paid: number;
  remaining: number;
  expected: string | null;
}

export interface ExpenseTableContext {
  accountCell: (id: string | null | undefined) => ReactNode;
  categoryCell: (id: string) => ReactNode;
  derive: (record: ExpenseRecord) => ExpenseComputed;
  /** Selected-and-not-disabled rows — the set the footer totals sum over. */
  enabledRecords: ExpenseRecord[];
}

export interface ExpenseTableConfig {
  headers: string[];
  buildRow: (record: ExpenseRecord) => ReactNode[];
  buildFooter: () => ReactNode[][];
  /** Only the Unpaid CC view offers "Cover the expense". */
  showBulkCover?: boolean;
}

const sum = (records: ExpenseRecord[], pick: (r: ExpenseRecord) => number): number =>
  records.reduce((total, r) => total + pick(r), 0);

const money = (value: number) => <span className="num">{formatMoney(value)}</span>;

function unpaidPasabuyConfig(ctx: ExpenseTableContext): ExpenseTableConfig {
  return {
    headers: ["Date", "Name", "Account", "Pasabuyer Balance", "Pasabuyer", "Status", "DOP", "Account Receiver"],
    buildRow: (record) => [
      formatDate(record.purchaseDate),
      <span className="expense-cell--unpaid" key={`${record.id}-desc`}>
        {stripNotionTag(record.description)}
      </span>,
      ctx.accountCell(record.accountId),
      <span className="expense-cell--unpaid num" key={`${record.id}-bal`}>
        {formatMoney(record.pasabuyBalance)}
      </span>,
      record.pasabuyer ?? "—",
      record.pasabuyStatus ?? "—",
      record.pasabuyDateOfPayment ? formatDate(record.pasabuyDateOfPayment) : "—",
      ctx.accountCell(record.pasabuyAccountReceiverId),
    ],
    // NOTE: 9 cells against 8 headers, and the total sits under "Pasabuyer" rather than
    // "Pasabuyer Balance". That misalignment is pre-existing and is reproduced here exactly —
    // it is tracked as its own bug, deliberately NOT fixed inside this refactor (plan §0.1).
    buildFooter: () => [
      [
        "Total",
        "",
        "",
        "",
        money(sum(ctx.enabledRecords, (r) => r.pasabuyBalance ?? 0)),
        "",
        "",
        "",
        "",
      ],
    ],
  };
}

function unpaidCcConfig(ctx: ExpenseTableContext): ExpenseTableConfig {
  return {
    showBulkCover: true,
    headers: [
      "Date",
      "Description",
      "Account",
      "Amount",
      "Category",
      "Interest",
      "Gross Amount",
      "Remaining Balance",
      "Payment Status",
      "Expected payment date",
      "Date Paid",
    ],
    buildRow: (record) => {
      const c = ctx.derive(record);
      return [
        formatDate(record.purchaseDate),
        <span className="expense-cell--unpaid" key={`${record.id}-desc`}>
          {stripNotionTag(record.description)}
        </span>,
        ctx.accountCell(record.accountId),
        <span className="expense-cell--unpaid num" key={`${record.id}-amt`}>
          {formatMoney(record.amount)}
        </span>,
        ctx.categoryCell(record.categoryId),
        money(record.interest ?? 0),
        money(c.gross),
        money(c.remaining),
        record.paymentStatus ?? "—",
        c.expected ? formatDate(c.expected) : "-",
        record.datePaid ? formatDate(record.datePaid) : "-",
      ];
    },
    buildFooter: () => [
      [
        "Total",
        "",
        "",
        money(sum(ctx.enabledRecords, (r) => r.amount)),
        "",
        money(sum(ctx.enabledRecords, (r) => r.interest ?? 0)),
        money(sum(ctx.enabledRecords, (r) => ctx.derive(r).gross)),
        money(sum(ctx.enabledRecords, (r) => ctx.derive(r).remaining)),
        "",
        "",
        "",
      ],
    ],
  };
}

function installmentsConfig(ctx: ExpenseTableContext): ExpenseTableConfig {
  return {
    headers: [
      "Date",
      "Description",
      "Account",
      "Amount",
      "Category",
      "Interest",
      "Gross Amount",
      "Period Count",
      "Installment Amount",
      "Paid Period",
      "Paid Amount",
      "Remaining Balance",
      "Payment Status",
      "Expected payment date",
      "Date Paid",
    ],
    buildRow: (record) => {
      const c = ctx.derive(record);
      return [
        formatDate(record.purchaseDate),
        stripNotionTag(record.description),
        ctx.accountCell(record.accountId),
        money(record.amount),
        ctx.categoryCell(record.categoryId),
        money(record.interest ?? 0),
        money(c.gross),
        record.periodCount ?? "—",
        c.installment != null ? money(c.installment) : "—",
        record.paidPeriod ?? "—",
        money(c.paid),
        <span className="num num--due">{formatMoney(c.remaining)}</span>,
        record.paymentStatus ?? "—",
        c.expected ? formatDate(c.expected) : "-",
        record.datePaid ? formatDate(record.datePaid) : "-",
      ];
    },
    buildFooter: () => [
      [
        "Total",
        "",
        "",
        money(sum(ctx.enabledRecords, (r) => r.amount)),
        "",
        money(sum(ctx.enabledRecords, (r) => r.interest ?? 0)),
        money(sum(ctx.enabledRecords, (r) => ctx.derive(r).gross)),
        "",
        "",
        "",
        money(sum(ctx.enabledRecords, (r) => ctx.derive(r).paid)),
        money(sum(ctx.enabledRecords, (r) => ctx.derive(r).remaining)),
        "",
        "",
        "",
      ],
    ],
  };
}

function defaultConfig(ctx: ExpenseTableContext): ExpenseTableConfig {
  return {
    headers: ["Date", "Description", "Amount", "Account", "Category", "Date Paid"],
    buildRow: (record) => {
      const isUnpaid = !record.datePaid;
      return [
        formatDate(record.purchaseDate),
        stripNotionTag(record.description),
        money(record.amount),
        ctx.accountCell(record.accountId),
        ctx.categoryCell(record.categoryId),
        record.datePaid ? formatDate(record.datePaid) : "-",
        // Unpaid rows grey out the description + amount columns only.
      ].map((cell, cellIndex) =>
        isUnpaid && (cellIndex === 1 || cellIndex === 2) ? (
          <span className="expense-cell--unpaid" key={`cell-${record.id}-${cellIndex}`}>
            {cell}
          </span>
        ) : (
          cell
        ),
      );
    },
    buildFooter: () => [
      ["Total", "", money(getExpenseTotal(ctx.enabledRecords)), "", "", ""],
    ],
  };
}

/**
 * Pick the table shape for a view mode. "Daily"/"Weekly"/"Monthly"/"Annually"/"To pay"/"To buy"
 * all share the default six-column layout, exactly as the original `: (` fallback branch did.
 */
export function getExpenseTableConfig(
  viewMode: ExpenseViewMode,
  ctx: ExpenseTableContext,
): ExpenseTableConfig {
  switch (viewMode) {
    case "Unpaid Pasabuy":
      return unpaidPasabuyConfig(ctx);
    case "Unpaid CC":
      return unpaidCcConfig(ctx);
    case "Installments":
      return installmentsConfig(ctx);
    default:
      return defaultConfig(ctx);
  }
}

/**
 * Derived credit/installment figures for one record, mirroring the form modal's math —
 * the producer of the `ExpenseComputed` values the CC and Installments tables render.
 * Takes an account lookup rather than the account list so callers keep the map they
 * already build for cell rendering.
 */
export function makeDeriveExpenseComputed(
  accountById: Map<string, Account>,
): (record: ExpenseRecord) => ExpenseComputed {
  return (record) => {
    const gross = calculateGrossPrice(record.amount, record.interest ?? 0);
    const installment = calculateInstallmentAmount({
      grossPrice: gross,
      paymentStatus: record.paymentStatus,
      periodCount: record.periodCount,
    });
    const paid = calculatePaidAmount({
      grossPrice: gross,
      paymentStatus: record.paymentStatus,
      installmentAmount: installment,
      paidPeriod: record.paidPeriod,
    });
    const remaining = calculateRemainingBalance(gross, paid);
    const account = accountById.get(record.accountId ?? "");
    const expected = calculateExpectedPaymentDate({
      purchaseDate: record.purchaseDate,
      billingDay: account?.billingDay ?? null,
      dueDay: account?.dueDay ?? null,
      periodCount: record.periodCount,
    });
    return { gross, installment, paid, remaining, expected };
  };
}
