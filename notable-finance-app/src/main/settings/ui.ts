// UI preferences stored in app_settings (profile, theme, workspace views, page filters).
import { getSqlite } from '../db'
import type {
  UiAccountsFilters,
  UiExpenseFilters,
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

const DEFAULT_WORKSPACE: UiWorkspaceSettings = {
  selectedDate: null,
  incomeViewMode: 'Monthly',
  expenseViewMode: 'Monthly',
  sidebarCollapsed: false,
  showFab: true,
  lastSection: 'dashboard'
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
  profile: { ...DEFAULT_PROFILE },
  theme: { ...DEFAULT_THEME },
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
    profile: mergeProfile(r.profile),
    theme: mergeTheme(r.theme),
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
  profile: Partial<UiProfileSettings>
  theme: Partial<UiThemeSettings>
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
    profile: patch.profile ? { ...current.profile, ...patch.profile } : current.profile,
    theme: patch.theme ? { ...current.theme, ...patch.theme } : current.theme,
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
  return next
}
