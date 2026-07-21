# Offline & App-State Model

How the desktop app behaves without a network and how sync state is surfaced. The guiding rule: **the app is always usable, and the UI never shows stale data without a badge.**

## Offline behavior

- **All reads and writes work offline.** SQLite is the source of truth; nothing waits on the network.
- Creating, editing, and soft-deleting records is always available.
- Derived values (balances, budgets, net income, monthly figures) recompute locally and stay correct offline.
- Remote (Notion-side) changes are pulled **only when online and only on a sync pass**; they surface **only after a pull completes**.

## Per-record sync state

Driven by the `sync_state` column ([`local-data-schema.md`](local-data-schema.md)):

| State | Meaning | UI treatment |
| --- | --- | --- |
| `clean` | Matches the last successful sync | No badge |
| `dirty` | Local changes not yet pushed | **"Not yet synced"** badge |
| `conflict` | A true same-field conflict awaits resolution | **Conflict** badge + entry in the resolver |

A record created offline is marked `dirty` and shows the "not yet synced" badge until it reaches Notion.

## Global sync status

Exposed via `window.api.sync.status()` and the `sync:status` event:

```
SyncStatus {
  online: boolean
  mode: 'manual' | 'auto'
  intervalSeconds: number
  lastPushAt / lastPullAt: timestamp | null
  dirtyCount: number
  conflictCount: number
  running: boolean
}
```

Rendered as a persistent status indicator (e.g. a header chip): Online/Offline, last synced time, count of unsynced changes, and a spinner while a pass runs.

## Stale-data rule

- The UI **must not** present pulled-from-Notion data as current without indicating sync recency. The global indicator always shows "last synced" time.
- Locally-authored unsynced changes are always badged at the record level.
- If a conflict is pending on a record, that record is badged and its values are considered "needs your decision" rather than settled.

## State transitions

```
create/edit locally ──► dirty ──(push ok)──► clean
                                   │
                               (pull finds
                                remote change,
                                overlap)  ──► conflict ──(resolve)──► dirty ──► clean
```

## Reconnection

- The app detects connectivity; when it comes back online, an automated-mode app runs a pass on the next tick (or immediately, configurable), and manual-mode shows that unsynced changes are pending.
- No user data is ever lost by being offline — everything is journaled in `mutation_queue` and reconciled on the next pass.

## Related

- [`sync-and-conflict-design.md`](sync-and-conflict-design.md) · [`ipc-contract.md`](ipc-contract.md) · [`local-data-schema.md`](local-data-schema.md)
