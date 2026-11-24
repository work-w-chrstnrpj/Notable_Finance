// @vitest-environment jsdom
// table-resize/01: hover-only column resizing across Money movement tables.
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { DataTable } from "../ui/data-table";
import { IncomePage } from "./income";
import { WorkflowPage } from "./workflow";
import type { WorkflowSectionId } from "@/types/finance";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, paymentNetwork: null, cardNumbers: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", source: "Transfer", auxiliary: true, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const record = { id: "r1", name: "Sample", date: "2026-07-10", grossIncome: 1000, capitalExpenditure: 0, accountId: "acc1", categoryId: "cat1", transactedAccountId: "acc1" };
const overrides = {
  accounts: { list: vi.fn(async () => ok([account])) },
  categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([])) },
  incomes: { list: vi.fn(async () => ok([record])) },
  expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
};
// jsdom has no PointerEvent; a MouseEvent with a pointerId is enough for the resize handler.
if (typeof window.PointerEvent === "undefined") {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  Object.defineProperty(window, "PointerEvent", { value: TestPointerEvent, configurable: true });
}
const separators = () => screen.queryAllByRole("separator");

describe("table-resize/01", () => {
  it("table-resize/01#AC1 Income and every Money movement records table have resizable columns", async () => {
    const income = renderPage(<IncomePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, { apiOverrides: overrides });
    await screen.findByText("Sample");
    expect(separators()).toHaveLength(7);
    income.unmount();

    const sections: WorkflowSectionId[] = ["transfer", "credit-card-payment", "alkansya", "borrowings", "receivables"];
    for (const section of sections) {
      const view = renderPage(<WorkflowPage section={section} selectedMonth="2026-07" />, { apiOverrides: overrides });
      await screen.findByText("Sample");
      expect(separators().length, section).toBeGreaterThan(3);
      view.unmount();
    }
  });

  it("table-resize/01#AC6 the Borrow Account table in Borrowings has no resize handles", async () => {
    renderPage(<WorkflowPage section="borrowings" selectedMonth="2026-07" />, { apiOverrides: overrides });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("button", { name: "Borrowed Accounts" }));
    await screen.findByText(/No Borrow accounts|Borrow Account/);
    expect(separators()).toHaveLength(0);
  });

  const renderTable = () =>
    render(<DataTable resizable headers={["Name", "Amount"]} rows={[["A", "1"]]} />);

  it("table-resize/01#AC3 dragging the handle changes the column width and never goes below 96px", () => {
    renderTable();
    const handle = screen.getAllByRole("separator")[1] as HTMLElement;
    const start = Number(handle.getAttribute("aria-valuenow"));
    Object.assign(handle, { setPointerCapture: vi.fn(), hasPointerCapture: () => true });
    const pointer = (type: string, x: number) => {
      fireEvent[type as "pointerDown"](handle, { clientX: x, button: 0, pointerId: 1 });
    };
    pointer("pointerDown", 100);
    pointer("pointerMove", 140);
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(start + 40);
    pointer("pointerMove", -1000);
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(96);
  });

  it("table-resize/01#AC4 the arrow keys resize a focused handle by 16px", () => {
    renderTable();
    const handle = screen.getAllByRole("separator")[1] as HTMLElement;
    const start = Number(handle.getAttribute("aria-valuenow"));
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(start + 16);
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(start - 16);
    expect(handle.tabIndex).toBe(0);
  });

  it("table-resize/01#AC5 sorting and row clicks still work on a resizable table", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable resizable headers={["Name", "Amount"]} recordIds={["a", "b"]} onRowClick={onRowClick}
        rows={[["Beta", "2"], ["Alpha", "1"]]} />,
    );
    const body = () => within(screen.getAllByRole("rowgroup")[1] as HTMLElement).getAllByRole("row");
    expect(body()[0]).toHaveTextContent("Beta");
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(body()[0]).toHaveTextContent("Alpha");
    fireEvent.click(body()[0] as HTMLElement);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0]![0]).toBe("b");
  });

  const css = readFileSync(join(__dirname, "../ui/data-table.module.css"), "utf8");
  const rule = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    return css.slice(start, css.indexOf("}", start));
  };

  it("table-resize/01#AC2 the line is transparent at rest and shows on hover and keyboard focus", () => {
    expect(rule(".column-resize::after")).toContain("background: transparent");
    expect(rule(".column-resize:hover::after,\n.column-resize:focus-visible::after,\n.column-resize:active::after")).toContain("var(--accent)");
    expect(rule(".column-resize")).toContain("cursor: col-resize");
  });

  it("table-resize/01#AC7 the handle is hidden on touch-only devices", () => {
    expect(css).toMatch(/@media \(hover: none\) \{\s*\.column-resize \{\s*display: none;/);
  });
});
