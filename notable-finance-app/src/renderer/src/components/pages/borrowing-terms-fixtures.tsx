// Shared fixtures for the Borrowings loan-terms screen tests (borrowing-terms/03 and /04).
import { vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { WorkflowPage } from "./workflow";

const baseAccount = { icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
export const wallet = { ...baseAccount, id: "acc1", name: "Main Wallet", type: "Cash" as const };
export const borrowAccount = { ...baseAccount, id: "acc9", name: "Debt/Loan", type: "Auxiliary" as const };
export const otherBorrowAccount = { ...baseAccount, id: "acc8", name: "Borrowed Ana", type: "Auxiliary" as const };
export const borrowedCategory = { id: "cat-borrow", source: "Borrowed Money", auxiliary: true, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };

type Row = Record<string, unknown> & { id: string };
const row = (r: Row): Row => ({ capitalExpenditure: 0, categoryId: "cat-borrow", date: "2026-07-10", ...r });

/** 150,000 borrowed with 5,000 interest, Monthly, 12 periods. */
export const termsLoan = row({ id: "loan1", name: "Borrow: Ana", grossIncome: -150000, accountId: "acc9", transactedAccountId: "acc1", interest: 5000, paymentFrequency: "Monthly", periodCount: 12 });
/** A plain borrowing without Loan terms. */
export const plainLoan = row({ id: "plain1", name: "Borrow: Ben", grossIncome: -1000, accountId: "acc9", transactedAccountId: "acc1" });
/** A loan with terms on a different Borrow account. */
export const otherAccountLoan = row({ id: "loan2", name: "Borrow: Cara", grossIncome: -20000, accountId: "acc8", transactedAccountId: "acc1", interest: 1000, paymentFrequency: "Monthly", periodCount: 4 });
export const repayment = (id: string, amount: number, extra: Record<string, unknown> = {}) =>
  row({ id, name: `Repayment: ${id}`, grossIncome: -amount, accountId: "acc1", transactedAccountId: "acc9", linkedBorrowingId: "loan1", ...extra });

/** Render Borrowings over a mutable in-memory list; create/update/list act on it. */
export function renderBorrowings(initial: Row[], accounts = [wallet, borrowAccount, otherBorrowAccount]) {
  const store = [...initial];
  const create = vi.fn(async (input: Record<string, unknown>) => {
    const record = row({ id: `new${store.length}`, ...input });
    store.unshift(record);
    return ok(record);
  });
  const update = vi.fn(async (id: string, patch: Record<string, unknown>) => {
    const i = store.findIndex((r) => r.id === id);
    store[i] = { ...store[i], ...patch };
    return ok(store[i]);
  });
  const view = renderPage(
    <WorkflowPage section="borrowings" selectedMonth="2026-07" selectedDate="2026-07-11" viewMode="All Records" onViewModeChange={vi.fn()} />,
    { apiOverrides: {
      accounts: { list: vi.fn(async () => ok(accounts)) },
      categories: { income: vi.fn(async () => ok([borrowedCategory])), expense: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok(store.map((r) => ({ ...r })))), create, update },
      expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
    } as never },
  );
  return { ...view, create, update, store };
}

export const rowFor = (name: string) => screen.getByText(name).closest("tr") as HTMLElement;
/** The value shown next to a computed field label inside a dialog. */
export const computed = (dialog: HTMLElement, label: string) => within(dialog).getByText(label).parentElement!.querySelector("strong")!.textContent;
export async function openRecord(name: string) {
  await screen.findByText(name);
  fireEvent.click(rowFor(name));
  return screen.findByRole("dialog");
}
