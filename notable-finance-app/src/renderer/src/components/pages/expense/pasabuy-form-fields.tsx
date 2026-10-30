import { useLiveCollections } from '@/components/hooks';
import { Field, ComputedField, FormSectionDivider, FilterDropdown } from '@/components/ui';
import { AccountIcon } from '@/components/ui/accounts';
import { pasabuyStatusLabels } from '@/lib/finance-rules';
import { formatMoney } from '@/lib/format';
import type { Account, PasabuyStatus } from '@/types/finance';
import type { useExpenseForm } from './use-expense-form';

export type PasabuyForm = Pick<ReturnType<typeof useExpenseForm>,
  'pasabuyer' | 'setPasabuyer' | 'pasabuyStatus' | 'onSelectPasabuyStatus' |
  'pasabuyDateOfPaymentInput' | 'setPasabuyDateOfPaymentInput' |
  'pasabuyPaidPeriodInput' | 'setPasabuyPaidPeriodInput' |
  'pasabuyAccountReceiverId' | 'setPasabuyAccountReceiverId' |
  'pasabuyReceivedAmount' | 'pasabuyerBalance'>;

/** Shared Pasabuy-only controls; both editors retain the same choices and amounts. */
export function PasabuyFormFields({ form, activeAccounts }: { form: PasabuyForm; activeAccounts: Account[] }) {
  const { pasabuyerOptions } = useLiveCollections();
  const buyerOptions = form.pasabuyer && !pasabuyerOptions.includes(form.pasabuyer)
    ? [form.pasabuyer, ...pasabuyerOptions] : pasabuyerOptions;
  const { pasabuyer, setPasabuyer, pasabuyStatus, onSelectPasabuyStatus,
    pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput,
    pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput,
    pasabuyAccountReceiverId, setPasabuyAccountReceiverId,
    pasabuyReceivedAmount, pasabuyerBalance } = form;
  return <>
    <FormSectionDivider title="Pasabuy Transaction" />
    <Field label="Pasabuyer">
      <select value={pasabuyer} onChange={(event) => setPasabuyer(event.target.value)}>
        <option value="">— None —</option>
        {buyerOptions.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </Field>
    <Field label="Pasabuy Status">
      <select
        value={pasabuyStatus}
        onChange={(event) => onSelectPasabuyStatus(event.target.value as PasabuyStatus)}
      >
        <option value="">— None —</option>
        {pasabuyStatusLabels.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </Field>
    <Field label="Pasabuy Date of Payment">
      <input
        type="date"
        value={pasabuyDateOfPaymentInput}
        onChange={(event) => setPasabuyDateOfPaymentInput(event.target.value)}
      />
    </Field>
    <Field label="Pasabuy Account Receiver">
      <FilterDropdown
        placeholder="— None —"
        value={pasabuyAccountReceiverId}
        onChange={setPasabuyAccountReceiverId}
        items={activeAccounts.map((account) => ({
          id: account.id,
          label: account.name,
          icon: <AccountIcon account={account} />,
        }))}
      />
    </Field>
    <Field label="Pasabuy paid period">
      <input
        inputMode="numeric"
        placeholder="0"
        value={pasabuyPaidPeriodInput}
        onChange={(event) => setPasabuyPaidPeriodInput(event.target.value)}
      />
    </Field>
    <ComputedField label="Pasabuy Received Amount" value={formatMoney(pasabuyReceivedAmount)} />
    <ComputedField label="Pasabuyer Balance" value={formatMoney(pasabuyerBalance)} />
  </>;
}
