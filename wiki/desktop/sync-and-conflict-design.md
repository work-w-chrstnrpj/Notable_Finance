# Sync & Conflict Resolution Design

The core of the desktop app. It defines how the local SQLite store reconciles with Notion in both directions, and how conflicts are resolved.

## Principles

1. **Local-first.** SQLite is the working source of truth. Sync never blocks a local read or write.
2. **Sync only writable inputs.** Computed fields (formulas/rollups/relations, `last_edited_time`) are never written — see [`../shared/notion-field-mapping.md`](../shared/notion-field-mapping.md). Each side derives its own computed values, so they never conflict.
3. **Three-way merge.** Every reconcile compares three versions of a record — **base** (last synced), **local** (SQLite now), **remote** (Notion now) — like a git merge. This is what lets us detect *who* changed *what* despite Notion having no per-field timestamps.
4. **Prompt on true conflict.** Disjoint-field edits auto-merge; only same-field, both-changed edits prompt the user. In normal single-user operation these are rare (the user does not edit the same record in Notion and the app simultaneously).

## What Notion gives us (and its limits)

- Page-level `last_edited_time` and `last_edited_by` only — **no per-field timestamps**.
- `last_edited_time` is **rounded down to the minute** — unusable as a fine-grained ordering clock.
- Rate limit ≈ **3 requests/second** (HTTP 429 on exceed) → incremental sync + a throttled queue with backoff.
- The **Search** endpoint can sort/filter by `last_edited_time` → used to pull "what changed since cursor T".

Because of the minute-rounding and missing field timestamps, **we do not rely on timestamps for correctness.** The base snapshot is primary; timestamps are only a coarse "did anything change" hint.

## Sync modes (configurable)

- **Manual:** the user triggers a Sync action.
- **Automated:** on a configurable interval, each run does a full **push then pull**.
- In both modes a local write is applied instantly and marked `dirty`; sync is decoupled from local correctness.
- Remote (Notion-side) edits surface in the UI **only after a pull completes**.

## The reconcile algorithm

For a sync pass:

```
PUSH phase
  for each local record where sync_state = 'dirty':
    if no notion_page_id:  create Notion page (writable fields only) → store returned page id
    else:                  update Notion page (writable fields only)
    on success:            base_snapshot = current writable fields; sync_state = 'clean'
    on 429/failure:        keep 'dirty'; backoff and retry next pass

PULL phase
  cursor = last_pull_cursor
  for each Notion page changed since cursor (Search sorted by last_edited_time):
    map to record; find local by notion_page_id
    if not found locally:                 INSERT new local record (fresh local id + mapping)
    else: run THREE-WAY MERGE (below)
  advance last_pull_cursor

FINALIZE
  recompute derived values (balances, budgets) from SQLite
  emit sync-status + any conflict prompts to renderer
```

### Three-way merge (per record)

Let `base` = `base_snapshot`, `local` = current SQLite writable fields, `remote` = mapped Notion writable fields.

```
localChanged  = diff(base, local)   // set of fields changed locally
remoteChanged = diff(base, remote)  // set of fields changed in Notion

if localChanged is empty and remoteChanged is empty:   no-op
elif localChanged is empty:                            PULL  (apply remote → local)
elif remoteChanged is empty:                           PUSH  (already handled in push phase)
else:  // both changed
    overlap = localChanged ∩ remoteChanged
    if overlap is empty:                               AUTO-MERGE
        apply remote's changed fields onto local; keep local's changed fields
    else:                                              CONFLICT
        for each field in overlap: record base/local/remote values → conflict log
        raise a resolve prompt to the user (see below)
after apply: base_snapshot = merged writable fields; sync_state = 'clean'
```

The three-way merge means **only genuinely overlapping edits ever prompt** — a desktop change to `Amount` and a Notion change to `Note` on the same record merge automatically.

## Scenario matrix

| Scenario | Detection | Outcome |
| --- | --- | --- |
| New record in desktop (offline) | has local id, no `notion_page_id` | Push → create page → store id. No conflict possible. |
| New record in Notion | pulled page id unseen locally | Insert locally with fresh id + mapping. |
| Edited only in desktop | local ≠ base, remote = base | Push. |
| Edited only in Notion | local = base, remote ≠ base | Pull. |
| Edited in both, disjoint fields | both ≠ base, overlap ∅ | Auto-merge. |
| Edited in both, same field | both ≠ base, overlap ≠ ∅ | Conflict → prompt + log. |
| Soft-delete vs edit | one side sets deleted, other edits | Treated as a field change; overlap → prompt. Soft-delete is reversible (title rewrite), so low-risk. |
| Independent "same" record on both sides | different ids, no mapping | Kept as two records (no auto-dedup). |

## Conflict resolution (policy: prompt)

When `overlap ≠ ∅`:

1. The reconcile pauses that record's finalize and records a `conflict` row (base/local/remote per field).
2. The record's `sync_state` becomes `conflict`; the UI badges it and opens a resolver showing, per conflicting field, the **local** value and the **Notion** value.
3. The user picks per field (or "keep all local" / "keep all Notion").
4. The chosen values become the new record; `base_snapshot` is set to it; it is pushed on the next pass; `sync_state` → `clean`.
5. All conflicts remain in the conflict log for audit.

Field-level auto-merge for disjoint edits happens without prompting. Timestamps are **not** used to auto-pick a winner (Notion's minute-rounding makes that unreliable).

## Deletes

Deletes follow the shared soft-delete rule: rewrite the title to `[Deleted: …]` and clear
the amount. A delete therefore travels through sync as an ordinary field change (no
tombstone table needed) and is reversible when the Notion page still exists.

**Notion archive/trash** is also treated as a delete. Archived pages cannot be updated, and
database queries omit them, so:

1. **Push:** if Notion returns “archived” / object-not-found while updating a dirty
   income/expense, the app soft-deletes locally (if needed) and marks `sync_state=clean`
   instead of leaving the row stuck dirty.
2. **Pull presence:** after the incremental pull, a full id scan of the incomes/expenses
   databases soft-deletes any still-live local row whose `notion_page_id` is missing from
   Notion (trashed/archived while the app still showed it live).

Soft-delete **via title rewrite in Notion** (page remains in the DB) continues to flow
through the normal three-way merge via `isDeletedTitle`. `notion_page_id` is kept either
way so a later unarchive can still match the row.

## Reliability

- **Durable mutation queue:** local edits are journaled so offline changes replay in order and survive a crash mid-sync.
- **Rate-limit safety:** the push/pull queue caps at ~3 req/s with exponential backoff on 429.
- **Idempotent push:** a record with a `notion_page_id` updates rather than re-creates, so a retried push cannot duplicate.
- **Cursor persistence:** `last_pull_cursor` is stored so pulls are incremental across restarts.

## Reused from the web app

`conflict.service`, `notion-sync.service`, `notion-mutation.service` (create/update/soft-delete), `notion-property-mapper`, and `mapping.service` are copied into `notable-finance-app/src/main/{notion,sync}` and adapted from a Notion-truth model to a SQLite-truth model.

## Related

- [`local-data-schema.md`](local-data-schema.md) — the sync columns this algorithm reads/writes.
- [`offline-and-state-model.md`](offline-and-state-model.md) — how `sync_state` surfaces in the UI.
- [`ipc-contract.md`](ipc-contract.md) — the sync/conflict IPC channels.
