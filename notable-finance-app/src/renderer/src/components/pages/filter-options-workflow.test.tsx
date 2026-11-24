// @vitest-environment jsdom
// filter-options/01: exclude options in the Transfer and CC Payment account filters.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { WorkflowPage } from "./workflow";
import type { WorkflowSectionId } from "@/types/finance";

const base = { icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, paymentNetwork: null, cardNumbers: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const wallet = { ...base, id: "acc1", name: "Main Wallet", type: "Cash" as const };
const jar = { ...base, id: "acc2", name: "Savings Jar", type: "Cash" as const };
const card = { ...base, id: "acc3", name: "Blue Card", type: "Credit Account" as const };
const category = { id: "cat1", source: "Transfer", auxiliary: true, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const rec = (id: string, name: string, accountId: string | null, transactedAccountId: string | null) =>
  ({ id, name, date: "2026-07-10", grossIncome: 100, capitalExpenditure: 0, accountId, categoryId: "cat1", transactedAccountId });

function render(section: WorkflowSectionId, records: ReturnType<typeof rec>[]) {
  renderPage(<WorkflowPage section={section} selectedMonth="2026-07" />, { apiOverrides: {
    accounts: { list: vi.fn(async () => ok([wallet, jar, card])) },
    categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([])) },
    incomes: { list: vi.fn(async () => ok(records)) },
    expenses: { listForCCCoverage: vi.fn(async () => ok([])) },
  } });
}
const open = async (name: string, first: string) => {
  expect(await screen.findByText(first)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  fireEvent.click(screen.getByRole("combobox", { name }));
};
const pick = (name: string) => fireEvent.click(screen.getByRole("option", { name }));

const transfers = [rec("t1", "Has target", "acc1", "acc2"), rec("t2", "No target", "acc1", null)];
const payments = [
  rec("p1", "Card with payer", "acc3", "acc1"),
  rec("p2", "Card no payer", "acc3", null),
  rec("p3", "Wallet as card", "acc1", "acc2"),
  rec("p4", "No card", null, "acc1"),
];

describe("filter-options/01 account filter exclude options", () => {
  it("filter-options/01#AC1 Transfer lists Exclude Empty Transfer Account first under the placeholder and hides records without one", async () => {
    render("transfer", transfers);
    await open("All Transfer Accounts", "No target");
    expect(screen.getAllByRole("option")[1]).toHaveTextContent("Exclude Empty Transfer Account");
    pick("Exclude Empty Transfer Account");
    expect(screen.getByText("Has target")).toBeInTheDocument();
    expect(screen.queryByText("No target")).not.toBeInTheDocument();
  });

  it("filter-options/01#AC2 CC Payment lists Exclude Non Credit Account first under the placeholder and keeps credit-account records only", async () => {
    render("credit-card-payment", payments);
    await open("All CC Accounts", "Wallet as card");
    expect(screen.getAllByRole("option")[1]).toHaveTextContent("Exclude Non Credit Account");
    pick("Exclude Non Credit Account");
    expect(screen.getByText("Card with payer")).toBeInTheDocument();
    expect(screen.getByText("Card no payer")).toBeInTheDocument();
    expect(screen.queryByText("Wallet as card")).not.toBeInTheDocument();
    expect(screen.queryByText("No card")).not.toBeInTheDocument();
  });

  it("filter-options/01#AC3 CC Payment lists Exclude Empty Payer Account first under the placeholder and hides records without a payer", async () => {
    render("credit-card-payment", payments);
    await open("All Payer Accounts", "Card no payer");
    expect(screen.getAllByRole("option")[1]).toHaveTextContent("Exclude Empty Payer Account");
    pick("Exclude Empty Payer Account");
    expect(screen.getByText("Card with payer")).toBeInTheDocument();
    expect(screen.queryByText("Card no payer")).not.toBeInTheDocument();
  });

  it("filter-options/01#AC4 combines with the other account filter", async () => {
    render("credit-card-payment", payments);
    await open("All Payer Accounts", "Card no payer");
    pick("Exclude Empty Payer Account");
    fireEvent.click(screen.getByRole("combobox", { name: "All CC Accounts" }));
    pick("Exclude Non Credit Account");
    expect(screen.getByText("Card with payer")).toBeInTheDocument();
    expect(screen.queryByText("Wallet as card")).not.toBeInTheDocument();
    expect(screen.queryByText("Card no payer")).not.toBeInTheDocument();
  });

  it("filter-options/01#AC5 closing the filters restores every record", async () => {
    render("transfer", transfers);
    await open("All Transfer Accounts", "No target");
    pick("Exclude Empty Transfer Account");
    expect(screen.queryByText("No target")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(screen.getByText("No target")).toBeInTheDocument();
  });

  it("filter-options/01#AC6 Transfer does not get the CC Payment options", async () => {
    render("transfer", transfers);
    await open("All Source Accounts", "No target");
    expect(screen.queryByRole("option", { name: "Exclude Non Credit Account" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Exclude Empty Payer Account" })).not.toBeInTheDocument();
  });
});
