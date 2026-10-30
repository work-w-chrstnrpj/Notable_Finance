import { useState } from 'react';
import { Field } from '@/components/ui';
import { SettingsModal } from '@/components/ui/form-modals';
import { useLiveCollections } from '@/components/hooks';
import { PasabuyFormFields } from '../expense/pasabuy-form-fields';
import { expensesApi } from '@/lib/api-client';
import { parseOptionalNumberInput } from '@/lib/finance-helpers';
import { todayIso } from '@/lib/date-range';
import { useShortcutAction } from '@/lib/shortcuts/context';
import { expenseAmounts } from '@shared/notion-formulas';
import type { ExpenseRecord, PasabuyStatus } from '@/types/finance';

/** Edits only description and Pasabuy inputs on the original expense. */
export function ReceivablePasabuyModal({ record, onClose, onSaved }: {
  record: ExpenseRecord;
  onClose: () => void;
  onSaved: (record: ExpenseRecord) => void;
}) {
  const { activeAccounts, allAccounts } = useLiveCollections();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(record.description);
  const [pasabuyer, setPasabuyer] = useState(record.pasabuyer ?? '');
  const [pasabuyStatus, setPasabuyStatus] = useState<PasabuyStatus | ''>(record.pasabuyStatus ?? '');
  const [pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput] = useState(record.pasabuyDateOfPayment ?? '');
  const [pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput] = useState(record.pasabuyPaidPeriod?.toString() ?? '');
  const [pasabuyAccountReceiverId, setPasabuyAccountReceiverId] = useState(record.pasabuyAccountReceiverId ?? '');
  const amounts = expenseAmounts({ ...record, pasabuyStatus: pasabuyStatus || null,
    pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
    pasabuyAccountReceiverId: pasabuyAccountReceiverId || null }, 'Pasabuy');
  // Retain a selected inactive receiver without making it a new choice elsewhere.
  const receiver = allAccounts.find((account) => account.id === record.pasabuyAccountReceiverId);
  const receiverOptions = receiver && !activeAccounts.some((account) => account.id === receiver.id)
    ? [receiver, ...activeAccounts] : activeAccounts;

  function onSelectPasabuyStatus(status: PasabuyStatus | '') {
    setPasabuyStatus(status);
    if (status === 'Payment fully received' && record.periodCount === 1) {
      setPasabuyPaidPeriodInput('1'); setPasabuyDateOfPaymentInput(todayIso());
    }
  }
  async function save() {
    if (saving || !editing) return;
    if (!description.trim()) { setError('Purchase description is required.'); return; }
    const period = parseOptionalNumberInput(pasabuyPaidPeriodInput);
    if (pasabuyPaidPeriodInput.trim() && (period === null || !Number.isFinite(Number(pasabuyPaidPeriodInput.replace(/,/g, ''))) || period < 0)) {
      setError('Pasabuy paid period must be a non-negative number.'); return;
    }
    setSaving(true); setError(null);
    try {
      const result = await expensesApi.update(record.id, {
        description: description.trim(), pasabuyer: pasabuyer || null, pasabuyStatus: pasabuyStatus || null,
        pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
        pasabuyPaidPeriod: period, pasabuyAccountReceiverId: pasabuyAccountReceiverId || null,
      });
      if (!result.success) { setError(result.error.message); return; }
      onSaved(result.data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save Pasabuy details.'); }
    finally { setSaving(false); }
  }
  const close = () => { if (!saving) onClose(); };
  useShortcutAction('modal.close', close);
  useShortcutAction('modal.edit', () => setEditing(true), !saving);
  useShortcutAction('modal.save', () => void save(), editing && !saving);

  return <SettingsModal title="Pasabuy receivable" onClose={close}
    subtitle="View or update this expense’s description and Pasabuy details."
    footer={<>
      <button type="button" className="button" disabled={saving} onClick={close}>{editing ? 'Cancel' : 'Close details'}</button>
      <button type="button" className="button button--primary" disabled={saving}
        onClick={() => editing ? void save() : setEditing(true)}>{saving ? 'Saving…' : editing ? 'Save' : 'Edit'}</button>
    </>}>
    <fieldset className="modal-fieldset form-grid form-grid--single" disabled={!editing || saving}>
      <Field label="Purchase description" required>
        <input value={description} onChange={(event) => setDescription(event.target.value)} />
      </Field>
      <PasabuyFormFields activeAccounts={receiverOptions} form={{
        pasabuyer, setPasabuyer, pasabuyStatus, onSelectPasabuyStatus,
        pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput,
        pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput,
        pasabuyAccountReceiverId, setPasabuyAccountReceiverId,
        pasabuyReceivedAmount: amounts.pasabuyReceivedAmount, pasabuyerBalance: amounts.pasabuyerBalance,
      }} />
    </fieldset>
    {error && <p role="alert">{error}</p>}
  </SettingsModal>;
}
