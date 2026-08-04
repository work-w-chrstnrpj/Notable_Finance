# Desktop App Refactor — Phase 0 Baseline

Recorded per [`refactor_development_plan.md`](refactor_development_plan.md) Phase 0. This is the
reference state every later phase must match on: same green commands, same LOC-reduction targets,
same visible behaviour.

- **Date:** 2026-08-02
- **Commit:** `ec535d7` (2026-08-01 23:29:58 +0800) — `release: v1.2.0`
- **Branch:** `main`, clean working tree (only this plan's own docs untracked)
- **Toolchain:** Node v26.4.0, npm 11.17.0, macOS 26.6 (Apple M5)

---

## 1. Verification commands

### `npm run typecheck` — ✅ PASS

```
$ npx tsc --noEmit -p tsconfig.node.json --composite false
(no output, exit 0)

$ npx tsc --noEmit -p tsconfig.web.json --composite false
(no output, exit 0)
```

### `npm run test` (Vitest) — ✅ PASS

```
 RUN  v4.1.10 /Users/chrixcrusher/Documents/Projects/Notable Finance/notable-finance-app

 Test Files  23 passed | 1 skipped (24)
      Tests  217 passed | 7 skipped (224)
   Start at  14:36:07
   Duration  1.70s (transform 1.64s, setup 0ms, import 7.26s, tests 278ms, environment 3ms)
```

### `npm run test:e2e` (Playwright + Electron) — ❌ REAL PRE-EXISTING BUG (since fixed)

> **CORRECTION (2026-08-02).** An earlier revision of this file claimed the e2e failure was an
> agent-sandbox display limitation. **That was wrong.** The user reproduced the identical failure
> in a normal interactive terminal, and direct instrumentation found a genuine bug. The original
> (incorrect) analysis is kept below only for the record; the real diagnosis follows it.
>
> **Actual root cause:** `e2e/*.spec.ts` launched Electron with `args: ['out/main/index.js']`.
> Electron derives `app.getAppPath()` from that argument, so appPath became `<root>/out/main`
> instead of the package root. `src/main/db/index.ts`'s `migrationsFolder()` builds
> `join(app.getAppPath(), 'src/main/db/migrations')`, which then resolved to a non-existent
> `<root>/out/main/src/main/db/migrations`. Drizzle's `migrate()` threw
> `Can't find meta/_journal.json`, rejecting inside `app.whenReady().then(...)` — so
> `createWindow()` never ran, no window was created, and `firstWindow()` timed out after 30s.
>
> This only ever affected the **e2e harness**: `electron-vite dev` and the packaged build both
> already produce a correct appPath (packaged takes the `process.resourcesPath` branch).
>
> **Fix applied:** both spec files now launch with `args: ['.']`, so Electron reads
> `package.json` → `main` and appPath is the package root — matching dev and packaged.
>
> **Result after fix:** `30 passed, 4 failed` (previously 2 failed with the other 32 never
> running). The 4 remaining failures are a **separate, still-open** issue: seeded reference data
> is absent, so the expense category dropdown is empty (`"Food" not in items (— None —)`) and the
> seeded-accounts assertion fails. Tracked separately; not a blocker for Phases 1–3.

<details>
<summary>Original (incorrect) analysis — retained for the record</summary>



The build step succeeded cleanly:

```
out/main/index.js      338.12 kB
out/preload/index.js     8.93 kB
out/renderer/index.html  0.82 kB  (+ fonts, 236.89 kB CSS, 4,177.78 kB JS)
✓ built in 380ms
Running 34 tests using 1 worker
```

Both spec files then failed identically:

```
TimeoutError: electronApplication.firstWindow: Timeout 30000ms exceeded while waiting for event "window"
  at e2e/app.spec.ts:22:15
  at e2e/keyboard-shortcuts.spec.ts:20:15
```

**Root cause, confirmed:** this agent's Bash tool runs in a sandboxed subprocess with no
`DISPLAY`/WindowServer session (`echo $DISPLAY` → empty; no GUI session attached), so Electron
cannot open a window at all — the app never gets far enough to fail on its own logic. This is a
harness limitation, not a regression: `npm run typecheck` and `npm run test` (which cover all the
same domain logic exercised by these two specs, minus the actual window chrome) are both green on
the same commit.

**Action needed from you:** run `npm run test:e2e` yourself in an interactive terminal (a normal
Terminal.app session, not through this agent) to get a real e2e baseline. If it passes there, note
that below and treat these two specs as green for baseline purposes. If it fails there too, that
*is* a real finding and should be triaged before Phase 1 starts.

```bash
cd "notable-finance-app" && npm run test:e2e
```

</details>

> **e2e baseline status (2026-08-04): ✅ 34 passed / 0 failed.** The 4 remaining failures were
> two separate real bugs, both fixed:
>
> 1. **`scripts/seed-dev.mjs` never set `notion_page_id`** on the accounts it inserts. Every
>    account picker in the app (`accounts.tsx`, `finance-data-context.tsx`,
>    `chat/draft-card.tsx`) filters to `account.notionSynced` — true only when
>    `notion_page_id` is non-empty — specifically to hide ad-hoc local test accounts that
>    were never synced. Since the seeder stands in for a real Notion pull, its rows needed
>    to look synced too, or they're invisible everywhere despite existing in the DB. Fixed by
>    giving every seeded row (accounts *and*, newly, expense categories — the script never
>    seeded those at all, which was the other half of the "Food" category failures) a
>    placeholder `notion_page_id`.
> 2. **`e2e/keyboard-shortcuts.spec.ts`'s `createTestExpense()` hardcoded purchase date
>    `2026-07-15`.** The Expense page's default Monthly view only shows the
>    currently-selected month; once "today" rolled past July 2026, the created test record
>    silently aged out of the default view the test then tried to click. Fixed by using
>    `new Date().toISOString().slice(0, 10)` instead of a fixed date.
>
> Verified with a manual repro outside the test harness (launch → seed → inspect DB
> directly via `sqlite3`) before re-running the full suite, to confirm root cause rather
> than just re-running until green.

---

## 2. LOC snapshot — god components (Phase 1 §4 shrink targets)

| File | LOC |
|---|---|
| `src/renderer/src/components/pages/expense.tsx` | 1975 |
| `src/renderer/src/components/pages/chat.tsx` | 1491 |
| `src/renderer/src/components/pages/settings-modals.tsx` | 1079 |
| `src/renderer/src/components/pages/income.tsx` | 910 |
| `src/renderer/src/components/fab/index.tsx` | 741 |
| `src/renderer/src/components/pages/monitoring.tsx` | 720 |
| `src/renderer/src/components/pages/history.tsx` | 695 |
| `src/renderer/src/components/pages/workflow.tsx` | 653 |

Target (plan §7 Definition of Done): none of these files over 400 LOC once Phases 4–6 land.

## 3. Repo-wide metrics (for the plan §4 Success Metrics table)

| Metric | Value |
|---|---|
| Total `src/` LOC (`.ts` + `.tsx`) | 33,973 |
| Total `src/` files (`.ts` + `.tsx`) | 139 |
| Largest file | `pages/expense.tsx` — 1975 LOC |
| Files > 600 LOC | **14** (see below — corrects the plan's earlier estimate of 13) |
| Lint config present | **None** — confirms F4. No ESLint/oxlint config file, no `lint` script. |
| `handleIncomeViewModeChange` declarations in `income.tsx` | **4** (lines 56, 80, 168, 624) — confirms F3, unchanged since the initial review. |

### Files > 600 LOC (full list, includes main-process files not in the god-component shrink list)

```
1975  src/renderer/src/components/pages/expense.tsx
1491  src/renderer/src/components/pages/chat.tsx
1079  src/renderer/src/components/pages/settings-modals.tsx
 910  src/renderer/src/components/pages/income.tsx
 852  src/shared/finance.types.ts
 762  src/main/chat/tools/write-tools.ts
 741  src/renderer/src/components/fab/index.tsx
 720  src/renderer/src/components/pages/monitoring.tsx
 695  src/renderer/src/components/pages/history.tsx
 671  src/main/chat/orchestrator.ts
 654  src/main/ipc/index.ts
 653  src/renderer/src/components/pages/workflow.tsx
 645  src/main/db/repositories.ts
 611  src/main/chat/apple.ts
```

Only the 8 renderer page/fab files are in scope for the Phase 1 §4 "Files > 600 LOC → 0" target —
the plan's Phase 6/7 sections address `write-tools.ts`, `orchestrator.ts`, and `ipc/index.ts`
separately (Phase 7 splits `ipc/index.ts`; the other two are main-process files the assessment
explicitly said to leave mostly alone). `finance.types.ts` is a DTO file, expected to be long.

---

## 4. Manual smoke pass (visual diff reference)

**Done (2026-08-04), against the running `npm run dev` app, driven by the desktop-automation
tool with your screen-control grant.** The earlier "Bash sandbox has no WindowServer" note was
about this agent's own subprocess, same as the e2e note above — desktop-automation drives your
actual session directly, so it isn't affected. Every section below was clicked through and
visually confirmed to render without errors or obviously-broken layout:

- Dashboard
- Accounts
- Income — Daily, Weekly, Monthly, Annually (Table + Chart)
- Expense — Daily, Weekly, Monthly, Annually, To pay, To buy, Installments, Unpaid CC, Unpaid
  Pasabuy (all 9)
- Monthly Monitoring
- Workflow: Transfer, CC Payment, Alkansya, Receivables (all 4)
- History
- Sync (via `⌘⇧O`)
- Settings, including the Profile / Interface / Keyboard shortcuts / Theme / AI-Chat /
  Developer cards (via `⌘⇧S`)
- Chat, including thread list, message stream, and composer (via `⌘⇧C` — not reachable from
  the sidebar or the tab-strip `+`, since Chat only shows when enabled in Settings)

**No screenshot files were persisted.** The desktop-automation tool's `save_to_disk` option
didn't write to any path this agent's Bash tool could locate (checked `~/Desktop`,
`~/Downloads`, `~/Pictures`, `/tmp`, and recently-modified files across `$HOME` — nothing
matched), so there's no local PNG archive to commit as a literal "before" reference for a
future screenshot diff. The dashboard and several other screens show real personal financial
data, so these also were never uploaded or published anywhere.
If you want persisted image files (e.g. for an actual pixel-diff tool later), the reliable way
is capturing them yourself while running `npm run dev` — this agent can drive the clicks/
navigation again if you tell it where `save_to_disk` actually lands on your machine.

> **Screenshot baseline status:** ✅ Visually verified across every listed section, 2026-08-04.
> No image files stored — see note above.

---

## 5. Plan corrections made from this baseline

- `refactor_development_plan.md` §4 Success Metrics: "Files > 600 LOC" baseline corrected from
  `13` to `14` to match the exact count above.
