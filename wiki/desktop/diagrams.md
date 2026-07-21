# Desktop Diagrams

Mermaid diagrams for the desktop app. (Render in any Mermaid-aware Markdown viewer.)

## Context

```mermaid
flowchart LR
  user([User]) --> app
  subgraph app[Notable Finance App - Electron]
    r[Renderer - React UI]
    m[Main - SQLite + Sync + Notion adapter]
    r <-- IPC --> m
  end
  m <-- bidirectional sync --> notion[(Notion workspace)]
  webuser([Same user, on the go]) --> web[Notable Finance Web]
  web <-- Notion is source of truth --> notion
```

## Process model & data ownership

```mermaid
flowchart TB
  subgraph Renderer[Renderer - untrusted UI]
    ui[React pages/components]
  end
  subgraph Preload[Preload - contextBridge]
    api[window.api - allow-listed]
  end
  subgraph Main[Main - owns data & secrets]
    sqlite[(SQLite)]
    sync[Sync engine]
    adapter[Notion adapter]
    domain[Domain + reporting logic]
    key[Keychain token - safeStorage]
  end
  ui --> api --> Main
  Main -- events --> ui
  sync --> sqlite
  sync --> adapter
  domain --> sqlite
  adapter --> notion[(Notion)]
```

## Local write (instant, offline)

```mermaid
sequenceDiagram
  participant R as Renderer
  participant M as Main
  participant DB as SQLite
  R->>M: api.expenses.create(dto)
  M->>M: validate (domain logic)
  M->>DB: INSERT (uuid, sync_state='dirty')
  M->>M: recompute derived values (balance, budget)
  M-->>R: record + emit records:changed / derived:updated
  Note over R: renders instantly with "not yet synced" badge
```

## Sync pass (push then pull)

```mermaid
sequenceDiagram
  participant M as Main (sync engine)
  participant N as Notion
  participant DB as SQLite
  Note over M: PUSH
  M->>DB: select dirty records
  loop each dirty
    M->>N: create/update page (writable fields only)
    N-->>M: page id + last_edited_time
    M->>DB: base_snapshot=writable; sync_state='clean'
  end
  Note over M: PULL
  M->>N: Search changed since last_pull_cursor
  N-->>M: changed pages
  loop each changed
    M->>DB: find by notion_page_id
    alt not found
      M->>DB: INSERT new local record
    else found
      M->>M: three-way merge (base/local/remote)
    end
  end
  M->>DB: recompute derived; advance cursor
  M-->>M: emit sync:status / sync:conflict
```

## Three-way merge decision

```mermaid
flowchart TD
  s[base, local, remote] --> lc{local changed?}
  lc -- no --> rc1{remote changed?}
  rc1 -- no --> noop[No-op]
  rc1 -- yes --> pull[Pull remote to local]
  lc -- yes --> rc2{remote changed?}
  rc2 -- no --> push[Push local to Notion]
  rc2 -- yes --> ov{overlapping fields?}
  ov -- no --> merge[Auto-merge disjoint fields]
  ov -- yes --> conflict[Conflict: log + prompt user]
```

## Per-record sync state

```mermaid
stateDiagram-v2
  [*] --> clean
  clean --> dirty: local edit
  dirty --> clean: push ok
  clean --> conflict: pull finds same-field overlap
  dirty --> conflict: pull finds same-field overlap
  conflict --> dirty: user resolves
  dirty --> clean: push ok
```
