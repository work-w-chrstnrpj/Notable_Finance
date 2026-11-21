// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { borrowAccount, computed, openRecord, otherBorrowAccount, plainLoan, renderBorrowings, repayment, rowFor, termsLoan, wallet } from "./borrowing-terms-fixtures";

const loanSelect = (dialog: HTMLElement) => within(dialog).getByLabelText("Loan") as HTMLSelectElement;
const lastCell = (name: string) => { const cells = Array.from(rowFor(name).querySelectorAll("td")); return cells[cells.length - 1].textContent; };
const PAYMENTS_PLACEHOLDER = "Search repayments to link...";
const paymentsInput = (dialog: HTMLElement) => within(dialog).getByPlaceholderText(PAYMENTS_PLACEHOLDER);
/** Pick a repayment in the Payments multi-select (same interaction as Covered Expenses on CC Payment). */
function pickPayment(dialog: HTMLElement, label: RegExp) {
  fireEvent.focus(paymentsInput(dialog));
  fireEvent.mouseDown(within(dialog).getByText(label).closest("button") as HTMLElement);
}
const editLoan = (dialog: HTMLElement) => fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
const save = (dialog: HTMLElement) => fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
const plainPayment = (id: string, amount: number, extra: Record<string, unknown> = {}) => repayment(id, amount, { linkedBorrowingId: "plain1", ...extra });

describe("borrowing-terms/07 two-way loan links", () => {
  it("borrowing-terms/07#AC1 a repayment can be linked to a loan that has no terms from the repayment form", async () => {
    const { create } = renderBorrowings([plainLoan]);
    await screen.findByText("Borrow: Ben");
    fireEvent.click(screen.getByRole("button", { name: /New Record/ }));
    fireEvent.click(screen.getByRole("button", { name: /Repayment/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("combobox", { name: /Borrow Account|Debt\/Loan|Borrowed Ana/ }));
    fireEvent.click(await screen.findByRole("option", { name: "Debt/Loan" }));
    expect(Array.from(loanSelect(dialog).options).map((o) => o.textContent)).toContain("Borrow: Ben · ₱1,000.00 remaining");
    fireEvent.change(loanSelect(dialog), { target: { value: "plain1" } });
    fireEvent.change(within(dialog).getByLabelText("Amount"), { target: { value: "400" } });
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Paid From" }));
    fireEvent.click(await screen.findByRole("option", { name: "Main Wallet" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({ grossIncome: -400, linkedBorrowingId: "plain1" });
  });

  it("borrowing-terms/07#AC3 a Borrowed row without terms but with linked repayments shows its balances; without links it looks as before", async () => {
    renderBorrowings([plainLoan, plainPayment("pay1", 400), { ...plainLoan, id: "bare", name: "Borrow: Bare" }, plainPayment("gone", 300, { deleted: true })]);
    await screen.findByText("Borrow: Ben");
    expect(lastCell("Borrow: Ben")).toBe("₱600.00");
    expect(lastCell("Borrow: Bare")).toBe("—");
    let dialog = await openRecord("Borrow: Ben");
    expect(computed(dialog, "Paid amount")).toBe("₱400.00");
    expect(computed(dialog, "Payments made")).toBe("1");
    expect(computed(dialog, "Remaining balance")).toBe("₱600.00");
    expect(within(dialog).queryByText("Suggested payment")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close modal" }));
    dialog = await openRecord("Borrow: Bare");
    expect(within(dialog).queryByText("Remaining balance")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Paid amount")).not.toBeInTheDocument();
  });

  it("borrowing-terms/07#AC4 the Borrow Accounts panel counts a terms-less loan with linked repayments once", async () => {
    // Debt/Loan balance: -(1,000 − 400) = −600; the loan is read as a loan, so still owed is 600, not 1,200 or 0.
    const debt = { ...borrowAccount, currentBalance: -600 };
    renderBorrowings([plainLoan, plainPayment("pay1", 400)], [wallet, debt, { ...otherBorrowAccount, currentBalance: 0 }]);
    await screen.findByText("Borrow: Ben");
    fireEvent.click(screen.getByRole("button", { name: "Borrowed Accounts" }));
    const panelRow = (await screen.findByText("Debt/Loan")).closest("tr") as HTMLElement;
    expect(within(panelRow).getByText("₱600.00")).toBeInTheDocument();
    expect((screen.getByRole("table").querySelector("tfoot") as HTMLElement).textContent).toContain("₱600.00");
  });

  it("borrowing-terms/07#AC7 a link made from either side is the same stored link, and a stored link shows on both sides", async () => {
    // Side 1: from the repayment form.
    const first = renderBorrowings([termsLoan, plainLoan, repayment("pay1", 100, { linkedBorrowingId: null })]);
    let dialog = await openRecord("Repayment: pay1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    fireEvent.change(loanSelect(dialog), { target: { value: "plain1" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(first.update).toHaveBeenCalledTimes(1));
    const fromRepayment = first.update.mock.calls[0][1];
    first.unmount();

    // Side 2: from the Borrowed row's Payments multi-select.
    const second = renderBorrowings([termsLoan, plainLoan, repayment("pay1", 100, { linkedBorrowingId: null })]);
    dialog = await openRecord("Borrow: Ben");
    editLoan(dialog);
    pickPayment(dialog, /Repayment: pay1/);
    save(dialog);
    await waitFor(() => expect(second.update).toHaveBeenCalledWith("pay1", { linkedBorrowingId: "plain1" }));
    expect(fromRepayment).toMatchObject({ linkedBorrowingId: "plain1" });
    second.unmount();

    // A link that came from elsewhere (e.g. Notion after sync) shows on both sides.
    renderBorrowings([termsLoan, plainLoan, plainPayment("pay1", 100)]);
    dialog = await openRecord("Borrow: Ben");
    expect(within(dialog).getByText(/Repayment: pay1/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close modal" }));
    dialog = await openRecord("Repayment: pay1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    expect(loanSelect(dialog).value).toBe("plain1");
  });

  it("borrowing-terms/07#AC8 Remaining balance is red above 0 and normal at 0, in the modal and the table; no-terms rows keep the dash", async () => {
    renderBorrowings([termsLoan, repayment("pay1", 155000), { ...plainLoan, id: "bare", name: "Borrow: Bare" }, { ...plainLoan, id: "owed", name: "Borrow: Owed" }, plainPayment("pp", 400, { linkedBorrowingId: "owed" })]);
    await screen.findByText("Borrow: Ana");
    const cellOf = (name: string) => { const cells = Array.from(rowFor(name).querySelectorAll("td")); return cells[cells.length - 1]; };
    const colour = (el: Element | null) => el?.className ?? "";
    // Table: owed amount is red (the same money-value--rose the Borrow Accounts panel uses), paid off is the normal colour, no terms is a dash.
    expect(colour(within(cellOf("Borrow: Owed")).getByText("₱600.00"))).toContain("money-value--rose");
    expect(colour(within(cellOf("Borrow: Ana")).getByText("₱0.00"))).toContain("money-value--ink");
    expect(colour(within(cellOf("Borrow: Ana")).getByText("₱0.00"))).not.toContain("rose");
    expect(cellOf("Borrow: Bare").textContent).toBe("—");
    // Modal card.
    let dialog = await openRecord("Borrow: Owed");
    expect(within(dialog).getByText("Remaining balance").parentElement!.querySelector("strong")!.className).toContain("computed-field__value--rose");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close modal" }));
    dialog = await openRecord("Borrow: Ana");
    const paidOff = within(dialog).getByText("Remaining balance").parentElement!.querySelector("strong")!;
    expect(paidOff.textContent).toBe("₱0.00");
    expect(paidOff.className).not.toContain("rose");
  });

  const loose = (id: string, amount: number, extra: Record<string, unknown> = {}) => repayment(id, amount, { linkedBorrowingId: null, name: `Repayment: ${id}`, ...extra });

  it("borrowing-terms/07#AC9 the Payments multi-select links several repayments on save, unlinks deselected ones, and replaces the old dropdown and Link button", async () => {
    const { update } = renderBorrowings([plainLoan, plainPayment("pay1", 400, { name: "Repayment: pay1" }), loose("a", 100), loose("b", 250, { transactedAccountId: "acc8" })]);
    let dialog = await openRecord("Borrow: Ben");
    // Read-only modal lists the linked payment with a Total paid line; the old dropdown and button are gone.
    expect(within(dialog).getByText(/Repayment: pay1/)).toBeInTheDocument();
    expect(computed(dialog, "Total paid")).toBe("₱400.00");
    expect(within(dialog).queryByLabelText("Link a repayment")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Link$/ })).not.toBeInTheDocument();
    // Edit: only repayments on the same Borrow account are offered (label name + date, sublabel amount).
    editLoan(dialog);
    fireEvent.focus(paymentsInput(dialog));
    expect(within(dialog).getByText("Repayment: a · 2026-07-10")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Repayment: b/)).not.toBeInTheDocument();
    pickPayment(dialog, /Repayment: a/);
    expect(computed(dialog, "Total paid")).toBe("₱500.00");
    // Deselect the linked one (its chip's remove button) and save: a is linked, pay1 unlinked.
    const removers = Array.from(dialog.querySelectorAll("button")).filter((b) => b.textContent?.trim() === "\u2212");
    // Chips are listed in item order: pay1 (the linked one) is first, then a.
    fireEvent.mouseDown(removers[0]);
    save(dialog);
    await waitFor(() => expect(update).toHaveBeenCalledWith("a", { linkedBorrowingId: "plain1" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("pay1", { linkedBorrowingId: null }));
    // Reopened: only the saved link shows.
    await waitFor(() => expect(lastCell("Borrow: Ben")).toBe("₱900.00"));
    dialog = await openRecord("Borrow: Ben");
    expect(within(dialog).getByText(/Repayment: a/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Repayment: pay1/)).not.toBeInTheDocument();
  });

  it("borrowing-terms/07#AC10 a repayment links to only one loan: one linked to another loan is not offered, while one loan can hold many", async () => {
    renderBorrowings([termsLoan, plainLoan, repayment("toAna", 100, { name: "Repayment: toAna" }), loose("free1", 10), loose("free2", 20)]);
    const dialog = await openRecord("Borrow: Ben");
    editLoan(dialog);
    fireEvent.focus(paymentsInput(dialog));
    expect(within(dialog).queryByText(/Repayment: toAna/)).not.toBeInTheDocument();
    pickPayment(dialog, /Repayment: free1/);
    fireEvent.focus(paymentsInput(dialog));
    pickPayment(dialog, /Repayment: free2/);
    expect(computed(dialog, "Total paid")).toBe("₱30.00");
  });

  it("borrowing-terms/07#AC11 linking from the loan really saves: the Payments control is usable while editing, both links persist, balances update, and the repayment's own Loan picker agrees", async () => {
    const { update } = renderBorrowings([plainLoan, loose("one", 400), loose("two", 100)]);
    let dialog = await openRecord("Borrow: Ben");
    // Root cause of "Link does nothing": the modal body is a fieldset disabled until Edit, so the old dropdown and Link button were disabled in view mode.
    expect(paymentsInput(dialog)).toBeDisabled();
    editLoan(dialog);
    expect(paymentsInput(dialog)).toBeEnabled();
    pickPayment(dialog, /Repayment: one/);
    fireEvent.focus(paymentsInput(dialog));
    pickPayment(dialog, /Repayment: two/);
    save(dialog);
    await waitFor(() => expect(update).toHaveBeenCalledWith("one", { linkedBorrowingId: "plain1" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("two", { linkedBorrowingId: "plain1" }));
    await waitFor(() => expect(lastCell("Borrow: Ben")).toBe("₱500.00"));
    dialog = await openRecord("Borrow: Ben");
    expect(within(dialog).getByText(/Repayment: one/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Repayment: two/)).toBeInTheDocument();
    expect(computed(dialog, "Paid amount")).toBe("₱500.00");
    expect(computed(dialog, "Payments made")).toBe("2");
    expect(computed(dialog, "Remaining balance")).toBe("₱500.00");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close modal" }));
    dialog = await openRecord("Repayment: one");
    editLoan(dialog);
    expect(loanSelect(dialog).value).toBe("plain1");
  });
});
