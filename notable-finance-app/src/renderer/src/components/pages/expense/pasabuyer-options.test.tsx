// @vitest-environment jsdom
import { useEffect } from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderPage } from '../../../../../../test/render-page';
import { ok } from '../../../../../../test/mock-window-api';
import { useLiveCollections } from '@/components/hooks';
import { useExpenseForm } from './use-expense-form';
import { ExpenseFormFields } from './expense-form-fields';
import { buildExpenseMassEditFields } from './expense-mass-edit-fields';

function Harness() {
  const data = useLiveCollections();
  const form = useExpenseForm({ viewMode: 'Unpaid Pasabuy', activeAccounts: [], expenseCategoryNameById: new Map() });
  const setPasabuyer = form.setPasabuyer;
  useEffect(() => { setPasabuyer('Retired buyer'); }, [setPasabuyer]);
  const bulk = buildExpenseMassEditFields([], [], data.pasabuyerOptions).find(field => field.key === 'pasabuyer');
  return <>
    <button onClick={data.refreshReferenceData}>Refresh references</button>
    <output data-testid="bulk-options">{JSON.stringify(bulk?.options)}</output>
    <ExpenseFormFields form={form} activeAccounts={[]} expenseCategories={[]} />
  </>;
}

it('updates form and bulk choices after sync refresh, while preserving the saved selection', async () => {
  const choices = vi.fn().mockResolvedValue(ok(['New buyer', 'Unused buyer']));
  renderPage(<Harness />, { apiOverrides: { categories: { pasabuyers: choices } } });
  await screen.findByRole('option', { name: 'Unused buyer' });
  expect(screen.queryByRole('option', { name: 'Maimai' })).toBeNull();
  expect((screen.getByRole('option', { name: 'Retired buyer' }) as HTMLOptionElement).selected).toBe(true);
  expect(screen.getByTestId('bulk-options').textContent).toContain('Unused buyer');
  choices.mockResolvedValue(ok(['Renamed buyer']));
  fireEvent.click(screen.getByText('Refresh references'));
  await screen.findByRole('option', { name: 'Renamed buyer' });
  await waitFor(() => expect(screen.queryByRole('option', { name: 'Unused buyer' })).toBeNull());
  expect(screen.getByTestId('bulk-options').textContent).not.toContain('Unused buyer');
  expect((screen.getByRole('option', { name: 'Retired buyer' }) as HTMLOptionElement).selected).toBe(true);
});
