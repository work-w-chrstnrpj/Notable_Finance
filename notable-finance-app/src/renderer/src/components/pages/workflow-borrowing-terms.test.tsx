// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { monthlyMonitoring } from "../../../../main/domain/derivations";
import { computed, openRecord, plainLoan, renderBorrowings, repayment, rowFor, termsLoan } from "./borrowing-terms-fixtures";

async function openBorrowForm() {
  await screen.findByText("Borrow: Ana");
  fireEvent.click(screen.getByRole("button", { name: /New Record/ }));
  fireEvent.click(screen.getByRole("button", { name: /Money you borrowed/ }));
  return screen.getByRole("dialog");
}
const setField = (dialog: HTMLElement, label: string, value: string) =>
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
async function chooseReceivedInto(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole("combobox", { name: "Received Into" }));
  fireEvent.click(await screen.findByRole("option", { name: "Main Wallet" }));
}

describe("borrowing-terms/03 Borrow form and table", () => {
  it("borrowing-terms/03#AC1 the Borrow form shows the optional terms and rejects Period count without Frequency (and the reverse)", async () => {
    const { create } = renderBorrowings([termsLoan]);
    const dialog = await openBorrowForm();
    for (const label of ["Interest", "Payment Frequency", "Period count"]) expect(within(dialog).getByText(label)).toBeInTheDocument();
    setField(dialog, "Amount", "1000");
    await chooseReceivedInto(dialog);

    setField(dialog, "Period count", "12");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect((await within(dialog).findAllByText("Choose a Payment Frequency for the Period count.")).length).toBeGreaterThan(0);

    setField(dialog, "Period count", "");
    setField(dialog, "Payment Frequency", "Monthly");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect((await within(dialog).findAllByText("Enter a Period count for the Payment Frequency.")).length).toBeGreaterThan(0);
    expect(create).not.toHaveBeenCalled();

    // All three empty is fine: terms are optional as a group.
    setField(dialog, "Payment Frequency", "");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({ interest: null, paymentFrequency: null, periodCount: null });
  });

  it("borrowing-terms/03#AC2 a 150,000 borrow with 5,000 interest, Monthly, 12 periods saves its terms and shows 155,000 owed and 12,916.67 suggested", async () => {
    const { create } = renderBorrowings([plainLoan]);
    const dialog = await (async () => { await screen.findByText("Borrow: Ben"); fireEvent.click(screen.getByRole("button", { name: /New Record/ })); fireEvent.click(screen.getByRole("button", { name: /Money you borrowed/ })); return screen.getByRole("dialog"); })();
    fireEvent.change(within(dialog).getByPlaceholderText("Borrowings title"), { target: { value: "Borrow: Ana" } });
    setField(dialog, "Amount", "150000");
    await chooseReceivedInto(dialog);
    setField(dialog, "Interest", "5000");
    setField(dialog, "Payment Frequency", "Monthly");
    setField(dialog, "Period count", "12");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({ grossIncome: -150000, interest: 5000, paymentFrequency: "Monthly", periodCount: 12 });

    const saved = await openRecord("Borrow: Ana");
    expect(computed(saved, "Total owed")).toBe("₱155,000.00");
    expect(computed(saved, "Suggested payment")).toBe("₱12,916.67");
  });

  it("borrowing-terms/03#AC3 the table shows Remaining balance for loans with terms and a dash for loans without", async () => {
    renderBorrowings([termsLoan, plainLoan]);
    await screen.findByText("Borrow: Ana");
    expect(within(screen.getByRole("table")).getByText("Remaining balance")).toBeInTheDocument();
    const lastCell = (name: string) => { const tds = Array.from(rowFor(name).querySelectorAll("td")); return tds[tds.length - 1].textContent; };
    expect(lastCell("Borrow: Ana")).toBe("₱155,000.00");
    expect(lastCell("Borrow: Ben")).toBe("—");
  });

  it("borrowing-terms/03#AC4 interest never appears in Expense totals, budgets or Monitoring", async () => {
    renderBorrowings([termsLoan]);
    // The Borrowings Net counts principal only; interest lives in Total owed and Remaining balance.
    await screen.findByText("Borrow: Ana");
    const footer = screen.getByRole("table").querySelector("tfoot") as HTMLElement;
    expect(footer.textContent).toContain("150,000.00");
    expect(footer.textContent).not.toContain("155,000.00");
    // Monitoring ignores the auxiliary Borrowed Money category, so a loan with interest adds no income or expense.
    const result = monthlyMonitoring("2026-07", {
      incomes: [{ ...termsLoan, deleted: false, isTransaction: true }],
      expenses: [], expenseCategories: [],
      incomeCategories: [{ id: "cat-borrow", source: "Borrowed Money", auxiliary: true }],
    } as never);
    expect(result.monthlyGrossIncome).toBe(0);
    expect(result.monthlyIncome).toBe(0);
    expect(JSON.stringify(result)).not.toContain("5000");
  });

  it("borrowing-terms/03#AC5 editing a loan's terms updates every figure and sends the new fields", async () => {
    const { update } = renderBorrowings([termsLoan, repayment("pay1", 12916.67)]);
    let dialog = await openRecord("Borrow: Ana");
    expect(computed(dialog, "Remaining balance")).toBe("₱142,083.33");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    setField(dialog, "Interest", "6000");
    setField(dialog, "Period count", "6");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][0]).toBe("loan1");
    expect(update.mock.calls[0][1]).toMatchObject({ interest: 6000, paymentFrequency: "Monthly", periodCount: 6 });

    await waitFor(() => expect(within(rowFor("Borrow: Ana")).getByText("₱143,083.33")).toBeInTheDocument());
    dialog = await openRecord("Borrow: Ana");
    expect(computed(dialog, "Total owed")).toBe("₱156,000.00");
    expect(computed(dialog, "Suggested payment")).toBe("₱26,000.00");
    expect(computed(dialog, "Remaining balance")).toBe("₱143,083.33");
  });
});
