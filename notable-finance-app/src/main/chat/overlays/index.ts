export {
  CHAT_SLASH_OVERLAYS,
  INCOME_CELEBRATE_THRESHOLD,
  SPEND_WINCE_THRESHOLD,
  isChatOverlayId,
  overlaySystemPrompt
} from './catalog'
export { parseSlashOverlay, resolveActiveOverlay } from './parse'
export {
  detectKeywordCheer,
  effectiveOverlayForPrompt,
  detectBudgetGuardFromToolResults,
  formatBudgetGuardAppendix,
  buildApproveQuip,
  buildCancelAck
} from './heuristics'
