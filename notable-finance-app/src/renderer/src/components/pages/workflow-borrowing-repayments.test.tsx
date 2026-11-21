// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { borrowAccount, computed, openRecord, otherAccountLoan, otherBorrowAccount, wallet, plainLoan, renderBorrowings, repayment, rowFor, termsLoan } from "./borrowing-terms-fixtures";

const setField = (dialog: HTMLElement, label: string, value: string) =>
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
const loanSelect = (dialog: HTMLElement) => within(dialog).getByLabelText("Loan") as HTMLSelectElement;
async function pickPaidFrom(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole("combobox", { name: "Paid From" }));
  fireEvent.click(await screen.findByRole("option", { name: "Main Wallet" }));
}
async function openNewRepayment() {
  await screen.findByText("Borrow: Ana");
  fireEvent.click(screen.getByRole("button", { name: /New Record/ }));
  fireEvent.click(screen.getByRole("button", { name: /Repayment/ }));
  return screen.getByRole("dialog");
}
const lastCell = (name: string) => { const cells = Array.from(rowFor(name).querySelectorAll("td")); return cells[cells.length - 1].textContent; };

describe("borrowing-terms/04 linked repayments and the Borrow Accounts panel", () => {
  it("borrowing-terms/04#AC1 the repayment form's loan picker lists the Borrowed rows on the chosen Borrow account (terms or not, see 07)", async () => {
    renderBorrowings([termsLoan, plainLoan, otherAccountLoan]);
    const dialog = await openNewRepayment();
    // On Debt/Loan both its Borrowed rows are listed; the other account's is not.
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Borrow Account" }));
    fireEvent.click(await screen.findByRole("option", { name: "Debt/Loan" }));
    const labels = Array.from(loanSelect(dialog).options).map((o) => o.textContent);
    expect(labels).toEqual(["— Not linked to a loan —", "Borrow: Ana · ₱155,000.00 remaining", "Borrow: Ben · ₱1,000.00 remaining"]);
    // Switching the Borrow account switches the list.
    fireEvent.click(within(dialog).getByRole("combobox", { name: /Borrow Account|Debt\/Loan/ }));
    fireEvent.click(await screen.findByRole("option", { name: "Borrowed Ana" }));
    expect(Array.from(loanSelect(dialog).options).map((o) => o.textContent)).toEqual(["— Not linked to a loan —", "Borrow: Cara · ₱21,000.00 remaining"]);
  });

  it("borrowing-terms/04#AC2 Record repayment from a loan prefills the Suggested payment and the link, and the amount stays editable", async () => {
    const { create } = renderBorrowings([termsLoan]);
    const loan = await openRecord("Borrow: Ana");
    fireEvent.click(within(loan).getByRole("button", { name: "Record repayment" }));
    const dialog = screen.getByRole("dialog");
    expect((within(dialog).getByLabelText("Amount") as HTMLInputElement).value).toBe("12916.67");
    expect(loanSelect(dialog).value).toBe("loan1");
    setField(dialog, "Amount", "5000");
    await pickPaidFrom(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({ grossIncome: -5000, linkedBorrowingId: "loan1" });
  });

  it("borrowing-terms/04#AC3 after a linked 12,916.67 repayment, Paid amount, Payments made and Remaining balance are 12,916.67, 1 and 142,083.33", async () => {
    renderBorrowings([termsLoan, repayment("pay1", 12916.67)]);
    const dialog = await openRecord("Borrow: Ana");
    expect(computed(dialog, "Paid amount")).toBe("₱12,916.67");
    expect(computed(dialog, "Payments made")).toBe("1");
    expect(computed(dialog, "Remaining balance")).toBe("₱142,083.33");
  });

  it.each([
    ["a smaller payment", 5000, "₱150,000.00"],
    ["a larger payment", 40000, "₱115,000.00"],
    ["an overpayment", 200000, "₱0.00"],
  ])("borrowing-terms/04#AC4 %s is reflected in Remaining balance (%s -> %s)", async (_label, amount, remaining) => {
    renderBorrowings([termsLoan, repayment("pay1", amount)]);
    await screen.findByText("Borrow: Ana");
    expect(lastCell("Borrow: Ana")).toBe(remaining);
    const dialog = await openRecord("Borrow: Ana");
    expect(computed(dialog, "Remaining balance")).toBe(remaining);
  });

  it("borrowing-terms/04#AC5 editing a repayment can link or unlink it, and a deleted repayment is ignored", async () => {
    const { update } = renderBorrowings([termsLoan, repayment("pay1", 12916.67), repayment("pay2", 1000, { linkedBorrowingId: null, name: "Repayment: loose" }), repayment("pay3", 50000, { deleted: true, name: "Repayment: gone" })]);
    await screen.findByText("Borrow: Ana");
    // The deleted payment does not count.
    expect(lastCell("Borrow: Ana")).toBe("₱142,083.33");

    // Unlink the linked repayment: the loan gets its balance back.
    let dialog = await openRecord("Repayment: pay1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    expect(loanSelect(dialog).value).toBe("loan1");
    fireEvent.change(loanSelect(dialog), { target: { value: "" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][1]).toMatchObject({ linkedBorrowingId: null });
    await waitFor(() => expect(lastCell("Borrow: Ana")).toBe("₱155,000.00"));

    // Link the loose repayment: the loan drops by that amount.
    dialog = await openRecord("Repayment: loose");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    fireEvent.change(loanSelect(dialog), { target: { value: "loan1" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][1]).toMatchObject({ linkedBorrowingId: "loan1" });
    await waitFor(() => expect(lastCell("Borrow: Ana")).toBe("₱154,000.00"));
  });

  it("borrowing-terms/04#AC6 the Borrow Accounts panel still-owed is the Remaining balance of loans with terms plus the old amount for borrowings without", async () => {
    // Raw balance of Debt/Loan: -150,000 (terms loan) -1,000 (plain loan) +12,916.67 (linked repayment).
    const debt = { ...borrowAccount, currentBalance: -138083.33 };
    renderBorrowings([termsLoan, plainLoan, repayment("pay1", 12916.67)], [wallet, debt, { ...otherBorrowAccount, currentBalance: 0 }]);
    await screen.findByText("Borrow: Ana");
    fireEvent.click(screen.getByRole("button", { name: "Borrowed Accounts" }));
    const panelRow = (await screen.findByText("Debt/Loan")).closest("tr") as HTMLElement;
    // 142,083.33 remaining on the loan with terms + 1,000 on the plain loan.
    expect(within(panelRow).getByText("₱143,083.33")).toBeInTheDocument();
    const footer = screen.getByRole("table").querySelector("tfoot") as HTMLElement;
    expect(footer.textContent).toContain("₱143,083.33");
  });
  it("borrowing-terms/04#AC5b editing a repayment whose loan is not in the picker keeps the link and shows it as an option", async () => {
    // The loan was soft-deleted, so it is not a loan with terms on the account; the repayment still points at it.
    const { update } = renderBorrowings([{ ...termsLoan, deleted: true }, repayment("pay1", 1000)]);
    const dialog = await openRecord("Repayment: pay1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    expect(loanSelect(dialog).value).toBe("loan1");
    expect(Array.from(loanSelect(dialog).options).map((o) => o.textContent)).toContain("Borrow: Ana");
    fireEvent.change(within(dialog).getByPlaceholderText("Borrowings title"), { target: { value: "Repayment: renamed" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][1]).toMatchObject({ name: "Repayment: renamed", linkedBorrowingId: "loan1" });
  });

  it("borrowing-terms/04#AC5c choosing Not linked explicitly still unlinks a repayment whose loan is not in the picker", async () => {
    const { update } = renderBorrowings([{ ...termsLoan, deleted: true }, repayment("pay1", 1000)]);
    const dialog = await openRecord("Repayment: pay1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit" }));
    fireEvent.change(loanSelect(dialog), { target: { value: "" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0][1]).toMatchObject({ linkedBorrowingId: null });
  });

  it.each([
    ["less than one installment remains", [repayment("p1", 150000)], "5000"],
    ["a full installment or more remains", [repayment("p1", 12916.67)], "12916.67"],
    ["the loan is fully paid", [repayment("p1", 155000)], ""],
    ["the loan is overpaid", [repayment("p1", 160000)], ""],
  ])("borrowing-terms/04#AC2b Record repayment prefills at most the remaining balance, never 0 or less (%s)", async (_label, repayments, expected) => {
    renderBorrowings([termsLoan, ...repayments]);
    const loan = await openRecord("Borrow: Ana");
    fireEvent.click(within(loan).getByRole("button", { name: "Record repayment" }));
    const dialog = screen.getByRole("dialog");
    expect((within(dialog).getByLabelText("Amount") as HTMLInputElement).value).toBe(expected);
    expect(loanSelect(dialog).value).toBe("loan1");
  });

  it("borrowing-terms/04#AC2c a loan with no Period count prefills its remaining balance", async () => {
    renderBorrowings([{ ...termsLoan, paymentFrequency: null, periodCount: null }, repayment("p1", 50000)]);
    const loan = await openRecord("Borrow: Ana");
    fireEvent.click(within(loan).getByRole("button", { name: "Record repayment" }));
    expect((within(screen.getByRole("dialog")).getByLabelText("Amount") as HTMLInputElement).value).toBe("105000");
  });
});
