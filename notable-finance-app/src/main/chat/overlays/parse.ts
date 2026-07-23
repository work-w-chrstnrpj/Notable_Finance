import type { ChatOverlayId } from '../../../shared/finance.types'
import { isChatOverlayId } from './catalog'

const SLASH_RE = /(?:^|\s)\/(default|roast|cheer|strict|quiet)\b/gi

export type ParsedSlash = {
  /** Message with slash tokens removed. */
  content: string
  /** Overlay from this message, if any. */
  overlay: ChatOverlayId | null
}

/** Extract trailing/inline slash modes; last match wins. */
export function parseSlashOverlay(raw: string): ParsedSlash {
  let overlay: ChatOverlayId | null = null
  const matches = [...raw.matchAll(SLASH_RE)]
  for (const m of matches) {
    const id = (m[1] ?? '').toLowerCase()
    if (isChatOverlayId(id)) overlay = id
  }
  const content = raw.replace(SLASH_RE, ' ').replace(/\s+/g, ' ').trim()
  return { content, overlay }
}

export function resolveActiveOverlay(input: {
  slashOverlay: ChatOverlayId | null
  threadOverlay: string | null | undefined
  forceStrict?: boolean
}): ChatOverlayId {
  if (input.forceStrict) return 'strict'
  if (input.slashOverlay) return input.slashOverlay
  const t = (input.threadOverlay ?? 'default').trim().toLowerCase()
  return isChatOverlayId(t) ? t : 'default'
}
