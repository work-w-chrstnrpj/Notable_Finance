// UI preferences stored in app_settings (profile, theme, workspace views, page filters).
import { getSqlite } from '../db'
import type {
  UiAccountsFilters,
  UiExpenseFilters,
  UiFontSettings,
  UiIncomeFilters,
  UiMonitoringFilters,
  UiProfileSettings,
  UiSettings,
  UiThemeSettings,
  UiWorkspaceSettings
} from '../../shared/finance.types'

const KEY = 'ui.settings'

const DEFAULT_PROFILE: UiProfileSettings = {
  displayName: 'Local User',
  avatarDataUrl: null
}

const DEFAULT_THEME: UiThemeSettings = {
  mode: 'system',
  primaryColor: '#5b6cf9',
  secondaryColor: '#0d9488'
}

const DEFAULT_FONTS: UiFontSettings = {
  bodyFont: 'Inter',
  monoFont: 'DM Mono',
  brandFont: 'Instrument Serif',
  receiptFont: 'Instrument Serif'
}

const DEFAULT_WORKSPACE: UiWorkspaceSettings = {
  selectedDate: null,
  incomeViewMode: 'Monthly',
  expenseViewMode: 'Monthly',
  sidebarCollapsed: false,
  showFab: true,
  pushFabAutoHideMs: 180_000,
  lastSection: 'dashboard'
}

/** Clamp the push-FAB auto-hide between 10s and 30min; fall back to default. */
function coercePushFabAutoHideMs(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_WORKSPACE.pushFabAutoHideMs
  return Math.min(Math.max(Math.round(n), 10_000), 1_800_000)
}

const DEFAULT_INCOME: UiIncomeFilters = {
  accountId: '',
  categoryId: '',
  filterActive: false,
  annualView: 'table',
  groupBy: 'month'
}

const DEFAULT_EXPENSE: UiExpenseFilters = {
  accountFilterId: '',
  expenseCategoryFilter: '',
  pasabuyerFilter: '',
  filterActive: false,
  annualView: 'table',
  groupBy: 'month'
}

const DEFAULT_ACCOUNTS: UiAccountsFilters = {
  viewMode: 'cards',
  accountScope: 'standard',
  hideZeroBalance: false,
  cardTypeFilter: ''
}

const DEFAULT_MONITORING: UiMonitoringFilters = {
  incomeCategoryView: 'table',
  expenseCategoryView: 'simplified',
  hideZeroIncomeCategories: false,
  zeroFilter: 'all'
}

export const DEFAULT_UI_SETTINGS: UiSettings = {
  hardDeleteEnabled: false,
  chatEnabled: false,
  chatPreferAppleReadOnly: false,
  chatDefaultModel: 'gpt-4o-mini',
  devModeEnabled: false,
  profile: { ...DEFAULT_PROFILE },
  theme: { ...DEFAULT_THEME },
  fonts: { ...DEFAULT_FONTS },
  workspace: { ...DEFAULT_WORKSPACE },
  incomeFilters: { ...DEFAULT_INCOME },
  expenseFilters: { ...DEFAULT_EXPENSE },
  accountsFilters: { ...DEFAULT_ACCOUNTS },
  monitoringFilters: { ...DEFAULT_MONITORING }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function mergeProfile(raw: unknown): UiProfileSettings {
  const r = asRecord(raw)
  const name = typeof r.displayName === 'string' ? r.displayName.trim() : ''
  const avatar =
    typeof r.avatarDataUrl === 'string' && r.avatarDataUrl.startsWith('data:image/')
      ? r.avatarDataUrl
      : null
  return {
    displayName: name || DEFAULT_PROFILE.displayName,
    avatarDataUrl: avatar
  }
}

function mergeTheme(raw: unknown): UiThemeSettings {
  const r = asRecord(raw)
  const mode = r.mode
  return {
    mode: mode === 'light' || mode === 'dark' || mode === 'system' ? mode : DEFAULT_THEME.mode,
    primaryColor:
      typeof r.primaryColor === 'string' && r.primaryColor ? r.primaryColor : DEFAULT_THEME.primaryColor,
    secondaryColor:
      typeof r.secondaryColor === 'string' && r.secondaryColor
        ? r.secondaryColor
        : DEFAULT_THEME.secondaryColor
  }
}

function mergeFonts(raw: unknown): UiFontSettings {
  const r = asRecord(raw)
  return {
    bodyFont: typeof r.bodyFont === 'string' && r.bodyFont ? r.bodyFont : DEFAULT_FONTS.bodyFont,
    monoFont: typeof r.monoFont === 'string' && r.monoFont ? r.monoFont : DEFAULT_FONTS.monoFont,
    brandFont: typeof r.brandFont === 'string' && r.brandFont ? r.brandFont : DEFAULT_FONTS.brandFont,
    receiptFont: typeof r.receiptFont === 'string' && r.receiptFont ? r.receiptFont : DEFAULT_FONTS.receiptFont
  }
}

const INCOME_MODES = new Set(['Daily', 'Weekly', 'Monthly', 'Annually'])
const EXPENSE_MODES = new Set([
  'Daily',
  'Weekly',
  'Monthly',
  'Annually',
  'To pay',
  'To buy',
  'Installments',
  'Unpaid CC',
  'Unpaid Pasabuy'
])
const GROUP_BY = new Set(['month', 'account', 'category'])
const ACCOUNT_SCOPES = new Set(['standard', 'credit', 'all'])
const ZERO_FILTERS = new Set(['all', 'hide-both', 'hide-spending', 'hide-budget'])

function mergeWorkspace(raw: unknown): UiWorkspaceSettings {
  const r = asRecord(raw)
  const incomeViewMode =
    typeof r.incomeViewMode === 'string' && INCOME_MODES.has(r.incomeViewMode)
      ? (r.incomeViewMode as UiWorkspaceSettings['incomeViewMode'])
      : DEFAULT_WORKSPACE.incomeViewMode
  const expenseViewMode =
    typeof r.expenseViewMode === 'string' && EXPENSE_MODES.has(r.expenseViewMode)
      ? (r.expenseViewMode as UiWorkspaceSettings['expenseViewMode'])
      : DEFAULT_WORKSPACE.expenseViewMode
  return {
    selectedDate: typeof r.selectedDate === 'string' && r.selectedDate ? r.selectedDate : null,
    incomeViewMode,
    expenseViewMode,
    sidebarCollapsed: r.sidebarCollapsed === true,
    showFab: r.showFab !== false,
    pushFabAutoHideMs: coercePushFabAutoHideMs(r.pushFabAutoHideMs),
    lastSection:
      typeof r.lastSection === 'string' && r.lastSection ? r.lastSection : DEFAULT_WORKSPACE.lastSection
  }
}

function mergeIncome(raw: unknown): UiIncomeFilters {
  const r = asRecord(raw)
  const groupBy =
    typeof r.groupBy === 'string' && GROUP_BY.has(r.groupBy)
      ? (r.groupBy as UiIncomeFilters['groupBy'])
      : DEFAULT_INCOME.groupBy
  return {
    accountId: typeof r.accountId === 'string' ? r.accountId : '',
    categoryId: typeof r.categoryId === 'string' ? r.categoryId : '',
    filterActive: r.filterActive === true,
    annualView: r.annualView === 'chart' ? 'chart' : 'table',
    groupBy
  }
}

function mergeExpense(raw: unknown): UiExpenseFilters {
  const r = asRecord(raw)
  const groupBy =
    typeof r.groupBy === 'string' && GROUP_BY.has(r.groupBy)
      ? (r.groupBy as UiExpenseFilters['groupBy'])
      : DEFAULT_EXPENSE.groupBy
  return {
    accountFilterId: typeof r.accountFilterId === 'string' ? r.accountFilterId : '',
    expenseCategoryFilter:
      typeof r.expenseCategoryFilter === 'string' ? r.expenseCategoryFilter : '',
    pasabuyerFilter: typeof r.pasabuyerFilter === 'string' ? r.pasabuyerFilter : '',
    filterActive: r.filterActive === true,
    annualView: r.annualView === 'chart' ? 'chart' : 'table',
    groupBy
  }
}

function mergeAccounts(raw: unknown): UiAccountsFilters {
  const r = asRecord(raw)
  const accountScope =
    typeof r.accountScope === 'string' && ACCOUNT_SCOPES.has(r.accountScope)
      ? (r.accountScope as UiAccountsFilters['accountScope'])
      : DEFAULT_ACCOUNTS.accountScope
  return {
    viewMode: r.viewMode === 'table' ? 'table' : 'cards',
    accountScope,
    hideZeroBalance: r.hideZeroBalance === true,
    cardTypeFilter: typeof r.cardTypeFilter === 'string' ? r.cardTypeFilter : ''
  }
}

function mergeMonitoring(raw: unknown): UiMonitoringFilters {
  const r = asRecord(raw)
  const zeroFilter =
    typeof r.zeroFilter === 'string' && ZERO_FILTERS.has(r.zeroFilter)
      ? (r.zeroFilter as UiMonitoringFilters['zeroFilter'])
      : DEFAULT_MONITORING.zeroFilter
  return {
    incomeCategoryView:
      typeof r.incomeCategoryView === 'string' && r.incomeCategoryView
        ? r.incomeCategoryView
        : DEFAULT_MONITORING.incomeCategoryView,
    expenseCategoryView:
      typeof r.expenseCategoryView === 'string' && r.expenseCategoryView
        ? r.expenseCategoryView
        : DEFAULT_MONITORING.expenseCategoryView,
    hideZeroIncomeCategories: r.hideZeroIncomeCategories === true,
    zeroFilter
  }
}

export function normalizeUiSettings(raw: unknown): UiSettings {
  const r = asRecord(raw)
  return {
    hardDeleteEnabled: r.hardDeleteEnabled === true,
    chatEnabled: r.chatEnabled === true,
    chatPreferAppleReadOnly: r.chatPreferAppleReadOnly === true,
    chatDefaultModel:
      typeof r.chatDefaultModel === 'string' && r.chatDefaultModel.trim()
        ? r.chatDefaultModel.trim()
        : DEFAULT_UI_SETTINGS.chatDefaultModel,
    devModeEnabled: r.devModeEnabled === true,
    profile: mergeProfile(r.profile),
    theme: mergeTheme(r.theme),
    fonts: mergeFonts(r.fonts),
    workspace: mergeWorkspace(r.workspace),
    incomeFilters: mergeIncome(r.incomeFilters),
    expenseFilters: mergeExpense(r.expenseFilters),
    accountsFilters: mergeAccounts(r.accountsFilters),
    monitoringFilters: mergeMonitoring(r.monitoringFilters)
  }
}

export function getUiSettings(): UiSettings {
  const row = getSqlite().prepare('SELECT value FROM app_settings WHERE key = ?').get(KEY) as
    | { value: string }
    | undefined
  if (!row?.value) return structuredClone(DEFAULT_UI_SETTINGS)
  try {
    return normalizeUiSettings(JSON.parse(row.value))
  } catch {
    return structuredClone(DEFAULT_UI_SETTINGS)
  }
}

export function setUiSettings(patch: Partial<{
  hardDeleteEnabled: boolean
  chatEnabled: boolean
  chatPreferAppleReadOnly: boolean
  chatDefaultModel: string
  devModeEnabled: boolean
  profile: Partial<UiProfileSettings>
  theme: Partial<UiThemeSettings>
  fonts: Partial<UiFontSettings>
  workspace: Partial<UiWorkspaceSettings>
  incomeFilters: Partial<UiIncomeFilters>
  expenseFilters: Partial<UiExpenseFilters>
  accountsFilters: Partial<UiAccountsFilters>
  monitoringFilters: Partial<UiMonitoringFilters>
}>): UiSettings {
  const current = getUiSettings()
  const next = normalizeUiSettings({
    hardDeleteEnabled:
      patch.hardDeleteEnabled === undefined ? current.hardDeleteEnabled : patch.hardDeleteEnabled,
    chatEnabled: patch.chatEnabled === undefined ? current.chatEnabled : patch.chatEnabled,
    chatPreferAppleReadOnly:
      patch.chatPreferAppleReadOnly === undefined
        ? current.chatPreferAppleReadOnly
        : patch.chatPreferAppleReadOnly,
    chatDefaultModel:
      patch.chatDefaultModel === undefined ? current.chatDefaultModel : patch.chatDefaultModel,
    devModeEnabled:
      patch.devModeEnabled === undefined ? current.devModeEnabled : patch.devModeEnabled,
    profile: patch.profile ? { ...current.profile, ...patch.profile } : current.profile,
    theme: patch.theme ? { ...current.theme, ...patch.theme } : current.theme,
    fonts: patch.fonts ? { ...current.fonts, ...patch.fonts } : current.fonts,
    workspace: patch.workspace ? { ...current.workspace, ...patch.workspace } : current.workspace,
    incomeFilters: patch.incomeFilters
      ? { ...current.incomeFilters, ...patch.incomeFilters }
      : current.incomeFilters,
    expenseFilters: patch.expenseFilters
      ? { ...current.expenseFilters, ...patch.expenseFilters }
      : current.expenseFilters,
    accountsFilters: patch.accountsFilters
      ? { ...current.accountsFilters, ...patch.accountsFilters }
      : current.accountsFilters,
    monitoringFilters: patch.monitoringFilters
      ? { ...current.monitoringFilters, ...patch.monitoringFilters }
      : current.monitoringFilters
  })
  getSqlite()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(KEY, JSON.stringify(next))

  // Turning Dev Mode off clears the in-memory ring buffer for this process.
  if (current.devModeEnabled && !next.devModeEnabled) {
    try {
      // Lazy require avoids circular import at module load (settings ↔ windows ↔ …).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { clearDevLogs } = require('../dev-logs/store') as {
        clearDevLogs: () => number
      }
      clearDevLogs()
    } catch {
      /* ignore */
    }
  }

  return next
}
