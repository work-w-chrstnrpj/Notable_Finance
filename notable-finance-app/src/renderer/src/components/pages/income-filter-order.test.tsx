// @vitest-environment jsdom
// Income lays out like Expense and the workflow pages: the period picker first, the filter row below it.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { IncomePage } from "./income";

describe("Income layout order", () => {
  it("the period picker comes before the filter row", async () => {
    renderPage(<IncomePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
      apiOverrides: {
        accounts: { list: vi.fn(async () => ok([account({ id: "a1", name: "Main Wallet", type: "Cash" })])) },
        categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
        incomes: { list: vi.fn(async () => ok([])) },
      },
    });
    await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    const picker = document.querySelector('[aria-label="Income view"]') as HTMLElement;
    const filters = document.querySelector(".toolbar-row") as HTMLElement;
    expect(picker).not.toBeNull();
    expect(filters).not.toBeNull();
    expect(picker.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
