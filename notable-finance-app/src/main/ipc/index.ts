import { registerRecordsIpc } from './records'
import { registerSyncIpc } from './sync'
import { registerNotionIpc } from './notion'
import { registerChatIpc } from './chat'
import { registerSettingsIpc } from './settings'
import { registerUpdaterIpc } from './updater'

// IPC surface per wiki/desktop/ipc-contract.md. Every response is the discriminated
// ApiResult envelope; all validation happens here in main (renderer is untrusted).
// Writes broadcast records:changed + derived:updated to ALL windows (Phase 1.5).
//
// refactor_development_plan.md Phase 7.1 — this used to be a single 654-line function;
// each domain now registers its own channels in its own file under main/ipc/.

export function registerIpc(): void {
  registerRecordsIpc()
  registerSyncIpc()
  registerNotionIpc()
  registerChatIpc()
  registerSettingsIpc()
  registerUpdaterIpc()
}
