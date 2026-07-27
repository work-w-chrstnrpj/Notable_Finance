/**
 * Topic guard — intercepts off-topic questions before they reach the AI provider.
 *
 * The guard uses a lightweight keyword check to catch questions that are clearly
 * not about the Notable Finance app, personal finance, or money management.
 *
 * This is a hard block at the app level. Edge cases that slip through are
 * handled by the AI's system prompt which instructs it to stay on finance topics.
 *
 * Phase added: 6.x (Chat guard rails)
 */

// Core finance & money keywords — the app's primary domain.
const FINANCE_TERMS = new Set([
  'finance', 'financial', 'money', 'budget', 'budgeting', 'savings', 'saving',
  'expense', 'expenses', 'spending', 'spent', 'spend', 'cost', 'costs',
  'income', 'earnings', 'salary', 'wage', 'wages', 'pay', 'paid',
  'balance', 'balances', 'debt', 'debts', 'loan', 'loans', 'interest',
  'credit', 'debit', 'account', 'accounts', 'transaction', 'transactions',
  'payment', 'payments', 'transfer', 'deposit', 'withdrawal',
  'bill', 'bills', 'invoice', 'receipt', 'receipts', 'tax', 'taxes',
  'fund', 'funds', 'worth', 'net', 'total', 'amount', 'total amount',
  'profit', 'loss', 'cash', 'wallet', 'checking', 'invest',
  'price', 'rate', 'fee', 'charge', 'currency', 'dollar', 'peso',
  'owe', 'owed', 'refund', 'reimburse', 'reimbursement',
  'salary', 'allowance', 'pension'
])

// Direct app feature & navigation keywords.
const APP_TERMS = new Set([
  'notable', 'notion', 'dashboard', 'sync', 'syncing',
  'category', 'categories', 'scheduler', 'schedule', 'scheduled',
  'record', 'records', 'entry', 'entries', 'list', 'listing',
  'report', 'reports', 'chart', 'charts', 'graph', 'graphs',
  'alkansya', 'receivable', 'receivables',
  'monitoring', 'monthly', 'overview', 'summary',
  'copilot', 'finance copilot', 'app',
  'filter', 'filters', 'search', 'sort', 'view',
  'dark mode', 'theme', 'settings', 'profile',
  'configure', 'config', 'setup', 'onboarding'
])

// Stop words and generic words that shouldn't alone trigger the finance check.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
  'shall', 'should', 'may', 'might', 'must', 'to', 'of', 'in', 'for', 'on',
  'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs',
  'and', 'but', 'or', 'nor', 'not', 'no', 'so', 'yet',
  'if', 'because', 'about', 'up', 'just', 'very', 'also',
  'now', 'than', 'too', 'some', 'any', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'such', 'only', 'own',
  'same', 'please', 'thank', 'thanks', 'yes', 'no', 'ok', 'okay',
  'hi', 'hello', 'hey', 'goodbye', 'bye'
])

/** Tagalog / Filipino stop words common in code-switched chat. */
const TAGALOG_STOPS = new Set([
  'ang', 'ng', 'sa', 'ay', 'ko', 'mo', 'ka', 'si', 'ni', 'sina',
  'nina', 'kay', 'kina', 'akin', 'atin', 'inyo', 'kanila',
  'ito', 'iyan', 'iyon', 'dito', 'diyan', 'doon',
  'opo', 'po', 'oo', 'hindi', 'wala', 'may', 'meron',
  'na', 'pa', 'din', 'rin', 'lang', 'lamang',
  'ano', 'sino', 'saan', 'ilan', 'bakit', 'paano', 'kailan',
  'aking', 'iyong', 'kaniyang', 'aming', 'inyong'
])

const ALL_STOPS = new Set([...STOP_WORDS, ...TAGALOG_STOPS])

// Content words that clearly signal non-finance topics when NOT mixed with
// finance terms. This helps catch obvious off-topic questions.
const OFF_TOPIC_HARD_TRIGGERS = [
  // Weather
  /\b(weather|rain|sunny|cloudy|temperature|humid|forecast|climate|typhoon|bagyo)\b/i,
  // Food & recipes (not spending-related)
  /\b(recipe|cook|cooking|ingredient|bake|baking|delicious|tasty|yummy)\b/i,
  // Entertainment
  /\b(movie|film|music|song|concert|game|gaming|playstation|xbox|netflix)\b/i,
  // Sports
  /\b(basketball|football|soccer|tennis|baseball|volleyball|sports|game|match|team|player)\b/i,
  // Travel (not travel expense)
  /\b(hotel|airfare|flight|vacation|tourist|tourism|destination|sightseeing)\b/i,
  // Health (not health expense / insurance)
  /\b(doctor|diagnosis|symptom|prescription|workout|exercise|diet|nutrition|illness|disease|vaccine)\b/i,
  // Technology (generic — not about Notable Finance)
  /\b(programming|code|coding|javascript|typescript|python|react|api|server|database|deploy|docker)\b/i,
  // Science / education
  /\b(physics|chemistry|biology|algebra|calculus|history|geography|exam|homework|lesson)\b/i,
  // News / politics
  /\b(president|election|politician|government|senate|congress)\b/i,
]

// Short generic queries likely not finance-related.
const OFF_TOPIC_SHORT = [
  /^(hi|hello|hey|kamusta|musta|good morning|good afternoon|good evening)\s*$/i,
  /^(what'?s? up|sup|how'?s? it going|how are you|kamusta ka)\s*$/i,
  /^(thank|thanks|thanks a lot|maraming salamat|salamat)\s*$/i,
  /^(bye|goodbye|see you|bye bye|paalam)\s*$/i,
  /^(ok|okay|sige|ge|got it|i see|understood)\s*$/i,
  /^(what is your name|who are you|sino ka)\s*$/i,
  /^(what can you do|help|tulong|commands)\s*$/i,
]

// Mixed-language greeting/farewell checks (Taglish).
const TAGALOG_GREETINGS = /\b(kamusta|musta|salamat|po|opo|sige|nga|ba|naman|kasi)\b/i

/**
 * Check whether a user message is clearly off-topic (not about finance or the app).
 * Returns null if on-topic, or a brief reason string if blocked.
 */
export function checkTopicGuard(userText: string): string | null {
  const text = userText.trim()
  if (!text) return 'Please type a question about your finances or the Notable Finance app.'

  // Short generic greetings — let through (they're harmless and lead to follow-up).
  for (const pattern of OFF_TOPIC_SHORT) {
    if (pattern.test(text)) return null
  }

  const lower = text.toLowerCase()
  const words = lower.split(/[\s,.;:!?()]+/).filter(Boolean)

  // Count meaningful (non-stop) words.
  const contentWords = words.filter(w => !ALL_STOPS.has(w) && w.length > 1)
  if (contentWords.length === 0) return null // all stop words → let through

  // Check finance terms.
  const matchedFinanceTerms = contentWords.filter(w => FINANCE_TERMS.has(w))
  const hasFinanceTerm = matchedFinanceTerms.length > 0

  // Check app terms.
  const matchedAppTerms = contentWords.filter(w => APP_TERMS.has(w))
  const hasAppTerm = matchedAppTerms.length > 0

  // Check for the word "sa" which is a Tagalog preposition but also a Tagalog
  // word for "account" / "balance" context — let through if any finance term found.
  const hasTagalogGreeting = TAGALOG_GREETINGS.test(lower)

  // If they used any explicit finance or app term, let through.
  if (hasFinanceTerm || hasAppTerm) return null

  // Check hard off-topic triggers.
  // Only block if NO finance/app term was found AND a hard trigger matches.
  // This prevents blocking mixed questions like "How much did we spend on restaurants last month?"
  const matchedHardTriggers: string[] = []
  for (const pattern of OFF_TOPIC_HARD_TRIGGERS) {
    const match = lower.match(pattern)
    if (match) matchedHardTriggers.push(match[0])
  }

  if (matchedHardTriggers.length > 0) {
    return buildOffTopicResponse(text)
  }

  // If the message is very short and has no content words matching finance/app,
  // let it through anyway (could be a context-dependent follow-up like "show me").
  if (contentWords.length <= 3) return null

  // Longer messages with no finance/app terms at all are suspicious.
  // If it's just Taglish chat, let through (could be context).
  if (hasTagalogGreeting && contentWords.length <= 5) return null

  // Final heuristic: if none of the content words match finance/app and the
  // user isn't just greeting, block it.
  return buildOffTopicResponse(text)
}

function buildOffTopicResponse(_userText: string): string {
  return (
    "I'm here to help with your finances and the Notable Finance app. " +
    'I can assist with expenses, income, budgets, accounts, reports, ' +
    'sync, and other app features. Please rephrase your question so it relates ' +
    'to personal finance or the app.'
  )
}
