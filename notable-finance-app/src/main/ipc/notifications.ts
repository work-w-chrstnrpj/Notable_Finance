import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { dismissNotification, notificationInbox } from '../services/notification-errors'
import { handle } from './handle'
import { result } from './shared'

/**
 * Notification inbox — the error entries recorded by main plus the dismissals the
 * renderer applies to its own due-date reminders. Due reminders themselves are derived
 * in the renderer from accounts/expenses it already holds, so nothing is duplicated here.
 */
export function registerNotificationsIpc(): void {
  handle(IPC_CHANNELS.notificationsInbox, () => result(() => notificationInbox()))
  handle(IPC_CHANNELS.notificationsDismiss, (_e, id: string) =>
    result(() => dismissNotification(id))
  )
}
