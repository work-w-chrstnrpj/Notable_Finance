// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useExpenseForm } from './use-expense-form';
import { makeDeriveExpenseComputed } from './expense-tables';
import { account } from '../../../../../../test/factories';
import type { ExpenseRecord } from '@/types/finance';

const credit = account({ type: 'BNPL', billingDay: 15, dueDay: 10 });
const record: ExpenseRecord = {
  id: 'expense', description: 'Pasabuy', accountId: credit.id, categoryId: 'pasabuy',
  purchaseDate: '2026-07-01', datePaid: null, amount: 25000, interest: 0,
  paymentStatus: 'Paid', paymentFrequency: 'Monthly', periodCount: 6,
  bnplAdjustment: 1, paidPeriod: 2, pasabuyer: 'Shared',
  pasabuyStatus: 'Payment partially received (installment)',
  pasabuyPaidPeriod: 2, pasabuyAccountReceiverId: credit.id,
  pasabuyDateOfPayment: null, pasabuyBalance: 0, ccLinkPaymentReceiptId: null,
};

function load(overrides: Partial<ExpenseRecord> = {}) {
  const hook = renderHook(() => useExpenseForm({
    viewMode: 'Monthly', activeAccounts: [credit],
    expenseCategoryNameById: new Map([['pasabuy', 'Pasabuy']]),
  }));
  act(() => hook.result.current.loadRecord({ ...record, ...overrides }, { accountId: '', categoryId: '' }));
  return hook.result;
}

describe('Expense record formula regression', () => {
  it.each(['Paid', 'Unpaid', 'Installment'] as const)('computes Pasabuy independently of payment status %s', paymentStatus => {
    const form = load({ paymentStatus });
    expect(form.current.installmentAmount).toBeCloseTo(4166.6666667);
    expect(form.current.pasabuyReceivedAmount).toBeCloseTo(8333.3333333);
    expect(form.current.pasabuyerBalance).toBe(16666.67);
  });

  it('uses the same paid and remaining figures in the form and table', () => {
    const form = load();
    const table = makeDeriveExpenseComputed(new Map([[credit.id, credit]]))(record);
    expect(form.current.paidAmount).toBe(8333.33);
    expect(form.current.remainingBalance).toBe(16666.67);
    expect(table.paid).toBe(form.current.paidAmount);
    expect(table.remaining).toBe(form.current.remainingBalance);
  });

  it('includes interest in Pasabuyer balance independently of the receiver', () => {
    const form = load({ amount: 900, interest: 90, periodCount: 3, pasabuyPaidPeriod: 1, pasabuyAccountReceiverId: null });
    expect(form.current.pasabuyReceivedAmount).toBe(0);
    expect(form.current.pasabuyerBalance).toBe(660);
  });

  it('returns zero balance when fully received without inventing a received amount', () => {
    const form = load({ pasabuyStatus: 'Payment fully received', pasabuyPaidPeriod: 0 });
    expect(form.current.pasabuyReceivedAmount).toBe(0);
    expect(form.current.pasabuyerBalance).toBe(0);
  });

  it('updates BNPL expected date in the form and table, and clears it after payment', () => {
    const form = load();
    expect(form.current.expectedPaymentDate).toBe('2027-02-10');
    expect(makeDeriveExpenseComputed(new Map([[credit.id, credit]]))(record).expected).toBe('2027-02-10');
    act(() => form.current.setDatePaidInput('2026-08-01'));
    expect(form.current.expectedPaymentDate).toBeNull();
  });

  it('defaults zero periods to one for expected date, like Notion empty(0)', () => {
    const form = load({ periodCount: 0, bnplAdjustment: null });
    expect(form.current.expectedPaymentDate).toBe('2026-08-10');
  });
});
