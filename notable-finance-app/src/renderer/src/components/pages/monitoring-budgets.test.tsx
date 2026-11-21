// @vitest-environment jsdom
// Saved budgets on the Monitoring screen (tickets monthly-budget/03). Drives the page and the
// Edit / Save modals through the preload bridge mock, the same way the other page tests do.
import { afterEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok, err, installMockWindowApi } from "../../../../../test/mock-window-api";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import { MonthlyMonitoringPage } from "./monitoring";
import { EditBudgetsModal, ImportBudgetsModal, SaveBudgetsModal } from "./monitoring-budgets";
import type { SavedBudgetRow } from "@shared/saved-budgets";

const food = { id: "food", name: "Food", auxiliary: false, icon: null, monthlyBudget: 8000 };
const transport = { id: "transport", name: "Transport", auxiliary: false, icon: null, monthlyBudget: 2000 };
const aux = { id: "aux", name: "Transfer", auxiliary: true, icon: null, monthlyBudget: 0 };
const categories = [{ id: "food", name: "Food", monthlyBudget: 8000 }, { id: "transport", name: "Transport", monthlyBudget: 2000 }];

function savedRow(month: string, categoryId: string, budget: number, categoryName = categoryId): SavedBudgetRow {
  return { id: `${month}-${categoryId}`, month, categoryId, categoryName, budget, createdAt: 1, updatedAt: 1 };
}

const expense = (id: string, categoryId: string, amount: number, purchaseDate = "2026-01-10") => ({
  id, description: id, purchaseDate, datePaid: purchaseDate, amount, interest: 0, accountId: "a", categoryId,
  paymentStatus: "Paid", paymentFrequency: "Monthly", periodCount: 1, bnplAdjustment: null, paidPeriod: 1,
  pasabuyer: "", pasabuyStatus: null, pasabuyDateOfPayment: null, pasabuyPaidPeriod: 0, pasabuyAccountReceiverId: null,
  pasabuyBalance: 0, ccLinkPaymentReceiptId: null,
});

type Mode = "Monthly" | "Quarterly" | "Semi-Annually" | "Annually";
function renderMonitoring({ mode = "Monthly" as Mode, source = "notion", rows = [] as SavedBudgetRow[] } = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, monitoringBudgetSource: source, ...patch }));
  const list = vi.fn(async () => ok(rows));
  const utils = renderPage(<MonthlyMonitoringPage viewMode={mode} onViewModeChange={vi.fn()} selectedDate="2026-01-15" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([])) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([food, transport, aux])), pasabuyers: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: vi.fn(async () => ok([expense("lunch", "food", 1000), expense("bus", "transport", 300)])) },
      settings: {
        get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, monitoringBudgetSource: source })),
        update,
      },
      budgets: { list },
    } as never,
  });
  return { ...utils, update, list };
}

/** The Budget panel's table row for a category. */
async function budgetRow(name: string) {
  return await screen.findByRole("row", { name: new RegExp(`^${name}\\b`) });
}

afterEach(() => vi.restoreAllMocks());

describe("Monitoring budget source", () => {
  it("monthly-budget/03#AC1 Notion source shows the monthly budget times the months in each view mode", async () => {
    for (const [mode, months] of [["Monthly", 1], ["Quarterly", 4], ["Semi-Annually", 6], ["Annually", 12]] as const) {
      const { unmount } = renderMonitoring({ mode });
      const row = await budgetRow("Food");
      // ₱8,000 per month x months; remaining = budget - 1,000 spent.
      expect(row).toHaveTextContent(new RegExp(`${(8000 * months).toLocaleString("en-US")}\\.00`));
      expect(row).toHaveTextContent(new RegExp(`${(8000 * months - 1000).toLocaleString("en-US")}\\.00`));
      expect(screen.getByText("Notion budgets")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Edit budgets/ })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("monthly-budget/03#AC3 Saved source with some months saved shows the partial-coverage badge and uses Notion for the rest", async () => {
    renderMonitoring({ mode: "Quarterly", source: "saved", rows: [savedRow("2026-01", "food", 5000), savedRow("2026-01", "transport", 1000)] });
    expect(await screen.findByText("Saved budgets: 1 of 4 months")).toBeInTheDocument();
    const row = await budgetRow("Food");
    // Jan saved 5,000 + Feb to Apr Notion 3 x 8,000 = 29,000. No muted Notion line under the figure.
    expect(row).toHaveTextContent("29,000.00");
    expect(row).not.toHaveTextContent("Notion");
  });

  it("monthly-budget/03#AC3 says so when no month has saved budgets, and keeps Notion figures", async () => {
    renderMonitoring({ source: "saved" });
    expect(await screen.findByText("No budget saved")).toBeInTheDocument();
    expect(await budgetRow("Food")).toHaveTextContent("8,000.00");
  });

  it("monthly-budget/03#AC3 says Saved budgets when every month in the range has a set", async () => {
    renderMonitoring({ source: "saved", rows: [savedRow("2026-01", "food", 5000)] });
    expect(await screen.findByText("Saved budgets")).toBeInTheDocument();
  });

  it("monthly-budget/02#AC5 monthly-budget/03#AC9 a category missing from a saved month counts as 0 and the totals follow", async () => {
    renderMonitoring({ source: "saved", rows: [savedRow("2026-01", "food", 5000)] });
    const transportRow = await budgetRow("Transport");
    // Budget 0, spent 300, remaining -300.
    expect(transportRow).toHaveTextContent("0.00");
    expect(transportRow).toHaveTextContent("-₱300.00");
    // The Budget panel total is 5,000 (Food only) with 1,300 spent; the Income table has its own Total row.
    const totals = await screen.findAllByRole("row", { name: /^Total/ });
    const budgetTotal = totals.find((row) => row.textContent?.includes("5,000.00"));
    expect(budgetTotal).toBeDefined();
    expect(budgetTotal).toHaveTextContent("1,300.00");
    expect(budgetTotal).toHaveTextContent("3,700.00");
  });

  it("monthly-budget/03#AC9 the zero-budget filter uses the resolved budgets", async () => {
    renderMonitoring({ source: "saved", rows: [savedRow("2026-01", "food", 5000)] });
    await budgetRow("Transport");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "hide-budget" } });
    await waitFor(() => expect(screen.queryByRole("row", { name: /^Transport\b/ })).not.toBeInTheDocument());
    expect(screen.getByRole("row", { name: /^Food\b/ })).toBeInTheDocument();
  });

  it("monthly-budget/03#AC10 choosing Saved stores the setting so it survives a restart", async () => {
    const { update } = renderMonitoring();
    const group = await screen.findByLabelText("Budget source");
    fireEvent.click(within(group).getByRole("button", { name: "Saved" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ monitoringBudgetSource: "saved" }));
  });
});

describe("Save budgets for this month", () => {
  it("monthly-budget/03#AC4 saves a month without asking when it has no set", async () => {
    const saveFromNotion = vi.fn(async () => ok({ saved: 2 }));
    renderPage(<SaveBudgetsModal defaultMonth="2026-03" onClose={vi.fn()} onSaved={vi.fn()} />, {
      apiOverrides: { budgets: { list: vi.fn(async () => ok([])), saveFromNotion } } as never,
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Save budgets/ }));
    await waitFor(() => expect(saveFromNotion).toHaveBeenCalledWith("2026-03", true));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("monthly-budget/03#AC4 asks 'Replace the saved budgets for <Month Year>?' and does nothing on Cancel", async () => {
    const saveFromNotion = vi.fn(async () => ok({ saved: 2 }));
    renderPage(<SaveBudgetsModal defaultMonth="2026-03" onClose={vi.fn()} onSaved={vi.fn()} />, {
      apiOverrides: { budgets: { list: vi.fn(async () => ok([savedRow("2026-03", "food", 1)])), saveFromNotion } } as never,
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /Save budgets/ }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith("Replace the saved budgets for March 2026?"));
    expect(saveFromNotion).not.toHaveBeenCalled();
  });
});

describe("Edit budgets", () => {
  function renderEdit(rows: SavedBudgetRow[], extra: Record<string, unknown> = {}) {
    const saveSet = vi.fn(async () => ok({ saved: 2 }));
    const deleteSet = vi.fn(async () => ok({ deleted: 2 }));
    const onChanged = vi.fn();
    const onClose = vi.fn();
    renderPage(
      <EditBudgetsModal months={["2026-01", "2026-02"]} defaultMonth="2026-01" categories={categories} onClose={onClose} onChanged={onChanged} />,
      { apiOverrides: { budgets: { list: vi.fn(async () => ok(rows)), saveSet, deleteSet, ...extra } } as never },
    );
    return { saveSet, deleteSet, onChanged, onClose };
  }

  it("monthly-budget/03#AC5 shows one input per category with the Notion budget as a muted reference", async () => {
    renderEdit([savedRow("2026-01", "food", 5000), savedRow("2026-01", "transport", 1000)]);
    expect(await screen.findByLabelText("Food")).toHaveValue("5000");
    expect(screen.getByLabelText("Transport")).toHaveValue("1000");
    expect(screen.getByText("Notion ₱8,000.00")).toBeInTheDocument();
    for (const name of ["Fill from Notion", "Delete saved budgets for this month", "Save", "Cancel"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("monthly-budget/03#AC5 Fill from Notion puts today's budgets in the inputs without saving", async () => {
    const { saveSet } = renderEdit([savedRow("2026-01", "food", 5000), savedRow("2026-01", "transport", 1000)]);
    await screen.findByLabelText("Food");
    fireEvent.click(screen.getByRole("button", { name: "Fill from Notion" }));
    expect(screen.getByLabelText("Food")).toHaveValue("8000");
    expect(screen.getByLabelText("Transport")).toHaveValue("2000");
    expect(saveSet).not.toHaveBeenCalled();
  });

  it("monthly-budget/03#AC5 a month with no saved set starts from Notion budgets and says nothing is saved yet", async () => {
    renderEdit([]);
    expect(await screen.findByLabelText("Food")).toHaveValue("8000");
    expect(screen.getByText(/nothing is\s+saved until you press Save/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete saved budgets for this month" })).not.toBeInTheDocument();
  });

  it("monthly-budget/03#AC6 invalid input blocks Save and shows error text", async () => {
    const { saveSet } = renderEdit([savedRow("2026-01", "food", 5000)]);
    fireEvent.change(await screen.findByLabelText("Food"), { target: { value: "-5" } });
    fireEvent.change(screen.getByLabelText("Transport"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findAllByText("Enter a number of 0 or more (up to 2 decimals).")).toHaveLength(2);
    expect(saveSet).not.toHaveBeenCalled();
  });

  it("monthly-budget/03#AC6 an empty field is invalid, not 0", async () => {
    const { saveSet } = renderEdit([savedRow("2026-01", "food", 5000)]);
    fireEvent.change(await screen.findByLabelText("Food"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findAllByText(/Enter a number/)).toHaveLength(1);
    expect(saveSet).not.toHaveBeenCalled();
  });

  it("monthly-budget/03#AC6 a valid Save writes the whole set at once, tolerating commas, and closes", async () => {
    const { saveSet, onChanged, onClose } = renderEdit([savedRow("2026-01", "food", 5000)]);
    fireEvent.change(await screen.findByLabelText("Food"), { target: { value: "5,500.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(saveSet).toHaveBeenCalledTimes(1));
    expect(saveSet).toHaveBeenCalledWith("2026-01", [
      { categoryId: "food", categoryName: "Food", budget: 5500.5 },
      { categoryId: "transport", categoryName: "Transport", budget: 0 },
    ]);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onChanged).toHaveBeenCalled();
  });

  it("monthly-budget/03#AC6 shows the error when the write fails and stays open", async () => {
    const { onClose } = renderEdit([savedRow("2026-01", "food", 5000)], { saveSet: vi.fn(async () => err("E_VALIDATION", "Budget for Food cannot be negative")) });
    await screen.findByLabelText("Food"); // wait for the set to load; Save is disabled until then
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Budget for Food cannot be negative")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("monthly-budget/03#AC7 Delete asks 'Delete saved budgets for <Month Year>?' and only deletes on yes", async () => {
    const { deleteSet, onChanged } = renderEdit([savedRow("2026-01", "food", 5000)]);
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const button = await screen.findByRole("button", { name: "Delete saved budgets for this month" });
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledWith("Delete saved budgets for January 2026?");
    expect(deleteSet).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(deleteSet).toHaveBeenCalledWith("2026-01"));
    expect(onChanged).toHaveBeenCalled();
  });

  it("monthly-budget/03#AC5 the month picker is limited to the months in the range", async () => {
    renderEdit([]);
    const picker = (await screen.findByRole("combobox")) as HTMLSelectElement;
    expect([...picker.options].map((o) => o.value)).toEqual(["2026-01", "2026-02"]);
  });
});

describe("review fixes", () => {
  it("Edit budgets keeps what the user typed when the page re-renders with an equal category list", async () => {
    const list = vi.fn(async () => ok([savedRow("2026-01", "food", 5000)]));
    installMockWindowApi({ budgets: { list } } as never);
    const modal = (cats: typeof categories) => (
      <EditBudgetsModal months={["2026-01"]} defaultMonth="2026-01" categories={cats} onClose={vi.fn()} onChanged={vi.fn()} />
    );
    const view = render(modal(categories.map((c) => ({ ...c }))));
    const input = await screen.findByLabelText("Food");
    fireEvent.change(input, { target: { value: "7777" } });
    // The Monitoring page rebuilds the category array on every render: same content, new identity.
    view.rerender(modal(categories.map((c) => ({ ...c }))));
    view.rerender(modal(categories.map((c) => ({ ...c }))));
    expect(screen.getByLabelText("Food")).toHaveValue("7777");
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("Import opens the file dialog once even when React StrictMode runs effects twice", async () => {
    const importPreview = vi.fn(async () => ok(null));
    installMockWindowApi({ budgets: { importPreview } } as never);
    render(
      <StrictMode>
        <ImportBudgetsModal onClose={vi.fn()} onImported={vi.fn()} />
      </StrictMode>,
    );
    await waitFor(() => expect(importPreview).toHaveBeenCalled());
    expect(importPreview).toHaveBeenCalledTimes(1);
  });

  it("a saved budget sorts as a number in the table", async () => {
    renderMonitoring({ mode: "Quarterly", source: "saved", rows: [savedRow("2026-01", "food", 5000), savedRow("2026-01", "transport", 1000)] });
    await budgetRow("Food");
    fireEvent.click(screen.getByRole("button", { name: /Quarterly Budget/ }));
    const names = () => screen.getAllByRole("row").map((r) => r.textContent ?? "").filter((t) => /^(Food|Transport)/.test(t)).map((t) => t.slice(0, 4));
    // Food 29,000 vs Transport 7,000: ascending puts Transport first, which a text sort of "₱29…" / "₱7…" would reverse.
    await waitFor(() => expect(names()[0]).toBe("Tran"));
  });
});

describe("Import budgets screen", () => {
  const preview = (writable: number) => ({
    previewId: "p1",
    fileName: "budgets.csv",
    policy: "overwrite" as const,
    counts: { new: writable, changed: 0, unchanged: 0, skipped: 0, invalid: 1 },
    rows: [
      { line: 2, month: "2026-01", category: "Nope", budget: 5, status: "invalid" as const, reason: 'Unknown category "Nope"' },
      ...(writable ? [{ line: 3, month: "2026-01", category: "Food", budget: 100, status: "new" as const }] : []),
    ],
    truncated: false,
    writable,
  });

  it("monthly-budget/04#AC5 monthly-budget/04#AC8 lists invalid rows with their reason, and disables Import when nothing is valid", async () => {
    renderPage(<ImportBudgetsModal onClose={vi.fn()} onImported={vi.fn()} />, {
      apiOverrides: { budgets: { importPreview: vi.fn(async () => ok(preview(0))) } } as never,
    });
    expect(await screen.findByText(/Unknown category "Nope"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import 0 rows" })).toBeDisabled();
  });

  it("monthly-budget/04#AC6 monthly-budget/04#AC7 imports the valid rows with the chosen policy", async () => {
    const importCommit = vi.fn(async () => ok({ written: 1, months: 1 }));
    const importPreview = vi.fn(async () => ok(preview(1)));
    const onImported = vi.fn();
    renderPage(<ImportBudgetsModal onClose={vi.fn()} onImported={onImported} />, {
      apiOverrides: { budgets: { importPreview, importCommit } } as never,
    });
    fireEvent.click(await screen.findByRole("button", { name: "Skip those months" }));
    await waitFor(() => expect(importPreview).toHaveBeenLastCalledWith({ previewId: "p1", policy: "skip-existing-months" }));
    fireEvent.click(screen.getByRole("button", { name: "Import 1 rows" }));
    await waitFor(() => expect(importCommit).toHaveBeenCalledWith({ previewId: "p1", policy: "skip-existing-months" }));
    expect(onImported).toHaveBeenCalled();
  });

  it("closes without importing when the user cancels the file dialog", async () => {
    const onClose = vi.fn();
    renderPage(<ImportBudgetsModal onClose={onClose} onImported={vi.fn()} />, {
      apiOverrides: { budgets: { importPreview: vi.fn(async () => ok(null)) } } as never,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
