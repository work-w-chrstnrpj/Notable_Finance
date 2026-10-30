import { useState } from 'react';
import { ArrowRight, Check, ArrowRightLeft } from 'lucide-react';
import { Field, ComputedField, FilterDropdown, SegmentedControl } from '@/components/ui';
import { SettingsModal } from '@/components/ui/form-modals';
import { incomesApi } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';
import { stripNotionTag } from '@/lib/finance-helpers';
import { todayIso } from '@/lib/date-range';
import { useShortcutAction } from '@/lib/shortcuts/context';
import type { Account, IncomeRecord } from '@/types/finance';
import styles from './money-lent-repayment.module.css';

/** Explicit settlement paths; the original lending account is always the transfer source. */
export function MoneyLentRepayment({ record, accounts, sourceName, onClose, onSaved }: {
  record: IncomeRecord;
  accounts: Account[];
  sourceName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [method, setMethod] = useState('same');
  const [transferAccountId, setTransferAccountId] = useState('');
  const [date, setDate] = useState(todayIso);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = -record.grossIncome;
  const isTransfer = method === 'transfer';
  const transferAccounts = accounts.filter((account) => account.id !== record.accountId);
  const destination = transferAccounts.find((account) => account.id === transferAccountId);
  const canSave = Boolean(date && (!isTransfer || destination));
  const close = () => { if (!busy) onClose(); };
  async function save() {
    if (busy || !canSave) return;
    setBusy(true); setError(null);
    try {
      const result = await incomesApi.repayMoneyLent(record.id, {
        receivingAccountId: isTransfer ? transferAccountId : record.accountId!, date, expectedAmount: amount,
        expectedSourceAccountId: record.accountId!,
      });
      if (!result.success) { setError(result.error.message); return; }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record repayment.');
    } finally { setBusy(false); }
  }
  useShortcutAction('modal.close', close);
  useShortcutAction('modal.save', () => void save(), canSave && !busy);
  return <SettingsModal title="Record full repayment" onClose={close}
    subtitle="Choose how the borrower repaid this loan."
    footer={<>
      <button type="button" className="button" disabled={busy} onClick={close}>Cancel</button>
      <button type="button" className="button button--primary" disabled={busy || !canSave} onClick={() => void save()}>
        {isTransfer ? <ArrowRightLeft size={16} /> : <Check size={16} />}
        {busy ? 'Saving…' : isTransfer ? 'Convert to Transfer' : 'Confirm full repayment'}
      </button>
    </>}>
    <div className={styles.summary}>
      <div><span className={styles.eyebrow}>Money Lent · Full repayment</span><strong>{stripNotionTag(record.name)}</strong></div>
      <span className={styles.amount}>{formatMoney(amount)}</span>
    </div>
    <fieldset className="modal-fieldset form-grid form-grid--single" disabled={busy}>
      <SegmentedControl label="Repayment method" value={method}
        options={[{ label: 'Same account', value: 'same' }, { label: 'Transfer to another account', value: 'transfer' }]}
        onChange={(value) => { setMethod(value); setError(null); }} />
      <ComputedField label="Source Account" value={sourceName} />
      {isTransfer && <Field label="Transfer Account" required>
        <FilterDropdown value={transferAccountId} onChange={setTransferAccountId} placeholder="Select transfer account"
          items={transferAccounts.map((account) => ({ id: account.id, label: account.name }))} />
      </Field>}
      {isTransfer && transferAccounts.length === 0 && <p role="status">No other active non-credit account is available. Add or activate an account in Notion and sync to use Transfer.</p>}
      <Field label="Repayment date" required>
        <input type="date" min={record.date} value={date} onChange={(event) => setDate(event.target.value)} />
      </Field>
    </fieldset>
    <div className={styles.preview} aria-label="Repayment preview">
      {isTransfer ? <>
        <div className={styles.direction}><strong>{sourceName}</strong><ArrowRight size={18} aria-hidden="true" /><strong>{destination?.name ?? 'Select transfer account'}</strong></div>
        <p>Convert this loan to a Transfer from {sourceName} to {destination?.name ?? 'the selected account'}.</p>
        <p>The {formatMoney(amount)} deduction stays in the source account. The transfer account receives {formatMoney(amount)}.</p>
      </> : <>
        <strong>Return to {sourceName}</strong>
        <p>Soft-delete this loan and restore {formatMoney(amount)} to {sourceName}.</p>
      </>}
      <p>Full repayment only. The loan leaves Receivables after confirmation.</p>
    </div>
    {error && <p role="alert">{error}</p>}
  </SettingsModal>;
}
