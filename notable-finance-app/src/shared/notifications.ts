/** Local-only notification metadata. No finance mutations are performed by dismissal. */
export interface NotificationError {
  id: string
  source: string
  message: string
  createdAt: number
  count: number
}
export interface NotificationInbox {
  errors: NotificationError[]
  dismissedIds: string[]
}
