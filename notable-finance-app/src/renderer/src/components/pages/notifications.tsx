import { AlertTriangle, Bell, CalendarClock, CheckCheck, CreditCard, X } from "lucide-react";
import { EmptyState, LoadingBlock, Panel } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { cx } from "@/lib/finance-helpers";
import { navigate } from "@/lib/router";
import { useNotifications, type NotificationItem } from "@/lib/use-notifications";

// Workspace notifications: credit-account due dates, unsettled credit transactions whose
// expected payment date has arrived, and errors main recorded (sync failures and the like).
// Dismissals are per occurrence, so tomorrow's reminder returns after today's is cleared.

function timeAgo(at: number): string {
  const minutes = Math.round((Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function NotificationRow({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = item.kind === "error" ? AlertTriangle : item.kind === "account" ? CreditCard : CalendarClock;
  return (
    <div className={cx("notification", `notification--${item.kind}`)}>
      <span className="notification__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="notification__body">
        <p className="notification__title">
          {item.title}
          {item.due && (
            <span className={cx("notification__tag", item.due === "today" && "notification__tag--now")}>
              {item.due === "today" ? "Today" : "Tomorrow"}
            </span>
          )}
          {item.count != null && item.count > 1 && (
            <span className="notification__tag">×{item.count}</span>
          )}
        </p>
        <p className="notification__detail">{item.detail}</p>
        <p className="notification__meta">
          {item.dueDate ? formatDate(item.dueDate) : item.at ? timeAgo(item.at) : ""}
        </p>
      </div>
      <div className="notification__actions">
        {item.kind === "account" && (
          <button type="button" className="button" onClick={() => navigate("/accounts")}>
            Accounts
          </button>
        )}
        {item.kind === "expense" && (
          <button type="button" className="button" onClick={() => navigate("/expense")}>
            Expenses
          </button>
        )}
        {item.kind === "error" && (
          <button type="button" className="button" onClick={() => navigate("/sync")}>
            Sync Center
          </button>
        )}
        <button
          type="button"
          className="icon-button"
          aria-label={`Dismiss ${item.title}`}
          onClick={() => onDismiss(item.id)}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { items, loading, dismiss } = useNotifications();
  const errors = items.filter((item) => item.kind === "error");
  const due = items.filter((item) => item.kind !== "error");

  return (
    <div className="page-stack">
      <header className="notifications__header">
        <h2 className="notifications__title">
          <Bell size={18} />
          Notifications
        </h2>
        <p className="notifications__hint">
          Due reminders are derived from your credit accounts and unsettled credit
          transactions. Dismissing one clears only that day&rsquo;s reminder.
        </p>
      </header>

      {loading && items.length === 0 ? (
        <LoadingBlock label="Checking due dates…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing needs attention"
          detail="No payments are due in your reminder window and no errors have been recorded."
        />
      ) : (
        <>
          {errors.length > 0 && (
            <Panel title={`Errors (${errors.length})`}>
              {errors.map((item) => (
                <NotificationRow key={item.id} item={item} onDismiss={(id) => void dismiss(id)} />
              ))}
            </Panel>
          )}
          {due.length > 0 && (
            <Panel title={`Due (${due.length})`}>
              {due.map((item) => (
                <NotificationRow key={item.id} item={item} onDismiss={(id) => void dismiss(id)} />
              ))}
            </Panel>
          )}
          {due.length === 0 && (
            <div className="notifications__clear">
              <CheckCheck size={16} />
              Nothing is due in your reminder window.
            </div>
          )}
        </>
      )}
    </div>
  );
}
