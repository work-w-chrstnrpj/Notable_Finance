import { platform as osPlatform } from 'node:os'
import type { ChatSkillId } from './skills/router'
import { getUiSettings } from '../settings/ui'
import {
  explainAppTopic,
  getCategoryBudgetStatus,
  getDashboardSummary,
  getMonthlyMonitoringSnapshot,
  queryExpenses,
  queryIncomes
} from './tools/read-tools'
import { currentMonth, resolveMonth, todayIso } from './dates'

/** Env: treat Apple as Available without probing Foundation Models (CI / no FM). */
export const APPLE_FORCE_ENV = 'NOTABLE_FORCE_APPLE_AVAILABLE'

export type AppleStatusKind = 'available' | 'unavailable' | 'unsupported'

export type AppleProbeResult = {
  osSupported: boolean
  available: boolean
  status: AppleStatusKind
  label: string
  detail: string
  reasonCode?: string
  mode: 'none' | 'foundation-models' | 'force'
}

type AppleClient = {
  compatibility: { check: () => Promise<{ compatible: boolean; reasonCode?: string }> }
  responses: {
    create: (params: {
      input: string
      max_output_tokens?: number
      timeoutMs?: number
    }) => Promise<
      | { ok: true; text: string; request_id: string }
      | { ok: false; error: { code: string; detail: string } }
    >
  }
  shutdown: () => Promise<void>
}

const PROBE_TTL_MS = 30_000

let sharedClient: AppleClient | null = null
let clientPromise: Promise<AppleClient> | null = null
let probeCache: { at: number; result: AppleProbeResult } | null = null

async function getClient(): Promise<AppleClient> {
  if (sharedClient) return sharedClient
  if (!clientPromise) {
    clientPromise = (async () => {
      const mod = await import('apple-local-llm')
      const client = mod.createClient({
        onLog: (message: string) => {
          console.log(`[apple-local-llm] ${message}`)
        }
      })
      sharedClient = client
      return client
    })().catch((err) => {
      clientPromise = null
      throw err
    })
  }
  return clientPromise
}

/** Tear down the fm-proxy helper on app quit. */
export async function shutdownAppleClient(): Promise<void> {
  probeCache = null
  clientPromise = null
  if (!sharedClient) return
  const client = sharedClient
  sharedClient = null
  try {
    await client.shutdown()
  } catch (err) {
    console.warn('[apple-local-llm] shutdown failed', err)
  }
}

/** Invalidate cached compatibility so Configure AI can refresh after System Settings changes. */
export function invalidateAppleProbeCache(): void {
  probeCache = null
}

export function appleReasonUserCopy(code?: string | null): { label: string; detail: string } {
  switch (code) {
    case 'NOT_DARWIN':
      return {
        label: 'Not supported',
        detail: 'Apple Intelligence read-only Q&A is only available on macOS.'
      }
    case 'UNSUPPORTED_HARDWARE':
      return {
        label: 'Not supported',
        detail: 'Needs an Apple Silicon Mac (M1 or later).'
      }
    case 'AI_DISABLED':
      return {
        label: 'Unavailable',
        detail:
          'Turn on Apple Intelligence in System Settings → Apple Intelligence, wait for the on-device model if needed, then restart Notable Finance.'
      }
    case 'MODEL_NOT_READY':
      return {
        label: 'Unavailable',
        detail:
          'The on-device model is still downloading. Try again in a few minutes, then restart the app.'
      }
    case 'HELPER_NOT_FOUND':
    case 'SPAWN_FAILED':
    case 'HELPER_UNHEALTHY':
    case 'PROTOCOL_MISMATCH':
      return {
        label: 'Unavailable',
        detail:
          'Apple helper could not start (app packaging issue). Reinstall Notable Finance or report this.'
      }
    default:
      return {
        label: 'Unavailable',
        detail: code
          ? `Apple Intelligence is not ready (${code}). Check System Settings → Apple Intelligence, then restart the app.`
          : 'Apple Intelligence is not ready on this Mac.'
      }
  }
}

function forceProbeResult(): AppleProbeResult {
  return {
    osSupported: true,
    available: true,
    status: 'available',
    label: 'Available',
    detail:
      'On-device read-only summaries enabled (dev/force). Cannot create or edit records — use a named API key for writes.',
    mode: 'force'
  }
}

function fromCompat(input: {
  compatible: boolean
  reasonCode?: string
  platform: NodeJS.Platform
}): AppleProbeResult {
  const plat = input.platform
  if (plat !== 'darwin') {
    const copy = appleReasonUserCopy('NOT_DARWIN')
    return {
      osSupported: false,
      available: false,
      status: 'unsupported',
      label: copy.label,
      detail: copy.detail,
      reasonCode: 'NOT_DARWIN',
      mode: 'none'
    }
  }

  if (input.compatible) {
    return {
      osSupported: true,
      available: true,
      status: 'available',
      label: 'Available',
      detail:
        'Apple Intelligence is ready for read-only ask/summarize on this Mac (no cloud). Cannot create or edit — use a named API key for writes.',
      mode: 'foundation-models'
    }
  }

  const code = input.reasonCode ?? 'AI_DISABLED'
  const copy = appleReasonUserCopy(code)
  const unsupported = code === 'UNSUPPORTED_HARDWARE' || code === 'NOT_DARWIN'
  return {
    osSupported: !unsupported,
    available: false,
    status: unsupported ? 'unsupported' : 'unavailable',
    label: copy.label,
    detail: copy.detail,
    reasonCode: String(code),
    mode: 'none'
  }
}

/**
 * Probe Apple Foundation Models readiness via bundled fm-proxy.
 * Result is cached briefly; pass `forceRefresh` after the user changes System Settings.
 */
export async function probeAppleReadOnly(input?: {
  platform?: NodeJS.Platform
  env?: NodeJS.ProcessEnv
  forceRefresh?: boolean
  /** Test injection: skip real helper. */
  compatibility?: { compatible: boolean; reasonCode?: string }
}): Promise<AppleProbeResult> {
  const plat = input?.platform ?? osPlatform()
  const env = input?.env ?? process.env

  if (plat !== 'darwin') {
    return fromCompat({ compatible: false, reasonCode: 'NOT_DARWIN', platform: plat })
  }

  const forced = env[APPLE_FORCE_ENV] === '1' || env[APPLE_FORCE_ENV] === 'true'
  if (forced) return forceProbeResult()

  if (input?.compatibility) {
    return fromCompat({
      compatible: input.compatibility.compatible,
      reasonCode: input.compatibility.reasonCode,
      platform: plat
    })
  }

  if (
    !input?.forceRefresh &&
    probeCache &&
    Date.now() - probeCache.at < PROBE_TTL_MS &&
    plat === osPlatform()
  ) {
    return probeCache.result
  }

  try {
    const client = await getClient()
    const compat = await client.compatibility.check()
    const result = fromCompat({
      compatible: compat.compatible,
      reasonCode: compat.reasonCode,
      platform: plat
    })
    probeCache = { at: Date.now(), result }
    return result
  } catch (err) {
    const result = fromCompat({
      compatible: false,
      reasonCode: 'SPAWN_FAILED',
      platform: plat
    })
    result.detail = `${result.detail} (${err instanceof Error ? err.message : String(err)})`
    probeCache = { at: Date.now(), result }
    return result
  }
}

/** Skills that may run without BYOK when Apple prefer + available. */
export function isAppleReadOnlySkill(skill: ChatSkillId): boolean {
  return (
    skill === 'ask-data' ||
    skill === 'ask-app' ||
    skill === 'monitoring-summary' ||
    skill === 'rebudget' ||
    skill === 'general' ||
    skill === 'refuse-delete'
  )
}

export function shouldUseAppleReadOnly(input: {
  preferApple: boolean
  appleAvailable: boolean
  skill: ChatSkillId
}): boolean {
  return input.preferApple && input.appleAvailable && isAppleReadOnlySkill(input.skill)
}

function monthFromText(text: string): string {
  const iso = text.match(/\b(20\d{2}-\d{2})\b/)?.[1]
  if (iso) return iso
  const rel = text.match(/\b(this month|last month|current month|previous month)\b/i)?.[1]
  if (rel) return resolveMonth(rel) ?? currentMonth()
  const named = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s*20\d{2}\b/i
  )?.[0]
  if (named) return resolveMonth(named) ?? currentMonth()
  return currentMonth()
}

/** Prefer the app header date when set so Chat “today” matches Expense Daily. */
export function resolveAppleAskDate(
  userText: string,
  selectedDate?: string | null
): {
  date: string
  source: 'workspace-selected-date' | 'calendar-today' | 'explicit-iso'
} {
  const explicit = userText.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1]
  if (explicit) return { date: explicit, source: 'explicit-iso' }

  const wantsToday = /\b(today|today'?s)\b/i.test(userText)
  if (wantsToday) {
    const ws = selectedDate?.trim()
    if (ws && /^\d{4}-\d{2}-\d{2}$/.test(ws)) {
      return { date: ws, source: 'workspace-selected-date' }
    }
    return { date: todayIso(), source: 'calendar-today' }
  }

  return { date: todayIso(), source: 'calendar-today' }
}

function isDayScopedExpenseAsk(userText: string): boolean {
  return (
    /\b(today|today'?s)\b/i.test(userText) &&
    /\b(expense|expenses|spent|spend|bili|gastos)\b/i.test(userText)
  )
}

function isDayScopedIncomeAsk(userText: string): boolean {
  return (
    /\b(today|today'?s)\b/i.test(userText) &&
    /\b(income|incomes|earned|sahod|sweldo)\b/i.test(userText)
  )
}

/** Deterministic empty-day answers — do not call Foundation Models (avoids category hallucinations). */
export function appleEmptyDayAnswer(tools: Record<string, unknown>): string | null {
  const scope = tools.dayScope as { date?: string; source?: string } | undefined
  const date = scope?.date
  if (!date) return null

  const exp = tools.queryExpensesForDay as { count?: number; totalAmount?: number } | undefined
  const inc = tools.queryIncomesForDay as { count?: number; totalGrossIncome?: number } | undefined

  if (exp && (exp.count ?? 0) === 0 && !inc) {
    return `No expenses on ${date}. (Matches the Expense Daily view for that date — nothing to list.)`
  }
  if (inc && (inc.count ?? 0) === 0 && !exp) {
    return `No income records on ${date}.`
  }
  if (exp && inc && (exp.count ?? 0) === 0 && (inc.count ?? 0) === 0) {
    return `No income or expenses on ${date}.`
  }
  return null
}

/** Exported for unit tests — gather allow-listed read tool JSON for the FM prompt. */
export function gatherAppleToolResults(
  skill: ChatSkillId,
  userText: string,
  opts?: { selectedDate?: string | null }
): Record<string, unknown> {
  const tools: Record<string, unknown> = {}
  const month = monthFromText(userText)
  const lower = userText.toLowerCase()
  const dayAsk = isDayScopedExpenseAsk(userText) || isDayScopedIncomeAsk(userText)

  switch (skill) {
    case 'refuse-delete':
      tools.policy = {
        message:
          'Chat cannot delete finance records. Soft delete and hard delete stay in the normal app UI.'
      }
      break
    case 'ask-app': {
      const topicMatch =
        userText.match(
          /\b(transfer|pasabuy|alkansya|receivables?|soft\s*delete|hard\s*delete|sync|monitoring|rebudget|cc\s*payment|credit\s*card\s*payment|chat)\b/i
        )?.[1] ?? 'Transfer'
      tools.explainAppTopic = explainAppTopic({ topic: topicMatch })
      break
    }
    case 'monitoring-summary':
      tools.getMonthlyMonitoringSnapshot = getMonthlyMonitoringSnapshot({ month })
      break
    case 'rebudget':
      tools.rebudgetPolicy = {
        message:
          'Rebudget stays plan-only on the Apple path. Use Monthly Monitoring in the app, or a named API key for a planRebudget table. Apple cannot write budgets.'
      }
      tools.getMonthlyMonitoringSnapshot = getMonthlyMonitoringSnapshot({ month })
      break
    case 'ask-data':
    case 'general':
    default: {
      // Day-scoped asks: ONLY that day’s rows. Never attach month dashboard/monitoring —
      // those category totals caused Foundation Models to invent “today” expense lists.
      if (dayAsk) {
        const selected =
          opts?.selectedDate !== undefined
            ? opts.selectedDate
            : getUiSettings().workspace.selectedDate
        const ask = resolveAppleAskDate(userText, selected)
        tools.dayScope = {
          date: ask.date,
          source: ask.source,
          note: 'Answer only from query*ForDay. If count is 0, say there are none. Never invent rows from category names.'
        }
        if (isDayScopedExpenseAsk(userText) || !isDayScopedIncomeAsk(userText)) {
          tools.queryExpensesForDay = queryExpenses({
            rangeStart: ask.date,
            rangeEnd: ask.date
          })
        }
        if (isDayScopedIncomeAsk(userText)) {
          tools.queryIncomesForDay = queryIncomes({
            rangeStart: ask.date,
            rangeEnd: ask.date
          })
        }
        break
      }

      tools.getDashboardSummary = getDashboardSummary({ month })
      if (/\b(budget|left|remaining|overspend)\b/i.test(lower)) {
        const cat =
          userText.match(/\b(?:in|for)\s+([A-Za-z][A-Za-z0-9 &/-]{1,40})\b/i)?.[1]?.trim() ??
          undefined
        tools.getCategoryBudgetStatus = getCategoryBudgetStatus({
          month,
          categoryName: cat
        })
      }
      // Only pull monitoring when the user asks for monitoring/margin — not merely “expense”.
      if (/\b(monitor(?:ing)?|margin|gross margin)\b/i.test(lower) && skill === 'ask-data') {
        tools.getMonthlyMonitoringSnapshot = getMonthlyMonitoringSnapshot({ month })
      }
      break
    }
  }

  return tools
}

const APPLE_SYSTEM = `You are Notable Finance's Finance Copilot on Apple Intelligence (read-only).
Answer from TOOL_RESULTS only. If a day query has count 0, say there are no records that day — do not invent a list.
Never invent amounts, balances, accounts, categories, or expense titles. Category names in other tools are NOT daily expenses.
Never claim you created, edited, deleted, or saved a record. Writes require a named API key and Approve in the app.
Be concise and natural. Use Philippine peso (₱) when quoting money from the tools. Prefer the tool’s totalAmount over mental math.`

/**
 * Read-only turn: main runs allow-listed read tools, then Apple FM summarizes.
 * Never proposes drafts or calls write tools.
 */
export async function runAppleReadOnlyTurn(input: {
  skill: ChatSkillId
  userText: string
  env?: NodeJS.ProcessEnv
  /** Override workspace selected date (tests / explicit scope). */
  selectedDate?: string | null
  /** Test injection for responses.create */
  respond?: AppleClient['responses']['create']
}): Promise<{ text: string; provider: 'apple-readonly' }> {
  const { skill, userText } = input
  const env = input.env ?? process.env
  const forced = env[APPLE_FORCE_ENV] === '1' || env[APPLE_FORCE_ENV] === 'true'

  let toolResults: Record<string, unknown>
  try {
    toolResults = gatherAppleToolResults(skill, userText, {
      selectedDate: input.selectedDate
    })
  } catch (err) {
    return {
      text: `On-device Q&A hit a local data error: ${
        err instanceof Error ? err.message : String(err)
      }. Try again after sync, or use a named API key for fuller answers.`,
      provider: 'apple-readonly'
    }
  }

  if (skill === 'refuse-delete') {
    return {
      text:
        'I can’t delete finance records from Chat. Soft delete and hard delete stay in the normal app UI. (Apple read-only path.)',
      provider: 'apple-readonly'
    }
  }

  const emptyDay = appleEmptyDayAnswer(toolResults)
  if (emptyDay) {
    return { text: emptyDay, provider: 'apple-readonly' }
  }

  const prompt = [
    APPLE_SYSTEM,
    '',
    `SKILL: ${skill}`,
    '',
    'TOOL_RESULTS (JSON):',
    JSON.stringify(toolResults),
    '',
    `USER QUESTION: ${userText}`
  ].join('\n')

  // Force mode (CI): local tool formatting only — never pretend to be Foundation Models.
  if (forced && !input.respond) {
    return {
      text: formatForcedFallback(skill, toolResults),
      provider: 'apple-readonly'
    }
  }

  if (!input.respond) {
    const probe = await probeAppleReadOnly({ env })
    if (!probe.available) {
      return {
        text: `Apple Intelligence isn’t ready. ${probe.detail}`,
        provider: 'apple-readonly'
      }
    }
  }

  try {
    const create =
      input.respond ??
      (async (params) => {
        const client = await getClient()
        return client.responses.create(params)
      })
    const result = await create({
      input: prompt,
      max_output_tokens: 1024,
      timeoutMs: 60_000
    })
    if (!result.ok) {
      const copy = appleReasonUserCopy(result.error.code)
      return {
        text: `Apple Intelligence could not answer (${result.error.code}). ${copy.detail}${
          result.error.detail ? ` ${result.error.detail}` : ''
        }`,
        provider: 'apple-readonly'
      }
    }
    const text = result.text.trim()
    if (!text) {
      return {
        text: 'Apple Intelligence returned an empty answer. Try rephrasing, or use a named API key.',
        provider: 'apple-readonly'
      }
    }
    return { text, provider: 'apple-readonly' }
  } catch (err) {
    return {
      text: `Apple Intelligence failed: ${
        err instanceof Error ? err.message : String(err)
      }. Check System Settings → Apple Intelligence, or use a named API key.`,
      provider: 'apple-readonly'
    }
  }
}

function formatForcedFallback(skill: ChatSkillId, tools: Record<string, unknown>): string {
  if (skill === 'ask-app') {
    const explained = tools.explainAppTopic as
      | { explanation?: string; message?: string }
      | undefined
    return (
      explained?.explanation ??
      explained?.message ??
      'See Configure AI / wiki for app workflows. (Force mode — no Foundation Models.)'
    )
  }
  if (skill === 'rebudget') {
    const policy = tools.rebudgetPolicy as { message?: string } | undefined
    return policy?.message ?? 'Rebudget is plan-only on the Apple path.'
  }
  const mon = tools.getMonthlyMonitoringSnapshot as
    | {
        month?: string
        monthlyIncome?: number
        monthlyExpense?: number
        grossMargin?: number
      }
    | undefined
  if (mon && skill === 'monitoring-summary') {
    return [
      `Monitoring summary${mon.month ? ` — ${mon.month}` : ''} (force mode)`,
      typeof mon.monthlyIncome === 'number' ? `Income: ₱${mon.monthlyIncome.toLocaleString()}` : null,
      typeof mon.monthlyExpense === 'number'
        ? `Expense: ₱${mon.monthlyExpense.toLocaleString()}`
        : null,
      typeof mon.grossMargin === 'number' ? `Margin: ₱${mon.grossMargin.toLocaleString()}` : null
    ]
      .filter((x) => x != null)
      .join('\n')
  }
  const todayExp = tools.queryExpensesForDay as
    | { count?: number; totalAmount?: number; records?: Array<{ description?: string; amount?: number }> }
    | undefined
  if (todayExp) {
    const date = (tools.dayScope as { date?: string } | undefined)?.date ?? 'that day'
    if ((todayExp.count ?? 0) === 0) {
      return `No expenses on ${date}. (Force mode.)`
    }
    return `Expenses on ${date} (force mode): ${todayExp.count} record(s), total ₱${(
      todayExp.totalAmount ?? 0
    ).toLocaleString()}.`
  }
  const dash = tools.getDashboardSummary as
    | {
        month?: string
        totalIncome?: number
        totalExpense?: number
        grossMargin?: number
      }
    | undefined
  if (dash) {
    return [
      `Snapshot — ${dash.month ?? currentMonth()} (force mode)`,
      typeof dash.totalIncome === 'number' ? `Income: ₱${dash.totalIncome.toLocaleString()}` : null,
      typeof dash.totalExpense === 'number' ? `Expense: ₱${dash.totalExpense.toLocaleString()}` : null,
      typeof dash.grossMargin === 'number' ? `Margin: ₱${dash.grossMargin.toLocaleString()}` : null
    ]
      .filter((x) => x != null)
      .join('\n')
  }
  return 'No tool data available (force mode).'
}
