// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderPage } from '../../../../../test/render-page';
import { ok, err } from '../../../../../test/mock-window-api';
import { WorkflowPage } from './workflow';
import { IS_MAC } from '@/lib/shortcuts/context';
import { useFabExport } from '@/lib/fab-export-context';
import type { ExpenseRecord } from '@/types/finance';
import type { UpdateExpenseInput } from '@shared/finance.types';

const account = { id: 'a', name: 'Wallet', type: 'Cash' as const, icon: null, information: '', startingBalance: 0,
  currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null,
  dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null,
  inactive: false, notionSynced: true };
const category = { id: 'pasabuy', name: 'Pasabuy', auxiliary: true, icon: null, monthlyBudget: 0 };
const expense: ExpenseRecord = { id: 'one', description: 'Groceries for Ana', purchaseDate: '2026-07-01',
  datePaid: '2026-07-02', amount: 1000, interest: 0, accountId: 'a', categoryId: 'pasabuy', paymentStatus: 'Paid',
  paymentFrequency: 'Monthly', periodCount: 1, bnplAdjustment: null, paidPeriod: 1, pasabuyer: 'Ana',
  pasabuyStatus: 'Payment partially received', pasabuyDateOfPayment: null, pasabuyPaidPeriod: 0.4,
  pasabuyAccountReceiverId: 'a', pasabuyBalance: 600, ccLinkPaymentReceiptId: null };
const income = { id: 'income', name: 'Outstanding income', date: '2026-07-03', grossIncome: 100,
  capitalExpenditure: 0, accountId: null, categoryId: 'normal' };
function ReceiptProbe() {
  const { receipt } = useFabExport();
  return <output data-testid="receipt">{receipt?.total}</output>;
}
function renderReceivables({ mixed = false, count = 2, fail = false } = {}) {
  let records: ExpenseRecord[] = Array.from({ length: count }, (_, index) => ({ ...expense,
    id: index === 0 ? 'one' : 'two', description: index === 0 ? expense.description : 'Tickets for Ben',
    pasabuyer: index === 0 ? 'Ana' : 'Ben' }));
  const update = vi.fn(async (id: string, patch: UpdateExpenseInput) => {
    if (fail && id === 'two') return err('E_TEST', 'Could not save Ben');
    const record = records.find((record) => record.id === id)!;
    const next = { ...record, ...patch, paymentStatus: patch.paymentStatus ?? record.paymentStatus, pasabuyBalance: patch.pasabuyStatus === 'Payment fully received' ? 0 : record.pasabuyBalance };
    records = records.map((record) => record.id === id ? next : record);
    return ok(next);
  });
  return { ...renderPage(<><WorkflowPage section="receivables" selectedMonth="2026-07" /><ReceiptProbe /></>, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([account])) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([category])),
        pasabuyers: vi.fn(async () => ok(['Ana', 'Ben'])) },
      incomes: { list: vi.fn(async () => ok(mixed ? [income] : [])) },
      expenses: { list: vi.fn(async () => ok(records)), update },
    },
  }), update };
}
function selectRow(name: string) {
  const row = screen.getByRole('row', { name: new RegExp(name) });
  fireEvent.click(within(row).getByRole('button', { name: 'Select row' }));
}
function mod(key: string, code: string) {
  fireEvent.keyDown(window, { key, code, ...(IS_MAC ? { metaKey: true } : { ctrlKey: true }) });
}

describe('Receivables Pasabuy details and selection', () => {
  it('edits only description and Pasabuy fields without navigating or touching hidden expense inputs', async () => {
    const { update } = renderReceivables({ count: 1 });
    const hash = window.location.hash;
    fireEvent.click(await screen.findByText(expense.description));
    const dialog = screen.getByRole('dialog', { name: 'Pasabuy receivable' });
    expect(within(dialog).getByLabelText(/^Purchase description/)).toBeDisabled();
    for (const hidden of ['Expense Amount', 'Accounts', 'Categories', 'Purchase Date', 'Date Paid', 'Interest', 'Payment Status']) {
      expect(within(dialog).queryByLabelText(hidden)).not.toBeInTheDocument();
    }
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));
    fireEvent.change(within(dialog).getByLabelText(/^Purchase description/), { target: { value: 'Updated groceries' } });
    fireEvent.change(within(dialog).getByLabelText('Pasabuy Status'), { target: { value: 'Payment fully received' } });
    expect(within(dialog).getByLabelText('Pasabuy paid period')).toHaveValue('1');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(update).toHaveBeenCalledWith('one', {
      description: 'Updated groceries', pasabuyer: 'Ana', pasabuyStatus: 'Payment fully received',
      pasabuyDateOfPayment: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), pasabuyPaidPeriod: 1, pasabuyAccountReceiverId: 'a',
    });
    expect(window.location.hash).toBe(hash);
    expect(screen.queryByText('Updated groceries')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('receipt')).toHaveTextContent('₱0.00'));
  });

  it('cancels edits without a write', async () => {
    const { update } = renderReceivables({ count: 1 });
    fireEvent.click(await screen.findByText(expense.description));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));
    fireEvent.change(within(dialog).getByLabelText(/^Purchase description/), { target: { value: 'Unsaved' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText(expense.description)).toBeInTheDocument();
  });

  it('keeps the modal and draft on save failure', async () => {
    renderReceivables({ fail: true });
    fireEvent.click(await screen.findByText('Tickets for Ben'));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save Ben');
    expect(within(dialog).getByLabelText(/^Purchase description/)).toHaveValue('Tickets for Ben');
  });

  it('selects and deselects Pasabuy rows and all rows without opening details', async () => {
    renderReceivables({ mixed: true });
    await screen.findByText(expense.description);
    const header = screen.getByRole('button', { name: 'Select all rows' });
    selectRow(expense.description);
    expect(header).toHaveAttribute('aria-pressed', 'mixed');
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(header).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(header);
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
    expect(header).toHaveAttribute('aria-pressed', 'false');
  });

  it('includes Pasabuy expenses in keyboard select-all and ignores checkbox key events in the row opener', async () => {
    renderReceivables({ mixed: true });
    await screen.findByText(expense.description);
    const checkbox = within(screen.getByRole('row', { name: new RegExp(expense.description) })).getByRole('button', { name: 'Select row' });
    fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' });
    fireEvent.keyDown(checkbox, { key: 'Enter', code: 'Enter' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    mod('a', 'KeyA');
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('shows Bulk Pasabuy only for an all-Pasabuy selection, with Income actions kept on Income selections', async () => {
    renderReceivables({ mixed: true });
    await screen.findByText(expense.description);
    selectRow(expense.description);
    expect(screen.getByRole('button', { name: 'Bulk Pasabuy' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Duplicate' })).not.toBeInTheDocument();
    selectRow(income.name);
    expect(screen.queryByRole('button', { name: 'Bulk Pasabuy' })).not.toBeInTheDocument();
    selectRow(expense.description);
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Soft Delete' })).toBeInTheDocument();
  });

  it('excludes disabled Pasabuy rows from both totals and receipts and re-enables them', async () => {
    renderReceivables();
    await screen.findByText(expense.description);
    await waitFor(() => expect(screen.getByTestId('receipt')).toHaveTextContent('₱1,200.00'));
    selectRow(expense.description);
    fireEvent.click(screen.getByRole('button', { name: 'Disable' }));
    await waitFor(() => expect(screen.getByTestId('receipt')).toHaveTextContent('₱600.00'));
    selectRow(expense.description);
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    await waitFor(() => expect(screen.getByTestId('receipt')).toHaveTextContent('₱1,200.00'));
  });

  it('bulk edits only Pasabuy fields on the original Expense IDs and removes fully received rows', async () => {
    const { update, api } = renderReceivables();
    await screen.findByText(expense.description);
    fireEvent.click(screen.getByRole('button', { name: 'Select all rows' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bulk Pasabuy' }));
    const dialog = screen.getByRole('dialog', { name: 'Bulk Pasabuy · 2 expenses' });
    const fields = within(dialog).getAllByLabelText('Field');
    const offered = fields.flatMap((field) => within(field).getAllByRole('option').map((option) => (option as HTMLOptionElement).value));
    expect(new Set(offered)).toEqual(new Set(['pasabuyer', 'pasabuyStatus', 'pasabuyDateOfPayment', 'pasabuyPaidPeriod', 'pasabuyAccountReceiverId']));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply to selected' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(update.mock.calls.map(([id]) => id)).toEqual(['one', 'two']);
    expect(api.incomes.update).not.toHaveBeenCalled();
    for (const [, patch] of update.mock.calls) expect(Object.keys(patch).sort()).toEqual([
      'pasabuyAccountReceiverId', 'pasabuyDateOfPayment', 'pasabuyPaidPeriod', 'pasabuyStatus',
    ]);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
  });

  it('retries only failed expenses after a partial bulk update', async () => {
    const { update } = renderReceivables({ fail: true });
    await screen.findByText(expense.description);
    fireEvent.click(screen.getByRole('button', { name: 'Select all rows' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bulk Pasabuy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply to selected' }));
    expect(await screen.findByText(/1 of 2 items failed/)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Bulk Pasabuy · 1 expense' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply to selected' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(3));
    expect(update.mock.calls.map(([id]) => id)).toEqual(['one', 'two', 'two']);
  });
});
