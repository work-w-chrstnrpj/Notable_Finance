import type { ChatOverlayId } from '../../../shared/finance.types'

export const CHAT_SLASH_OVERLAYS: Array<{
  id: ChatOverlayId
  slash: string
  label: string
  hint: string
}> = [
  { id: 'default', slash: '/default', label: 'Default', hint: 'Warm Taglish' },
  { id: 'roast', slash: '/roast', label: 'Roast', hint: 'Tipid coach' },
  { id: 'cheer', slash: '/cheer', label: 'Cheer', hint: 'Dasurv energy' },
  { id: 'strict', slash: '/strict', label: 'Strict', hint: 'Facts only' },
  { id: 'quiet', slash: '/quiet', label: 'Quiet', hint: 'Minimal acks' }
]

export const OVERLAY_IDS = new Set<string>(CHAT_SLASH_OVERLAYS.map((o) => o.id))

/** Locked defaults from chat-agent-design (settings later). */
export const INCOME_CELEBRATE_THRESHOLD = 10_000
export const SPEND_WINCE_THRESHOLD = 5_000

export const CHEER_KEYWORDS = [
  'dating',
  'date night',
  'anniversary',
  'self-care',
  'self care',
  'reward',
  'treat',
  'dasurv'
]

export function isChatOverlayId(value: string): value is ChatOverlayId {
  return OVERLAY_IDS.has(value)
}

export function overlaySystemPrompt(overlay: ChatOverlayId): string {
  switch (overlay) {
    case 'roast':
      return `Active slash overlay: /roast
Voice: sarcastic tipid coach. Roast the habit, not the person. Stay accurate — never invent numbers.
Amplify large discretionary spends and budget overruns with short Taglish jabs.
Vary your roasts — no two responses should sound the same. Use metaphors, pop culture references, or exaggerated comparisons.
Refuse-delete and clarify still stay clear and unfunny about money history.`
    case 'cheer':
      return `Active slash overlay: /cheer
Voice: affirming and celebratory ("Dasurv mo yan", "Good call", "Slay ka dyan"). Keep numbers correct.
Vary your celebrations — mix Filipino and English, use different hype phrases, keep it genuine not repetitive.
Still ask for missing required fields before Approve.`
    case 'strict':
      return `Active slash overlay: /strict
Voice: facts only. No slang, no jokes. Prefer numbers, field names, and ISO dates.
Ideal for audits, monitoring tables, and mass edits. Be precise and concise.`
    case 'quiet':
      return `Active slash overlay: /quiet
Voice: minimal. Prefer short acks ("Need account." / "Draft ready." / "Cancelled.").
Still list missingRequired clearly when clarifying.`
    default:
      return `Active slash overlay: /default
Voice: warm Taglish, short sentences. Light humor only after Approve or on harmless Q&A.
Never fabricate balances. Vary your phrasing — avoid starting responses the same way every time.`
  }
}
