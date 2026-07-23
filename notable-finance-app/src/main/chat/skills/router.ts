export type ChatSkillId =
  | 'ask-data'
  | 'ask-app'
  | 'monitoring-summary'
  | 'rebudget'
  | 'refuse-delete'
  | 'log-income'
  | 'log-expense'
  | 'edit-record'
  | 'workflow-transfer'
  | 'workflow-cc-payment'
  | 'workflow-alkansya'
  | 'workflow-receivables'
  | 'general'

export function routeChatSkill(userText: string): ChatSkillId {
  const t = userText.toLowerCase()

  if (
    /\b(delete|remove|trash|archive|hard\s*delete|soft\s*delete|burahin|i-delete|idelete|tanggalin)\b/.test(
      t
    ) &&
    /\b(income|expense|account|record|transaction|entry|bayad|utang|pasabuy|transfer|budget)\b/.test(
      t
    )
  ) {
    return 'refuse-delete'
  }

  if (
    /\brebudget\b|\breallocate\b|\bredistribut/.test(t) ||
    /same\s+(total\s+)?budget/.test(t) ||
    /i-shuffle.*budget|shuffle.*budget/.test(t)
  ) {
    return 'rebudget'
  }

  if (
    /monitoring\s+summary|monthly\s+monitoring|how\s+was\s+(january|february|march|april|may|june|july|august|september|october|november|december)/.test(
      t
    ) ||
    /summary\s+for\s+\d{4}-\d{2}|breakdown\s+for\s+(last|this)\s+month|paano\s+ang\s+monitoring/.test(
      t
    )
  ) {
    return 'monitoring-summary'
  }

  // Workflows before generic ask-app / ask-data
  if (
    /\btransfer\b/.test(t) &&
    /\b(from|to|→|->|galing|papunta|move\s+money|ilipat)\b/.test(t)
  ) {
    return 'workflow-transfer'
  }
  if (
    /\b(cc\s*payment|credit\s*card\s*payment)\b/.test(t) ||
    /\b(bayad|pay)\b/.test(t) && /\b(cc|credit(\s*card)?)\b/.test(t)
  ) {
    return 'workflow-cc-payment'
  }
  if (/\b(alkansya|mag-?ipon|savings\s+set\s+aside)\b/.test(t)) {
    return 'workflow-alkansya'
  }
  if (/\b(receivable|utang\s+sa\s+akin|iou\s+collect)\b/.test(t)) {
    return 'workflow-receivables'
  }

  if (
    /\b(add|log|create|record|encode)\b/.test(t) &&
    /\bincome|salary|sahod|payroll\b/.test(t)
  ) {
    return 'log-income'
  }

  if (
    /\b(add|log|create|record|encode|spent|bayad|gastos)\b/.test(t) &&
    /\bexpense|gastos|pasabuy|dating|food|swiped|purchase\b/.test(t)
  ) {
    return 'log-expense'
  }

  if (
    /\b(change|update|edit|set|mark\s+as|i-edit|palitan)\b/.test(t) &&
    /\b(income|expense|date\s*paid|paid|amount|category)\b/.test(t)
  ) {
    return 'edit-record'
  }

  if (
    /how\s+does\s+|what\s+is\s+|difference\s+between|ano\s+ang\s+|paano\s+(ba\s+)?(gumagana|mag)/.test(
      t
    ) ||
    (/\b(soft\s*delete|hard\s*delete|pasabuy|transfer|alkansya|receivables|sync)\b/.test(t) &&
      /how|what|explain|ano|paano/.test(t))
  ) {
    return 'ask-app'
  }

  if (
    /how\s+much|what.?s\s+left|summary|list\s+my|compare|budget|spent|spending|income|expense|unpaid|pasabuy|account/.test(
      t
    )
  ) {
    return 'ask-data'
  }

  return 'general'
}

export function skillSystemAddendum(skill: ChatSkillId, todayIso: string, currentMonth: string): string {
  const base = `Today is ${todayIso}. Default month context is ${currentMonth} unless the user specifies otherwise.`
  const writeRules = `
Write rules:
- Use propose* tools to create drafts only. Never claim a record was saved until the user Approves in the UI.
- If missingRequired is non-empty, ask for those fields (clarify). Do not invent accounts/categories.
- There is no delete tool. Refuse finance deletes.`

  switch (skill) {
    case 'monitoring-summary':
      return `${base}
Active skill: monitoring-summary.
1. Resolve the target month. If missing, ask once.
2. Call getMonthlyMonitoringSnapshot (+ budget tools as needed).
3. Answer with month metrics. No writes.`

    case 'rebudget':
      return `${base}
Active skill: rebudget (NO writes).
Use planRebudget with same-total adjustments. Remind user to apply in Monthly Monitoring.`

    case 'ask-data':
      return `${base}
Active skill: ask-data. Use read tools. Ask once if scope is missing.`

    case 'ask-app':
      return `${base}
Active skill: ask-app. Call explainAppTopic. Chat cannot delete finance records.`

    case 'refuse-delete':
      return `${base}
Active skill: refuse-delete. Do not call tools. Refuse any finance delete.`

    case 'log-income':
      return `${base}
Active skill: log-income.
1. listAccounts + listIncomeCategories (normalOnly).
2. proposeCreateIncome with name, date, amount, account, category.
3. If draft needs_input, ask for missing fields.
${writeRules}`

    case 'log-expense':
      return `${base}
Active skill: log-expense (base / CC / Pasabuy).
1. listAccounts + listExpenseCategories; getExpenseFieldSchema when account/category known.
2. proposeCreateExpense — set creditCard/pasabuy profile when applicable.
3. Clarify missing required fields (account, Payment Status, Pasabuyer, etc.).
${writeRules}`

    case 'edit-record':
      return `${base}
Active skill: edit-income / edit-expense.
1. queryIncomes or queryExpenses to find targets.
2. proposeUpdate* or proposeMassUpdate* (max 50). If ambiguous, list matches and ask which.
${writeRules}`

    case 'workflow-transfer':
      return `${base}
Active skill: workflow-transfer.
Call proposeCreateTransfer with date, amount, source + transfer (non-credit) accounts. Category locks to Transfer.
${writeRules}`

    case 'workflow-cc-payment':
      return `${base}
Active skill: workflow-cc-payment.
Call proposeCreateCcPayment with date, amount, CC (credit-like) + payer (non-credit) accounts.
${writeRules}`

    case 'workflow-alkansya':
      return `${base}
Active skill: workflow-alkansya.
Call proposeCreateAlkansya with date, amount, non-credit account (Savings category default).
${writeRules}`

    case 'workflow-receivables':
      return `${base}
Active skill: workflow-receivables.
Call proposeCreateReceivable with name, date, amount, category (account may be empty).
${writeRules}`

    default:
      return `${base}
You may use read tools and propose* write drafts when the user wants to log/edit.
${writeRules}`
  }
}
