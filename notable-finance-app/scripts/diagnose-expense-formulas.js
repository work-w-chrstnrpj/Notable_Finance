// Read-only: paste into Notable Finance's DevTools Console.
// Reports one record's dependencies; omits names, amounts, IDs and tokens.
(async () => {
  const api = globalThis.window?.api;
  if (!api) throw new Error('Run inside the Notable Finance app DevTools Console');
  const description = globalThis.prompt('Exact description of ONE affected expense (used locally only):');
  if (!description) return;
  const responses = await Promise.all([
    api.expenses.list(), api.accounts.list({ includeInactive: true }), api.categories.expense(),
  ]);
  if (responses.some(response => !response.ok)) throw new Error('Local data read failed');
  const [expenses, accounts, categories] = responses.map(response => response.data);
  const matches = expenses.filter(record => record.description === description);
  if (matches.length !== 1) throw new Error(`Found ${matches.length} matches; use a unique description`);
  const record = matches[0];
  const account = accounts.find(item => item.id === record.accountId);
  const category = categories.find(item => item.id === record.categoryId);
  const available = Boolean(account && !account.inactive && account.type !== 'Auxiliary' && account.notionSynced);
  const reasons = [];
  if (!record.paymentFrequency) reasons.push('Payment Frequency missing');
  if (record.datePaid) reasons.push('Date Paid set: expected date intentionally blank');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.purchaseDate ?? '')) reasons.push('Purchase Date is not date-only ISO');
  if (!available && !['Daily', 'Weekly'].includes(record.paymentFrequency)) reasons.push('Account excluded from form/table lookup');
  if (record.paymentFrequency === 'Monthly' && !account?.billingDay) reasons.push('Billing Day missing or zero');
  if (!['Daily', 'Weekly'].includes(record.paymentFrequency) && !account?.dueDay) reasons.push('Due Day missing or zero');
  const report = {
    platform: globalThis.navigator?.platform,
    date: {
      purchaseDate: record.purchaseDate, datePaid: record.datePaid,
      paymentFrequency: record.paymentFrequency, periodCount: record.periodCount,
      bnplAdjustment: record.bnplAdjustment, billingDay: account?.billingDay ?? null,
      dueDay: account?.dueDay ?? null, blankReasons: reasons,
    },
    references: {
      accountFound: Boolean(account), accountInactive: account?.inactive ?? null,
      accountType: account?.type ?? null, accountAvailableToForm: available,
      categoryFound: Boolean(category), categoryMatchesPasabuy: /pasabuy/i.test(category?.name ?? ''),
      receiverLinked: Boolean(record.pasabuyAccountReceiverId),
      receiverFound: accounts.some(item => item.id === record.pasabuyAccountReceiverId),
    },
    balances: {
      paymentStatus: record.paymentStatus, paidPeriod: record.paidPeriod,
      periodCount: record.periodCount, pasabuyStatus: record.pasabuyStatus,
      pasabuyPaidPeriod: record.pasabuyPaidPeriod, syncState: record.syncState ?? null,
    },
  };
  globalThis.console.log(JSON.stringify(report, null, 2));
  return report;
})();
