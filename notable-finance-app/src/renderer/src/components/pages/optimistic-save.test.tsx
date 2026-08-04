// @vitest-environment jsdom
// Pins the optimistic-save behaviour that income.tsx/expense.tsx/workflow.tsx each currently
// reimplement separately (refactor_development_plan.md F2) — modal closes before the request
// fires, a pending row appears immediately, and it's either replaced by the server record or
// rolled back with a failure notice. Phase 3's use-optimistic-records extraction must keep this
// exact sequence. Exercised against IncomePage as the representative implementation.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderPage } from "../../../../../test/render-page";
import { deferred } from "../../../../../test/deferred";
import { ok, err } from "../../../../../test/mock-window-api";
import { IncomePage } from "./income";
import type { ApiResult, IncomeRecordDto } from "@shared/finance.types";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", source: "Salary", auxiliary: false, icon: null };

type CreateResult = ApiResult<IncomeRecordDto>;

async function openNewIncomeAndFill(name: string) {
  const user = userEvent.setup();
  await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
  fireEvent.click(screen.getByRole("button", { name: /New Income/i }));
  // Field labels render a trailing, aria-hidden " *" for required fields — present in
  // textContent, so an exact-string label match fails. Match by prefix instead.
  await user.type(screen.getByLabelText(/^Name/), name);
  fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: "2026-07-20" } });
  return user;
}

describe("Income optimistic save", () => {
  it("shows a pending row immediately, then replaces it with the saved record", async () => {
    const create = deferred<CreateResult>();
    // Stateful: after save resolves, `invalidateIncomeFamily()` triggers a refetch — a static
    // mock would return the original empty list again and wipe the just-saved row right back out.
    const records: IncomeRecordDto[] = [];

    renderPage(<IncomePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account]))) },
        categories: {
          income: vi.fn(async () => (ok([category]))),
          expense: vi.fn(async () => (ok([])))
        },
        incomes: {
          list: vi.fn(async () => (ok(records))),
          create: vi.fn(() => create.promise)
        }
      }
    });

    const user = await openNewIncomeAndFill("Freelance Gig");
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    // Modal closes before the create request resolves. ("New Income" text alone isn't a safe
    // signal — it's also the always-present toolbar button's label.)
    await waitFor(() => expect(screen.queryByLabelText(/^Name/)).not.toBeInTheDocument());

    // Optimistic row appears immediately, marked pending.
    const pendingCell = await screen.findByText("Freelance Gig");
    const pendingRow = pendingCell.closest("tr");
    expect(pendingRow).not.toBeNull();
    expect(pendingRow).toHaveClass("record-pending");

    // Server confirms — the row is replaced (no longer pending) and shows the real record.
    const saved = {
      id: "real-id-1",
      name: "Freelance Gig",
      date: "2026-07-20",
      grossIncome: 0,
      capitalExpenditure: 0,
      accountId: null,
      categoryId: ""
    };
    records.push(saved);
    create.resolve(ok(saved));

    await waitFor(() => {
      const cell = screen.getByText("Freelance Gig");
      expect(cell.closest("tr")).not.toHaveClass("record-pending");
    });
  });

  it("rolls back the pending row and shows a failure notice when save fails", async () => {
    const create = deferred<CreateResult>();

    renderPage(<IncomePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account]))) },
        categories: {
          income: vi.fn(async () => (ok([category]))),
          expense: vi.fn(async () => (ok([])))
        },
        incomes: {
          list: vi.fn(async () => (ok([]))),
          create: vi.fn(() => create.promise)
        }
      }
    });

    const user = await openNewIncomeAndFill("Doomed Entry");
    await user.click(screen.getByRole("button", { name: /^Save$/ }));

    await screen.findByText("Doomed Entry");

    create.resolve(err("E_TEST", "boom"));

    await waitForElementToBeRemoved(() => screen.queryByText("Doomed Entry"));
    expect(await screen.findByText("Save failed: boom")).toBeInTheDocument();
  });
});
