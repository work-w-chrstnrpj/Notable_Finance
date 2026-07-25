// SQLite schema (drizzle) for the local-first store.
// Mirrors wiki/desktop/local-data-schema.md. DB columns are snake_case; TS keys camelCase.
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// --- common sync bookkeeping carried by every writable finance table ---
const syncColumns = {
  id: text('id').primaryKey(), // local UUID, minted offline
  notionPageId: text('notion_page_id'), // null until first push
  baseSnapshot: text('base_snapshot'), // JSON: writable fields as of last sync (merge ancestor)
  syncState: text('sync_state').notNull().default('dirty'), // clean | dirty | conflict
  localUpdatedAt: integer('local_updated_at').notNull(), // ms
  notionLastEditedAt: text('notion_last_edited_at'), // minute-rounded hint only
  deleted: integer('deleted').notNull().default(0), // soft-delete flag
  createdAt: integer('created_at').notNull() // ms
}

// --- reference caches (read-only, pulled from Notion) ---
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  notionPageId: text('notion_page_id'),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(),
  startingBalance: real('starting_balance').notNull().default(0),
  creditLimit: real('credit_limit'),
  inactive: integer('inactive').notNull().default(0),
  billingDay: integer('billing_day'),
  dueDay: integer('due_day'),
  annualFee: real('annual_fee'),
  creditPoints: real('credit_points'),
  qrCode: text('qr_code'), // Notion "Qr Code" file URL (pulled read-only)
  icon: text('icon'), // Notion page icon: emoji char, or cached image data URI
  notionLastEditedAt: text('notion_last_edited_at'),
  createdAt: integer('created_at').notNull()
})

export const incomeCategories = sqliteTable('income_categories', {
  id: text('id').primaryKey(),
  notionPageId: text('notion_page_id'),
  source: text('source').notNull(),
  auxiliary: integer('auxiliary').notNull().default(0),
  icon: text('icon'), // Notion page icon (emoji or image URL)
  notionLastEditedAt: text('notion_last_edited_at'),
  createdAt: integer('created_at').notNull()
})

export const expenseCategories = sqliteTable('expense_categories', {
  id: text('id').primaryKey(),
  notionPageId: text('notion_page_id'),
  name: text('name').notNull(),
  monthlyBudget: real('monthly_budget').notNull().default(0),
  auxiliary: integer('auxiliary').notNull().default(0),
  icon: text('icon'), // Notion page icon (emoji or image URL)
  notionLastEditedAt: text('notion_last_edited_at'),
  createdAt: integer('created_at').notNull()
})

// --- writable finance tables ---
export const incomes = sqliteTable('incomes', {
  ...syncColumns,
  title: text('title').notNull(),
  grossIncome: real('gross_income').notNull().default(0),
  capitalExpenditure: real('capital_expenditure').notNull().default(0),
  accountId: text('account_id'),
  categoryId: text('category_id'),
  date: text('date'),
  notes: text('notes'),
  isTransaction: integer('is_transaction').notNull().default(0),
  transactedAccountId: text('transacted_account_id'),
  ccPaymentCoveredId: text('cc_payment_covered_id')
})

export const expenses = sqliteTable('expenses', {
  ...syncColumns,
  title: text('title').notNull(),
  amount: real('amount').notNull().default(0),
  interest: real('interest').notNull().default(0),
  accountId: text('account_id'),
  categoryId: text('category_id'),
  purchaseDate: text('purchase_date'),
  datePaid: text('date_paid'),
  paymentStatus: text('payment_status'),
  paymentFrequency: text('payment_frequency'),
  periodCount: integer('period_count'),
  paidPeriod: integer('paid_period'),
  isPasabuy: integer('is_pasabuy').notNull().default(0),
  pasabuyer: text('pasabuyer'),
  pasabuyStatus: text('pasabuy_status'),
  pasabuyDateOfPayment: text('pasabuy_date_of_payment'),
  pasabuyPaidPeriod: integer('pasabuy_paid_period'),
  pasabuyAccountReceiverId: text('pasabuy_account_receiver_id'),
  ccLinkPaymentReceiptId: text('cc_link_payment_receipt_id')
})

export const expenseScheduler = sqliteTable('expense_scheduler', {
  ...syncColumns,
  title: text('title').notNull(),
  amount: real('amount').notNull().default(0),
  accountId: text('account_id'),
  categoryId: text('category_id'),
  frequency: text('frequency'),
  nextRunDate: text('next_run_date'),
  active: integer('active').notNull().default(1)
})

// --- bookkeeping ---
export const conflicts = sqliteTable('conflicts', {
  id: text('id').primaryKey(),
  recordTable: text('record_table').notNull(),
  recordId: text('record_id').notNull(),
  field: text('field').notNull(),
  baseValue: text('base_value'),
  localValue: text('local_value'),
  remoteValue: text('remote_value'),
  detectedAt: integer('detected_at').notNull(),
  resolvedAt: integer('resolved_at'),
  resolution: text('resolution') // local | remote | manual
})

export const syncMeta = sqliteTable('sync_meta', {
  key: text('key').primaryKey(),
  value: text('value')
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value')
})

export const mutationQueue = sqliteTable('mutation_queue', {
  id: text('id').primaryKey(),
  resource: text('resource').notNull(),
  action: text('action').notNull(), // create | update | delete
  recordId: text('record_id').notNull(),
  payload: text('payload'), // JSON
  createdAt: integer('created_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error')
})

// Durable history feed of completed sync events (powers the History section).
// Unlike mutation_queue (which is cleared on push), rows here persist so the user can
// see the last synced items with their status and direction.
export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  runId: text('run_id'), // groups events by the sync pass that produced them
  resource: text('resource').notNull(), // incomes | expenses
  recordId: text('record_id').notNull(), // local id
  notionPageId: text('notion_page_id'), // known once linked
  title: text('title'), // snapshot of the record title at event time
  action: text('action').notNull(), // create | update | delete
  direction: text('direction').notNull(), // pull (Notion DB → App) | push (App → Notion DB)
  at: integer('at').notNull() // ms timestamp
})

/** Chat API key metadata — raw keys live in safeStorage vault files, not here. */
export const chatCredentials = sqliteTable('chat_credentials', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyFingerprint: text('key_fingerprint').notNull(),
  isDefault: integer('is_default').notNull().default(0),
  createdAt: integer('created_at').notNull()
})

export const chatThreads = sqliteTable('chat_threads', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  credentialId: text('credential_id'),
  modelId: text('model_id'),
  overlay: text('overlay').notNull().default('default'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  role: text('role').notNull(), // user | assistant | system
  content: text('content').notNull(),
  payloadJson: text('payload_json'),
  createdAt: integer('created_at').notNull()
})

// Confirm-gated write proposals. Durable mirror of the in-memory draft store so
// a proposed create/update survives an app restart before the user Approves.
export const chatDrafts = sqliteTable('chat_drafts', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  resource: text('resource').notNull(), // incomes | expenses
  action: text('action').notNull(), // create | update
  kind: text('kind').notNull(),
  status: text('status').notNull(), // needs_input | ready | applied | cancelled
  summary: text('summary').notNull(),
  missingRequired: text('missing_required').notNull(), // JSON string[]
  warnings: text('warnings').notNull(), // JSON string[]
  payload: text('payload').notNull(), // JSON object
  targetIds: text('target_ids'), // JSON string[] | null
  computedPreview: text('computed_preview'), // JSON | null
  display: text('display'), // JSON ChatDraftDisplay | null
  createdAt: integer('created_at').notNull()
})

export const schema = {
  accounts,
  incomeCategories,
  expenseCategories,
  incomes,
  expenses,
  expenseScheduler,
  conflicts,
  syncMeta,
  appSettings,
  mutationQueue,
  activityLog,
  chatCredentials,
  chatThreads,
  chatMessages,
  chatDrafts
}
