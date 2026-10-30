import { useMemo, useState } from 'react';
import { useLiveCollections } from '@/components/hooks';
import { MassEditModal, pasabuyReceivePreset } from '@/components/ui/mass-edit-modal';
import { buildPasabuyMassEditFields } from '../expense/expense-mass-edit-fields';
import { useShortcutAction } from '@/lib/shortcuts/context';
import { expensesApi } from '@/lib/api-client';
import type { ExpenseRecord } from '@/types/finance';

/** A frozen Expense selection; successful rows are never retried after a partial failure. */
export function ReceivablePasabuyBulkModal({ ids, onClose, onUpdated }: {
  ids: string[];
  onClose: () => void;
  onUpdated: (records: ExpenseRecord[]) => void;
}) {
  const { activeAccounts, pasabuyerOptions } = useLiveCollections();
  const [pendingIds, setPendingIds] = useState(ids);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fields = useMemo(() => buildPasabuyMassEditFields(activeAccounts, pasabuyerOptions), [activeAccounts, pasabuyerOptions]);
  const [preset] = useState(pasabuyReceivePreset);
  useShortcutAction('modal.close', () => { if (!saving) onClose(); });
  async function apply(patch: Record<string, string | number | null>) {
    if (saving) return;
    setSaving(true); setError(null);
    try {
      const result = await expensesApi.bulkUpdate(pendingIds, patch);
      if (!result.success) { setError(result.error.message); return; }
      onUpdated(result.data.updated);
      if (result.data.failed.length) {
        setPendingIds(result.data.failed.map((failure) => failure.id));
        setError(`${result.data.failed.length} of ${pendingIds.length} items failed to update. Retry applies only to the failed items. ${result.data.failed[0].error}`);
      } else onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update Pasabuy details.'); }
    finally { setSaving(false); }
  }
  return <MassEditModal open title={`Bulk Pasabuy · ${pendingIds.length} expense${pendingIds.length === 1 ? '' : 's'}`}
    subtitle="Update Pasabuy details on the selected expenses. Other expense fields stay unchanged."
    fields={fields} presetRows={preset} saving={saving} error={error}
    onClose={() => { if (!saving) onClose(); }} onApply={apply} />;
}
