// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import { ExpensePage } from "./expense";
import { normalizeUiSettings } from "../../../../main/settings/ui";

const ok = <T,>(data: T) => ({ ok: true as const, data });
const settings = { get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, hiddenExpenseViews: ["Pasabuy", "Installments"] })), update: vi.fn(async () => ok(DEFAULT_SETTINGS)) };
const api = {
  accounts: { list: vi.fn(async () => ok([])) },
  categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
  expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
};

describe("expense-views/01 hide Expense views from Settings", () => {
  it("expense-views/01#AC2 hidden views drop out of the picker and the rest stay", async () => {
    renderPage(<ExpensePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
      apiOverrides: { ...api, settings } as never,
    });
    await screen.findByLabelText("Expense view");
    const read = () => within(screen.getByLabelText("Expense view")).getAllByRole("button").map((b) => b.textContent);
    await waitFor(() => expect(read()).not.toContain("Pasabuy"));
    const labels = read();
    expect(labels).not.toContain("Installments");
    expect(labels).toEqual(expect.arrayContaining(["CC Transactions", "To Pay", "To Buy"]));
  });

  it("expense-views/01#AC3 saved settings keep only known view names", () => {
    const s = normalizeUiSettings({ hiddenExpenseViews: ["To pay", "Nope"] });
    expect(s.hiddenExpenseViews).toEqual(["To pay"]);
    expect(normalizeUiSettings({}).hiddenExpenseViews).toEqual([]);
  });
});
