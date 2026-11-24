// Saves the automatic card color of each account the first time it is seen, so a pick never
// changes when other cards are recolored (ADR-0011). Local preference only; Notion is untouched.
import { getSqlite } from '../db'
import { assignAutoCardColors, type ColorableAccount } from '../../shared/card-colors'
import { getUiSettings, setUiSettings } from './ui'

/** Accounts that come from Notion, in a fixed order (name, then id) so first picks are repeatable. */
function listColorableAccounts(): ColorableAccount[] {
  return getSqlite()
    .prepare(
      `SELECT id, account_name AS name, account_type AS type FROM accounts
       WHERE notion_page_id IS NOT NULL ORDER BY account_name, id`
    )
    .all() as ColorableAccount[]
}

/**
 * Give every account without a saved color its automatic one and save it. Existing choices
 * (custom or earlier auto picks) are never changed. Safe to call often; writes only when
 * something new was assigned.
 */
export function ensureAccountColors(): void {
  const current = getUiSettings().accountColors
  const { colors, changed } = assignAutoCardColors(listColorableAccounts(), current)
  if (!changed) return
  const added: Record<string, string> = {}
  for (const [id, name] of Object.entries(colors)) if (!(id in current)) added[id] = name
  setUiSettings({ autoAccountColors: added })
}
