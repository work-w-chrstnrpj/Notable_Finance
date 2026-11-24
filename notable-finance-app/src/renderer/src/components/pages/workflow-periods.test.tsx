// @vitest-environment jsdom
// calendar-periods/04: the five workflow pages share the seven-period picker (fixed quarters and halves, ADR-0012).
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { WorkflowPage } from "./workflow";
import type { IncomeViewMode, WorkflowSectionId } from "@/types/finance";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, paymentNetwork: null, cardNumbers: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };

// Every workflow page reads window.api.incomes.list with its own `view`.
const API_BY_SECTION: Record<WorkflowSectionId, string> = {
  transfer: "transfers",
  "credit-card-payment": "creditCardPayments",
  alkansya: "alkansya",
  borrowings: "borrowings",
  receivables: "receivables",
};
const SECTIONS = Object.keys(API_BY_SECTION) as WorkflowSectionId[];
const SEVEN = ["Daily", "Weekly", "Monthly", "Quarterly", "Semi-Annually", "Annually", "All Records"];

function renderWorkflow(section: WorkflowSectionId, viewMode: IncomeViewMode, selectedDate = "2026-11-15", onViewModeChange = vi.fn()) {
  const list = vi.fn(async () => ok([]));
  renderPage(
    <WorkflowPage section={section} selectedMonth={selectedDate.slice(0, 7)} selectedDate={selectedDate} viewMode={viewMode} onViewModeChange={onViewModeChange} />,
    {
      apiOverrides: {
        accounts: { list: vi.fn(async () => ok([account])) },
        categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
        incomes: { list },
        expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
      },
    },
  );
  return { list, onViewModeChange, view: API_BY_SECTION[section] };
}

const picker = () => document.querySelector('[aria-label$=" view"]') as HTMLElement;
const labels = () => [...picker().querySelectorAll("button")].map((b) => b.textContent?.trim() ?? "");

describe("calendar-periods/04 workflow pages", () => {
  for (const section of SECTIONS) {
    it(`calendar-periods/04#AC1 ${section} shows the seven periods in order`, async () => {
      renderWorkflow(section, "Monthly");
      await waitFor(() => expect(picker()).not.toBeNull());
      const found = labels();
      expect(found.slice(0, 7).map((l, i) => l.startsWith(SEVEN[i]))).toEqual(Array(7).fill(true));
      if (section !== "borrowings") expect(found).toHaveLength(7);
    });

    it(`calendar-periods/04#AC2 ${section} asks for the fixed calendar quarter and half`, async () => {
      const q = renderWorkflow(section, "Quarterly", "2026-11-15");
      await waitFor(() => expect(q.list).toHaveBeenCalled());
      expect(q.list).toHaveBeenCalledWith(expect.objectContaining({ view: q.view, rangeStart: "2026-10-01", rangeEnd: "2026-12-31" }));
    });

    it(`calendar-periods/04#AC2 ${section} Semi-Annually asks for the whole half`, async () => {
      const h = renderWorkflow(section, "Semi-Annually", "2026-02-10");
      await waitFor(() => expect(h.list).toHaveBeenCalled());
      expect(h.list).toHaveBeenCalledWith(expect.objectContaining({ view: h.view, rangeStart: "2026-01-01", rangeEnd: "2026-06-30" }));
    });
  }

  it("calendar-periods/04#AC3 an empty page names the fixed period in its label", async () => {
    renderWorkflow("transfer", "Quarterly", "2026-11-15");
    expect((await screen.findAllByText(/Q4 2026 · Oct – Dec/)).length).toBeGreaterThan(0);
    cleanup();
    renderWorkflow("alkansya", "Semi-Annually", "2026-11-15");
    expect(await screen.findAllByText(/H2 2026 · Jul – Dec/)).not.toHaveLength(0);
  });

  it("calendar-periods/04#AC4 choosing a new period reports it so the workspace can remember it", async () => {
    const { onViewModeChange } = renderWorkflow("transfer", "Monthly");
    await waitFor(() => expect(picker()).not.toBeNull());
    fireEvent.click([...picker().querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith("Quarterly"))!);
    expect(onViewModeChange).toHaveBeenCalledWith("Quarterly");
    fireEvent.click([...picker().querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith("Semi-Annually"))!);
    expect(onViewModeChange).toHaveBeenCalledWith("Semi-Annually");
  });

  it("calendar-periods/04#AC5 the existing periods still ask for the ranges they always did", async () => {
    const m = renderWorkflow("transfer", "Monthly", "2026-11-15");
    await waitFor(() => expect(m.list).toHaveBeenCalled());
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ view: m.view, rangeStart: "2026-11-01", rangeEnd: "2026-11-30" }));
  });

  it("calendar-periods/04#AC5 All Records asks with no date range", async () => {
    const a = renderWorkflow("transfer", "All Records", "2026-11-15");
    await waitFor(() => expect(a.list).toHaveBeenCalled());
    const calls = (a.list.mock.calls as unknown[][]).map((c) => c[0] as Record<string, unknown>).filter((p) => p?.view === a.view);
    expect(calls.length).toBeGreaterThan(0);
    for (const params of calls) {
      expect(params.rangeStart).toBeUndefined();
      expect(params.rangeEnd).toBeUndefined();
    }
  });
});
