// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { WorkflowPage } from "./workflow";
import type { WorkflowSectionId } from "@/types/finance";

const sourceAccount = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const destAccount = { ...sourceAccount, id: "acc2", name: "Savings Jar" };
const category = { id: "cat1", source: "Transfer", auxiliary: true, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const workflowRecord = {
  id: "wf1",
  name: "Weekly Transfer",
  date: "2026-07-10",
  grossIncome: 1000,
  capitalExpenditure: 0,
  accountId: "acc1",
  categoryId: "cat1",
  transactedAccountId: "acc2"
};

function renderWorkflow(section: WorkflowSectionId) {
  return renderPage(<WorkflowPage section={section} selectedMonth="2026-07" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => (ok([sourceAccount, destAccount]))) },
      categories: {
        income: vi.fn(async () => (ok([category]))),
        expense: vi.fn(async () => (ok([])))
      },
      incomes: { list: vi.fn(async () => (ok([workflowRecord]))) },
      expenses: { listForCCCoverage: vi.fn(async () => (ok([]))) }
    }
  });
}

const HEADERS_BY_SECTION: Record<WorkflowSectionId, string[]> = {
  transfer: ["Date", "Name", "Source Account", "Amount", "Transfer Account", "Transferred Amount"],
  "credit-card-payment": ["Date", "Name", "CC Account", "Amount", "Payer Account"],
  alkansya: ["Name", "Date", "Accounts", "Category", "Amount"],
  receivables: ["Name", "Date", "Receiving Account", "Category", "Amount"]
};

describe("WorkflowPage", () => {
  for (const [section, headers] of Object.entries(HEADERS_BY_SECTION) as Array<[WorkflowSectionId, string[]]>) {
    it(`renders the ${section} section with its own headers and the seeded record`, async () => {
      renderWorkflow(section);

      expect(await screen.findByText("Weekly Transfer")).toBeInTheDocument();

      const table = screen.getByRole("table");
      for (const header of headers) {
        expect(within(table).getByText(header)).toBeInTheDocument();
      }
    });
  }
});
