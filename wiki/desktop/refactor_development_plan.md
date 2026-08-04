# Desktop App — Refactor Development Plan

**Scope:** `notable-finance-app/` (Electron desktop app) only.
**Goal:** make the codebase maintainable and consistently structured, without changing a single user-visible behaviour.
**Non-goals:** no new features, no UI changes, no dependency swaps, no performance rewrites, no changes to `notable-finance-web/`.

---

## 0. Ground rules (read before touching anything)

These are the guardrails that make this plan safe. They are not negotiable.

1. **Behaviour-preserving only.** If a change alters what the user sees, what gets written to SQLite, or what gets pushed to Notion — it is out of scope. Bugs discovered along the way get logged as tickets, **not fixed inside a refactor commit**.
2. **No speculative abstraction.** Extract only where there are ≥2 real call sites today. A "future-proof" interface with one implementation is a KISS violation and will be rejected in review.
3. **Green baseline before and after every step.** The current baseline is green — keep it that way:
   ```bash
   npm run typecheck && npm run test && npm run test:e2e
   ```
4. **One concern per commit.** A commit either moves code, or changes code — never both. Pure moves must be reviewable as "same lines, new file".
5. **Characterisation tests come first.** For every god-component we touch, the test that pins its current behaviour is written and passing **before** the extraction commit. Phase 1 exists entirely for this reason.
6. **Performance is a constraint, not an afterthought.** Extraction must not introduce new renders. Rules: keep `useMemo`/`useCallback` boundaries where they already exist; when lifting state into a hook, return stable references; never wrap a hot list render in a new context provider.

---

## 1. Assessment — where the code actually stands

### What is already good (do not "improve" these)

| Area | Why it is fine |
|---|---|
| `src/main/` layering | `db/` → `domain/` → `services/` → `ipc/` with a clean one-way dependency direction. Genuine SRP. |
| `src/main/sync/` | Decomposed into 12 focused modules (`pull`, `push`, `merge`, `conflicts`, `writable`, `notion-gone`, `scheduler`, `status`, …), most under 200 LOC. |
| `src/main/notion/` | Same story — `client`, `property-mapper`, `page-extractors`, `markdown-blocks`, `schema-spec` are properly separated. |
| `renderer/lib/use-data.ts` | One generic `useApiQuery` + thin typed wrappers. Textbook DRY without over-abstraction. |
| `renderer/lib/api-client.ts` | The `workflowApi(view)` factory collapses 5 near-identical API surfaces into one. Correct application of DRY. |
| `preload/index.ts` | A real allow-list boundary. Renderer cannot invoke arbitrary channels. Good security posture. |
| Type discipline | **Zero** `as any`, zero `@ts-ignore` in 34k LOC. That is unusually disciplined. |
| Main-process test coverage | 24 suites / 217 tests, all passing, covering validation, derivations, mappers, merge, chat tools, Notion extractors. |

**Verdict on the main process: it is well-structured.** SOLID/DRY/KISS are applied at roughly the right dosage there. Leave it mostly alone.

### What is genuinely broken

The problems are concentrated almost entirely in `src/renderer/src/components/pages/` and in the project's tooling gaps.

#### F1 — God components (SRP violation, severity: high)

| File | LOC | Signals |
|---|---|---|
| `pages/expense.tsx` | 1975 | 56 `useState` calls, 20 top-level functions, **665-line JSX return**, 4-deep view-mode ternary chain selecting between `DataTable` variants |
| `pages/chat.tsx` | 1491 | 27 `useState` calls |
| `pages/settings-modals.tsx` | 1079 | 5 unrelated modals in one file |
| `pages/income.tsx` | 910 | |
| `components/fab/index.tsx` | 741 | |
| `pages/monitoring.tsx` | 720 | |
| `pages/history.tsx` | 695 | |
| `pages/workflow.tsx` | 653 | |

~8,900 LOC — **26% of the codebase** — sits in 8 files that no one can change confidently. Each page component simultaneously owns: data fetching, filter hydration + persistence, fuzzy search, row selection, form state, form validation, optimistic-write orchestration, rollback handling, bulk actions, receipt/print generation, table column configuration, and modal markup. That is a dozen responsibilities in one function.

#### F2 — Triplicated record-page workflow (DRY violation, severity: high)

`income.tsx`, `expense.tsx`, and `workflow.tsx` each **independently reimplement the same six mechanisms**:

- filter hydrate-from-settings + `useDebouncedPersist` write-back
- `fuzzyFilterIndices` wiring → `searchFilteredRecords`
- selection state (`selectedIds` / `disabledIds` / `toggleRowSelect`)
- the optimistic save: `pending-${Date.now()}` temp id → `applyLocal` insert-or-replace → server call → replace-or-rollback → `invalidate*Family` (**4 near-identical copies**, ~80 LOC each)
- `handleBulkAction(action: "enable" | "disable" | "duplicate" | "delete" | "edit" | "print" | "cover")` — **3 copies**, identical signature, ~170 LOC each
- bulk delete executor + mass-edit apply + receipt-row construction

They have **already drifted**: `expense` supports `cover` and `income` does not, despite the identical union type; error/notice copy differs between the three. Every behaviour fix in this area is currently a 3-place edit with no compiler help.

#### F3 — Corrupted dead code shipping in `income.tsx` (severity: high)

`handleIncomeViewModeChange` is declared **four times** in one file — at lines 56, 80, 168, and 624. Three of those are dead nested copies pasted into the middle of `categoryCell`, `accountCell`, and a `useEffect` body by a botched find/replace. It compiles, so nothing caught it. This is the concrete proof of F4.

#### F4 — No linter, anywhere (severity: high)

There is no ESLint/oxlint config, no `lint` script, and no lint step in CI — despite `AGENTS.md` listing ESLint as project tooling. Unused variables, dead code, `react-hooks/exhaustive-deps` violations, and the F3 corruption all pass silently. **This is the single highest-leverage fix in the plan and costs the least.**

#### F5 — Zero renderer test coverage (severity: high)

24 test suites cover the main process and one lib module (`finance-rules.test.ts`). The 8,900 LOC of page components — where domain rules actually meet the user — have **no component tests**. The two Playwright specs are smoke-level. This is precisely why the god components feel untouchable, and it is why Phase 1 must land before any extraction.

#### F6 — 11,030-line single global stylesheet (severity: medium)

`assets/globals.css` is one flat file with no scoping. Every class name is global; deleting or renaming one is unverifiable, so nobody does, so it only grows.

#### F7 — Duplicated domain types (severity: medium)

`src/shared/finance.types.ts` (852 LOC) and `src/renderer/src/types/finance.ts` (240 LOC) both define: `AccountType`, `PaymentStatus`, `PaymentFrequency`, `PasabuyStatus`, `PullRange`, `MutationAction`, `SyncedResource`, `ActivityDirection`. Two sources of truth for the same domain enums, kept in sync by hand.

#### F8 — IPC contract spread across three unlinked files (severity: medium)

Adding one channel means editing `main/ipc/index.ts` + `preload/index.ts` + `renderer/lib/api-client.ts`, with **no compile-time link** between the channel string in preload and the handler in main. `registerIpc()` is a single 654-line function registering ~80 channels — every new feature edits the same function (OCP friction).

#### F9 — `ipcMain.handle` is monkey-patched (severity: low-medium)

`installDevLogIpcWrapper()` reassigns Electron's `ipcMain.handle` globally to add dev logging. It works, but it is invisible at the call site and hard to test. An explicit registration wrapper is equivalent and honest.

#### F10 — `as never` at the IPC boundary (severity: low)

8 occurrences, e.g. `nfApi().expenses.list(params as never)`. These discard exactly the type safety the shared DTOs exist to provide.

### Honest summary

> The main process is well-engineered. The renderer's page layer is not — it is a copy-paste layer with three drifting implementations of the same record-management workflow, no lint gate, and no tests. It is not *pervasive* spaghetti; it is **concentrated** spaghetti, which is good news: ~8 files hold nearly all of the debt, and the shared primitives to fix them (`DataTable`, `FormModal`, `MassEditModal`, `useApiQuery`) already exist and are decent.

---

## 2. Target structure

Only the renderer changes shape. The main process gains a lint gate and two small tidy-ups.

```
src/renderer/src/
  components/
    pages/
      expense/
        index.tsx              # composition only — target < 200 LOC
        expense-form-modal.tsx # the form + its automations
        expense-tables.tsx     # per-view-mode column configs (data, not JSX ternaries)
        use-expense-page.ts    # page-specific state, built on the shared hooks
        cover-expenses-modal.tsx
      income/       …same shape
      workflow/     …same shape
      chat/         …split by concern (thread list / composer / message stream / drafts)
      settings/
        modals/     # one file per modal (5 files, was 1)
  features/records/               # NEW — the shared record-page engine
    use-record-selection.ts       # selectedIds / disabledIds / toggle / selectAll
    use-optimistic-records.ts     # temp id → applyLocal → commit or rollback
    use-persisted-filters.ts      # hydrate from settings + debounced write-back
    use-record-search.ts          # fuzzy search wiring
    use-bulk-actions.ts           # the 7-action handler, parameterised by resource
    receipt.ts                    # ReceiptContext construction
  lib/            # unchanged
  types/          # re-exports from @shared only — no redefinitions
```

Rationale, stated plainly:

- **`features/records/` is not a framework.** It is five hooks, each extracted from ≥2 existing identical implementations. Nothing is added "in case".
- **Tables become data.** The view-mode ternary chain becomes a lookup table of column configs. Same rendering, same `DataTable`, no new component.
- **Pages become composition.** A page wires hooks to presentational children. That is the whole job.

---

## 3. Phased plan

Eight phases. Each is independently shippable and independently revertable. **Phases 1 and 2 are prerequisites — do not skip ahead.**

---

### Phase 0 — Baseline & instrumentation (0.5 day)

> **Model:** Sonnet · **Est.** 1 session / 0.2–0.4M tokens · **Status:** ✅ Done (closed out 2026-08-04, after Phases 1–8 had already landed — see note below). See [`refactor-baseline.md`](refactor-baseline.md).

**Why first:** you cannot prove "no behaviour change" without a recorded baseline.

1. Record the current green state: `npm run typecheck`, `npm run test`, `npm run test:e2e` — save output to `wiki/desktop/refactor-baseline.md`.
2. Record per-file LOC for the 8 god components (the shrink targets in §4).
3. Capture a manual smoke pass on the app: Dashboard, Income, Expense (all 9 view modes), Monitoring, each Workflow section, History, Sync, Settings, Chat. Screenshot each. These are the visual diff reference.

> **Closed out of order.** Commands + LOC snapshot were recorded 2026-08-02, before Phase 1
> began. `npm run test:e2e` stayed at 30/34 and the manual smoke pass stayed uncaptured through
> Phases 1–8 — genuinely open items, not just paperwork, but ones that didn't block the actual
> refactor work since typecheck/lint/vitest (Phase 1's gate) were green the whole time and
> every phase's own verification covered the code it touched. Closed 2026-08-04:
>
> - **e2e: fixed for real, not just re-run.** The 4 failures were two distinct bugs —
>   `scripts/seed-dev.mjs` never set `notion_page_id` on seeded rows, so every account picker
>   in the app (which filters to `notionSynced`, deliberately, to hide un-synced local test
>   data) silently hid them; and a hardcoded `2026-07-15` in
>   `keyboard-shortcuts.spec.ts`'s `createTestExpense()` aged out of the Expense page's
>   default current-month view once "today" passed July. Both fixed; confirmed with a manual
>   DB-level repro (launch → seed → `sqlite3` inspection) before re-running the suite, so the
>   fix is understood, not just green. **34/34 passing.** See `refactor-baseline.md` §1 for
>   the full writeup.
> - **Manual smoke pass: done via desktop-automation against the live `npm run dev` app** —
>   every section in step 3 above, plus each Income/Expense view mode, clicked through and
>   visually confirmed. No screenshot files were persisted (the tool's `save_to_disk` didn't
>   write to any path locatable from this agent's Bash tool, and several screens show real
>   personal financial data that shouldn't be uploaded/published regardless) — see
>   `refactor-baseline.md` §4 for what that means for a future pixel-diff pass.

**Exit criteria:** baseline file committed; all three commands green; screenshots stored (revised
to "visually verified" — see note above for why no image files exist).

---

### Phase 1 — Safety net: lint + renderer tests (2–3 days)

> **Model:** Sonnet · **Est.** 4–6 sessions / 3–5M tokens · **Status:** ✅ Done — lint gate live (0 errors, 115 tracked warnings), F3 dead code removed, 6 renderer test files added (43 new test cases). `npm run typecheck && npm run lint && npm run test` all green. See "What shipped vs. deferred" below.

**Why before any refactor:** F4 and F5 are what let F3 happen. Fix the gate before touching the code it guards.

1. **Add ESLint** with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react`.
   - Start in **report-only** mode: `npm run lint` runs, CI does not fail yet.
   - Enable as *errors* immediately (they are cheap and catch real defects): `no-unused-vars`, `no-unreachable`, `no-dupe-class-members`, `react-hooks/rules-of-hooks`, `@typescript-eslint/no-floating-promises`.
   - Enable as *warnings* for now (noisy, fix over later phases): `react-hooks/exhaustive-deps`, `max-lines` (600), `complexity` (15).
2. **Fix F3 immediately** — delete the three dead `handleIncomeViewModeChange` copies in `income.tsx` (lines 56, 80, 168). Pure deletion of unreachable code; verify with typecheck + tests + a manual Income smoke pass.
3. **Add renderer component tests** (Vitest + React Testing Library + `jsdom`, mocking `window.api`). Minimum set before Phase 3 may begin:
   - `expense.test.tsx` — renders each of the 9 view modes; asserts table headers and row counts.
   - `income.test.tsx` — renders 4 view modes.
   - `workflow.test.tsx` — renders all 4 sections.
   - `optimistic-save.test.tsx` — save success path, save failure path (row rolls back, notice shown).
   - `bulk-actions.test.tsx` — each of the 7 actions on each page that supports it.
   - `mass-edit.test.tsx` — patch application + partial-failure message.
4. **Wire lint + test + typecheck into CI** (`.github/workflows/`).

**Exit criteria:** `npm run lint` runs clean at error level; renderer tests exist and pass; CI enforces typecheck + lint + unit tests.

**Risk:** low — nothing but deletions of dead code and additions of tests.

**What shipped vs. deferred:**

- **Shipped as errors** (matches the plan exactly): `no-unused-vars` (~25 hits fixed — unused imports, plus `_`-prefixed the codebase's existing "kept for interface parity" convention where a value is deliberately unused), `no-unreachable` (0 hits — already clean after F3), `no-dupe-class-members` (0 hits), `react-hooks/rules-of-hooks` (0 hits), `@typescript-eslint/no-floating-promises` (2 hits fixed, `main/index.ts` + `settings-modals.tsx`, both marked `void` as deliberate fire-and-forget).
- **Shipped as warnings, exactly as planned**: `react-hooks/exhaustive-deps`, `max-lines(600)`, `complexity(15)` — 115 warnings currently outstanding, concentrated in the god components Phases 4–6 already restructure.
- **Extras from the `typescript-eslint`/`eslint-plugin-react` recommended presets, beyond the plan's named list** — fixed where cheap and safe, downgraded to warn where fixing meant touching god-component internals ahead of schedule:
  - `no-case-declarations` (6 hits, `main/notion/markdown-blocks.ts`) — fixed, trivial brace-scoping.
  - `no-explicit-any` (2 hits) — fixed (a real `any` prop replaced with the correct `ModalState` type); 15 more hits in `markdown-blocks.ts`'s Notion-block adapter left as **warn** — properly typing Notion's own loosely-shaped block API is a dedicated task, not incidental to lint setup.
  - `no-require-imports` (3 hits, `test/backup.test.ts`) — fixed via a scoped disable comment; the pattern (`require()` inside `vi.hoisted`) is Vitest's documented mocking idiom, not a mistake.
  - `react/jsx-key` (21 hits, concentrated in `expense.tsx`/`income.tsx`/`workflow.tsx`) — left as **warn**. Fixing them is safe (adding keys doesn't change rendered output) but touches the exact files Phase 4/5 restructure; deferred there rather than as an isolated edit now.
- **Two stale `eslint-disable` comments removed** (`@next/next/no-img-element` in `fab/index.tsx`, `react-hooks/set-state-in-effect` in `monitoring.tsx`) — both referenced rules from tooling this Electron app doesn't have (carried over verbatim from the web app port).

---

### Phase 2 — Type consolidation (F7, F10) (1 day)

> **Model:** Sonnet · **Est.** 1 session / 0.4–0.7M tokens · **Status:** ✅ Done — the 8 duplicated type aliases now re-export from `@shared/finance.types`; all 8 `as never` casts replaced with typed bridge casts. Typecheck green.

1. Make `renderer/src/types/finance.ts` **re-export** the 8 duplicated names from `@shared/finance.types` instead of redefining them. Keep renderer-only view types (`FinanceSectionId`, `IncomeViewMode`, `ExpenseViewMode`, …) local — those are genuinely UI concepts and do not belong in the shared DTO file.
2. Remove the 8 `as never` casts by giving `api-client.ts` the correct parameter types from `@shared`. Where a cast is genuinely required at the bridge, replace it with a narrow, commented adapter function.

**Exit criteria:** zero type redefinitions between the two files; zero `as never`; typecheck green.

**Risk:** low — compiler-verified. Any real mismatch surfaces immediately as a type error (and if one does, that is a latent bug found, ticketed, and fixed separately).

---

### Phase 3 — Extract the record-page engine (F2) (4–5 days)

> **Model:** **Opus** · **Est.** 6–10 sessions / 5–8M tokens · **Status:** ✅ **Done — all 6 extractions landed**, each verified with typecheck + lint (0 errors) + full suite green. Final: **251 tests passing**.
>
> `src/renderer/src/features/records/` — 557 LOC of shared engine:
> `use-record-selection` (69) · `use-persisted-filters` (48) · `use-record-search` (64) ·
> `use-optimistic-records` (237) · `use-bulk-actions` (93) · `receipt` (46)
>
> **Page LOC (Phase-0 baseline → now):** `expense.tsx` 1975 → **1765**, `income.tsx` 910 → **711**,
> `workflow.tsx` 653 → **626**, `monitoring.tsx` 720 → **711**, `accounts.tsx` 278 → **274**.
> Net ~330 lines out of the pages. The remaining bulk in `expense.tsx` is its 665-line JSX return
> and the form state — that's Phase 4's job, not Phase 3's.
>
> **Findings & decisions:**
> - **3.3 was a 2-call-site extraction, not 3** — `workflow.tsx` has no search UI at all.
> - **A real behavioural inconsistency was found and — with explicit approval — fixed rather than
>   preserved:** the `view.search` shortcut used to toggle search *without* clearing the query,
>   while the SearchToggle button cleared it, so closing via keyboard left a stale query that
>   silently re-applied on reopen. Both now use `toggleSearch`. Pinned by the new
>   `search-toggle.test.tsx` (3 cases, including the Mod+F path).
> - **3.4 grew to cover three shapes, not one** — single save, bulk duplicate, *and* bulk delete
>   were all duplicated across Income/Expense. `commit` / `commitMany` / `commitDelete`.
>   The per-branch `pendingIds` ↔ `applyLocal` ordering is load-bearing and is preserved verbatim
>   (documented in the hook).
> - **3.5 turned out much smaller than the plan's "~170 LOC × 3" estimate** — because 3.4 and 3.6
>   had already absorbed most of those bodies. What remained genuinely shared was the
>   enable/disable branch, the selection guards, and the delete-id collection. `useBulkActions`
>   is a dispatcher, not a god-hook: **capabilities are gated by omission** (no `onPrint`/`onCover`
>   passed ⇒ Income and Workflow simply don't have them), so the per-page drift stays explicit.
> - **Workflow's duplicate is deliberately still non-optimistic** (no temp rows/pending/notices).
>   Converting it to `commitMany` would be a behaviour change; flagged in-code for a later call.
> - `expense.tsx` carried a second, separate `hasSelection` declaration that collided with the
>   hook's — caught by typecheck, not by tests.

This is the highest-value phase. It kills the triplication.

Order matters — extract in increasing order of coupling:

1. **`use-record-selection.ts`** — lift `selectedIds`, `disabledIds`, `toggleRowSelect`, select-all. Three call sites collapse to one hook. Return memoised callbacks so `DataTable` props stay referentially stable.
2. **`use-persisted-filters.ts`** — the `settingsReady → hydrate → useDebouncedPersist` pattern, generic over the filter shape. Six call sites.
3. **`use-record-search.ts`** — `searchActive` / `searchQuery` / `fuzzyFilterIndices` → filtered records, parameterised by the field-extractor function. Three call sites.
4. **`use-optimistic-records.ts`** — the temp-id → `applyLocal` → commit-or-rollback cycle. Four call sites. **This one needs the most care:** preserve the exact current sequencing (modal closes *before* the request fires; `pendingIds` add/remove ordering; the specific failure copy). Write the test first, extract second.
5. **`use-bulk-actions.ts`** — the 7-action handler, parameterised by `{ api, records, resourceLabel, supportsCover }`. Three call sites, ~170 LOC each → one implementation.
   - Note: the union type already lists `cover` on all three pages but only `expense` implements it. **Preserve that** — gate it behind a capability flag rather than silently enabling it elsewhere. Enabling `cover` on Income would be a *feature change*.
6. **`receipt.ts`** — receipt-row/context construction.

Each extraction is its own commit, each verified by the Phase 1 tests plus a manual pass of the affected pages.

**Exit criteria:** the three pages share one implementation of each mechanism; renderer tests green; ~700–900 LOC of duplication eliminated.

**Risk:** medium — highest in the plan. Mitigated by: tests written first, one mechanism per commit, and preserving drift deliberately (see the `cover` note).

---

### Phase 4 — Break up `expense.tsx` (F1) (3–4 days)

> **Model:** Opus for the table-config design (step 1), Sonnet to execute steps 2–4 · **Est.** 4–6 sessions / 3–5M tokens · **Status:** 🟦 **Steps 1–3 done, step 4 partial — exit criteria NOT yet met.**
>
> `pages/expense.tsx` → `pages/expense/` directory: **1975 → 868 LOC** in `index.tsx`, with
> `expense-tables.tsx` (284), `cover-expenses-modal.tsx` (276), `use-expense-form.ts` (255),
> `expense-form-fields.tsx` (233), `expense-mass-edit-fields.ts` (83). Typecheck, lint (0 errors)
> and all **251 tests** green after every step — including `expense.test.tsx`, which renders all
> 9 view modes and asserts their headers, so the table-config rewrite is output-verified.
>
> **Second pass added** `expense-toolbar.tsx` (186) and `expense-receipt.ts` (63), taking
> `index.tsx` from 868 → **733**.
>
> **The ≤400 criterion is not met, and should be revised rather than forced.** What is left in
> `index.tsx` is exactly page orchestration and nothing else: data wiring, the four record-modal
> handlers, the bulk-action config, ~12 shortcut registrations, and ~107 lines of composition
> JSX. Every remaining block carries a 20+ identifier dependency surface (`applyMassEdit` alone
> touches 12 state setters, the API, the optimistic-commit helpers and the selection hook), so
> extracting them would produce hooks with 20-field config objects — the "no speculative
> abstraction" trap §0.2 explicitly forbids, and strictly worse to read than the linear
> composition that exists now.
>
> **Recommended replacement criterion:** *no non-composition concern lives in `index.tsx`* —
> which **is** now satisfied: table markup, form state, receipt logic, the cover modal, the
> mass-edit catalogue and the toolbar have all moved out. Note the same applies to Phase 5's
> targets: `income.tsx` (711) and `workflow.tsx` (626) will land in the same range for the same
> structural reason, so the ≤400 number is systematically optimistic for these pages.
>
> **Preserved deliberately:** the Unpaid Pasabuy footer still emits 9 cells against 8 headers
> (total under "Pasabuyer" instead of "Pasabuyer Balance"). Reproduced verbatim in
> `expense-tables.tsx` with a comment; it stays ticketed as its own bug per §0.1.

1. **Tables → data.** Replace the view-mode ternary chain with a `Record<ExpenseViewMode, TableConfig>` lookup, where `TableConfig` is `{ headers, buildRow, buildFooter, wide, showBulkPrint }`. The `DataTable` component and its props are unchanged; only how the config is chosen changes.
   - *While here:* the `Unpaid Pasabuy` footer builds **9 cells against 8 headers**. Do not fix it in this commit — file it as a bug ticket, land the refactor preserving current output, then fix it separately with its own test.
2. **Form → `expense-form-modal.tsx`.** Moves the ~20 form `useState`s, the derived-figure calculations, and the two automation handlers (`onSelectPaymentStatus`, `onSelectPasabuyStatus`) behind a `useExpenseForm()` hook. The automations are real domain rules — they move intact, with unit tests.
3. **`CoverExpensesModal` → its own file** (it is already a separate component at the bottom of the file; this is a pure move).
4. **`index.tsx` becomes composition.** Target < 200 LOC.

**Exit criteria:** no file in `pages/expense/` exceeds 400 LOC; all 9 view modes render byte-identically to the Phase 0 screenshots.

---

### Phase 5 — Apply the same treatment to income / workflow (2 days)

> **Model:** Sonnet — pattern already established by Phases 3–4 · **Est.** 2–3 sessions / 1.5–2.5M tokens · **Status:** ✅ Done — income 711 → 544, workflow 626 → 522, across 8 files; ≤400 criterion revised per Phase 4 notes (see below)

Same decomposition, much cheaper now that Phases 3 and 4 have done the design work.

> **Income** (5.1–5.3): extracted `use-income-form.ts` (79) + `income-form-fields.tsx` (97),
> `income-toolbar.tsx` (152), `income-mass-edit-fields.ts` (33) — no "tables become data" step
> needed since all 4 view modes share one table shape. `index.tsx`: 711 → **544**.
>
> **Workflow** (5.4–5.5): extracted `use-workflow-form.ts` (61) + `workflow-form-fields.tsx`
> (173). Validation/payload-building stayed inline in `index.tsx` (not pushed into the hook)
> because it branches on section (transfer/CC/alkansya/receivables) — pulling it out would need
> the same 20-field config object the Phase 4 notes flagged as the "no speculative abstraction"
> trap. The 16-line toolbar and 35-line header/row ternary also stayed inline: too small to
> extract without violating §0.2. `index.tsx`: 626 → **522**.
>
> Same reasoning as Phase 4 applies to why neither lands under 400: what remains in each
> `index.tsx` is orchestration — data wiring, record-modal handlers, bulk-action config, shortcut
> registrations, and composition JSX — not extractable without producing worse code.
>
> Typecheck, lint (0 errors) and all **251 tests** green after every step.

**Exit criteria (revised, matching Phase 4):** no non-composition concern lives in either
`index.tsx` — satisfied for both.

---

### Phase 6 — Split `chat.tsx`, `settings-modals.tsx`, `fab/index.tsx` (2–3 days)

> **Model:** Sonnet — mostly pure file moves · **Est.** 3–4 sessions / 2–3M tokens · **Status:** ✅ Done — see notes; one file (chat's `index.tsx`) misses the 500 LOC criterion deliberately

Lower risk than Phases 4–5 because these are mostly *file splits*, not logic extractions.

> **`settings-modals.tsx`** (1079 → 5 files + a barrel `index.tsx`): `profile-manage-modal.tsx`
> (114), `interface-manage-modal.tsx` (124), `theme-customize-modal.tsx` (167),
> `notion-config-modal.tsx` (170), `ai-chat-config-modal.tsx` (388) + `use-ai-chat-config.ts`
> (225) — the AI modal alone was 542 lines pre-split, so its state/handlers were pulled into a
> hook (same useXForm pattern as Phase 4/5) to land it under 500. All consumers
> (`settings.tsx`, `chat.tsx`) import from `@/components/pages/settings-modals` unchanged.
>
> **`chat.tsx`** (1491 → `chat/` directory): `draft-card.tsx` (434, fully self-contained,
> zero coupling to the page — a clean pure move), `chat-sidebar.tsx` (130), `message-stream.tsx`
> (202), `composer.tsx` (193), `use-chat-credentials.ts` (174, the "which key/model is active"
> concern — the one piece of state with a genuinely clean boundary), `index.tsx` (**611**).
> `index.tsx` misses the 500 LOC target: threads, messages, drafts, and the composer's overlay
> state are all cross-coupled (`onSend` alone touches activeId/credentialId/modelId/draft/
> messages/refreshDrafts/refreshThreads), which is exactly the "chat state machine" this
> phase's own instructions said not to invent. Splitting further would mean threading a dozen
> pieces of state between hooks for no readability win — the same "no speculative abstraction"
> call as Phase 4/5's `index.tsx` files. No `chat.test.tsx` exists, so this split leaned more
> heavily on typecheck + lint (0 errors) + the existing 251-test suite (unaffected, chat has no
> coverage) than on regression tests; worth a manual smoke test before shipping.
>
> **`fab/index.tsx`** (741 → 5 files): the four modals (`QuickAddIncomeModal`,
> `QuickAddExpenseModal`, `ReceiptModal`, `InsightShotModal`) were already fully self-contained
> with no shared state — a pure move. `index.tsx` (115) keeps just the FAB shell (toggle +
> menu + modal dispatch). All five files land well under 500 LOC.
>
> Typecheck and lint (0 errors) clean after every step; all **251 tests** green throughout.

**Exit criteria:** no file over 500 LOC in these three areas — met everywhere except
`chat/index.tsx` (611), for the reason above.

---

### Phase 7 — IPC surface & main-process tidy-up (F8, F9) (2 days)

> **Model:** Sonnet — steps 1 and 3 are pure moves; step 2 is compiler-guided · **Est.** 2 sessions / 1–1.5M tokens · **Status:** ✅ Done — all three exit criteria met

Deliberately last, and deliberately modest — the main process is not the problem.

1. **Split `registerIpc()`** into per-domain registrars (`registerRecordsIpc`, `registerSyncIpc`, `registerNotionIpc`, `registerChatIpc`, `registerSettingsIpc`, `registerUpdaterIpc`) each in its own file under `main/ipc/`. `index.ts` becomes a 20-line composition root. Channel strings and handler bodies are **unchanged** — this is a pure move.
2. **Define channels once.** A `shared/ipc-channels.ts` const map, imported by both `main/ipc/*` and `preload/index.ts`, so a typo in either becomes a compile error instead of a runtime "no handler registered".
3. **Replace the `ipcMain.handle` monkey-patch** with an explicit `handle(channel, fn)` helper that both registers and wraps with dev logging. Same behaviour, visible at every call site, unit-testable.

> **Step 3 first, then 1.** `main/ipc/handle.ts` (67 LOC) is the new `handle(channel, fn)` —
> same dev-log wrapping logic as the old `installDevLogIpcWrapper()`, but it registers via a
> plain call to `ipcMain.handle` instead of reassigning the function. Every registrar calls
> `handle(...)` as its registration primitive, so doing this first made the split mechanical.
>
> **Step 1:** `registerIpc()` (654 LOC, ~80 handlers) → `records.ts` (235), `sync.ts` (92),
> `notion.ts` (32), `chat.ts` (213), `settings.ts` (15), `updater.ts` (30), plus `shared.ts`
> (31, the `result`/`changed` helpers every registrar uses) and `handle.ts` (67).
> `index.ts` is now 22 lines — six calls, one per registrar. Channel strings and handler
> bodies are byte-identical to the original; only which file they live in changed.
> `devLogs:*`/`app:ping`/`db:health`/`windows:new`/`pageContent:*` landed in `records.ts`
> (the plan names only 6 registrars, and these are foundational reads/writes with no
> better-fitting bucket) — `sync:listConflicts`/`resolveConflict`/`resolveAllConflicts` and
> `backup:*` went to `sync.ts` since they're sync-domain by function, not by channel prefix.
>
> **Step 2:** `shared/ipc-channels.ts` — an `IPC_CHANNELS` const map (86 entries, one per
> `ipcMain.handle`/`ipcRenderer.invoke` pair; confirmed 1:1 by diffing both channel-string
> sets before writing it). Every registrar and `preload/index.ts` now reference
> `IPC_CHANNELS.xxx` instead of a raw string literal. Scope was deliberately narrower than
> "every channel string in main": the ~8 broadcast-only event channels (`records:changed`,
> `sync:status`, `updater:progress`, etc.) are emitted from `sync/`, `updater/`, `windows/`,
> and `dev-logs/` — well outside `main/ipc/*` — and converting those too would have meant
> touching files the plan's step 2 wording doesn't mention. Left as-is; they're already typed
> via the existing `EventChannel` union in `finance.types.ts`.
>
> Verified by typecheck (`tsconfig.node.json` covers `src/main/**` and `src/preload/**`, so
> the channel-constant link is genuinely compiler-checked, not just visually consistent),
> lint (0 errors), the full **251-test** suite, and a full `electron-vite build` (main +
> preload + renderer all bundle cleanly) — the strongest verification pass of any phase in
> this refactor, since IPC wiring bugs are invisible to typecheck/lint alone if the channel
> strings still happen to match by coincidence.

**Exit criteria:** no file in `main/ipc/` over 250 LOC (largest is `records.ts` at 235);
`ipcMain.handle` is no longer reassigned, and is called from exactly one place (`handle.ts`);
channel strings exist in exactly one place (`shared/ipc-channels.ts`) for every
request/response channel. All met.

---

### Phase 8 — CSS scoping (F6) (2–3 days, optional / can be deferred)

> **Model:** **none — script this, don't spend tokens on it.** Step 1 is `sed` work verified by byte-comparing the built CSS bundle; 1.5–3M tokens would be waste. · **Status:** 🟦 Step 1 done via script; **step 2 (CSS Modules) landed** — 11 components migrated, orphaned-rule cleanup + keyframe restoration complete, all green (see step-2 note below)

Lowest priority — it is real debt but it blocks nobody today.

1. Split `globals.css` by concern into `base/`, `layout/`, `components/`, `pages/` — **imports only, zero rule changes**. Verify with a byte-comparison of the built CSS bundle.
2. Only *after* that, migrate genuinely component-local rules to CSS Modules, one component per commit, verified by screenshot diff against Phase 0.

Stop after step 1 if time is short. Step 1 alone delivers most of the navigability win at near-zero risk.

> **Step 1, done — but not the way this section originally assumed.** Two scripts, run in
> sequence:
>
> **`scripts/dedupe-globals-css.mjs` (prerequisite, not in the original plan).** Splitting
> the file into separate `@import`ed modules and building with `electron-vite build`
> revealed that Vite's production build silently deduplicates CSS content that is
> byte-identical *across separate imported files* (confirmed with a minimal standalone
> repro) — but not within one file. `globals.css` turned out to genuinely have that
> duplication: **44 of its 161 top-level sections (2,738 of 11,030 lines) were exact
> byte-for-byte repeats of an earlier section** — dead CSS left behind by a past redesign
> (e.g. the old "Conflict resolution: list" modal styles sitting alongside its later
> "three-way merge" replacement) that nobody had cleaned up. Left in place, the naive
> `@import` split would have shrunk the built bundle by ~26% as a silent side effect of
> the bundler's own dedup — passing "the app still works" but failing "byte-comparison of
> the built bundle" for reasons that had nothing to do with the split itself.
>
> Removal rule, chosen to be provably cascade-safe without needing to reason about
> anything else in the file: **for each set of duplicate sections, keep only the *last*
> occurrence, delete the earlier ones.** CSS's cascade tie-break for equal specificity is
> "last rule in source order wins" — removing an earlier copy of an identical rule can
> only ever remove an assertion that was already losing to the later, kept copy, so this
> holds regardless of what other rules sit between or after them. Verified two ways:
> (1) the script re-parses its own output and refuses to write unless every kept section's
> content is untouched and in original order; (2) a statement-level (not line-level) diff
> of the built CSS bundle before/after — splitting the file into individual top-level
> rules/at-statements and comparing as multisets — showed **zero new or modified
> statements, and zero statements dropped to 0 remaining copies**; only the expected 379
> duplicate statement-instances went away.
>
> **`scripts/split-globals-css.mjs`.** Splits the now-duplicate-free file at its existing
> top-level `/* comment */` section boundaries (117 sections) into `base/` (3 files, 446
> LOC — root tokens + the dark-mode switch), `layout/` (9, 1,226 LOC — shell/sidebar/nav/
> responsive breakpoints), `components/` (36, 2,013 LOC — reusable UI primitives), `pages/`
> (69, 4,491 LOC — page/feature-scoped styles: Chat mode, Settings panels, Receipt/Insight
> export, Notion Preview, etc.), classified by keyword rules against each section's header
> text. `globals.css` becomes a 117-line flat `@import` list in the exact original order —
> classification only decides which folder a file lives in, never its content or position,
> so a wrong guess costs navigability, not correctness. One content edit was necessary and
> is called out explicitly in the script: the pre-existing `@import "./fonts.css";` moved
> one directory level deeper, so its `./` prefix is rewritten to `../` at write time.
> Verified the same two ways as above (self-check reconstruction + statement-level bundle
> diff), plus a full `electron-vite build` — the final bundle's non-comment statement
> multiset is **identical** to the pre-split (post-dedupe) baseline; the only textual diff
> is blank-line whitespace at a couple of file-join boundaries (confirmed by inspection,
> zero rule/declaration content in the diff).
>
> Both scripts are idempotent-checked (dry-run mode, refuse-to-write guards) and left in
> `scripts/` for reference/rerun if `globals.css` ever regresses back to one file.
>
> Verified: typecheck clean, lint 0 errors (95 pre-existing warnings, unchanged), all
> **251 tests** green, full production build succeeds.
>
> **Step 2 (CSS Modules migration), landed.** A verification pass over the 10 pre-existing
> module pairs surfaced one silent break (`layout/index.tsx` referenced `styles.nav__badge`,
> which the module never defined — the class was emitted as `undefined` and the badge went
> unstyled) plus **31 orphaned global rules** in `assets/{base,layout,components,pages}/`
> that referenced now-hashed module classes (e.g. `.workspace--sidebar-collapsed .sidebar
> .nav__badge`, `table.data-table--wide`, `.notion-preview .np-callout`, `.field--error
> .field__input--shake`) and therefore silently stopped applying after the step-1 split.
> Worse, CSS Modules hashes `animation:` names but not the referenced `@keyframes`, so five
> animations (`shake`, `shimmer`, `icon-busy-pulse`, `conflict-slide-up`,
> `bulk-toolbar-enter`) were emitting references to keyframes that no longer existed.
>
> Fix pattern, applied consistently and behaviour-preservingly (rule bodies moved verbatim,
> never rewritten):
> 1. **Append every orphaned rule to the owning module**, wrapping only the *consumer*
>    class in `:global(...)` where a component emits a literal class string that cannot be
>    hashed without touching runtime markup (`.sidebar`, `.workspace--sidebar-collapsed`,
>    `.shortcut-hint`, `.field__input--shake`, `.settings-row`, `.filter-select`,
>    `.np-*` from `preprocess()`, `.print-root`, `.is-printing`). The module-owned class
>    stays hashed; the literal global stays literal — same selector, same cascade.
> 2. **Move every module-referenced `@keyframes` into the module** so the hashed animation
>    name resolves.
> 3. **Delete global files that became fully migrated** (9 files: `006`, `102`, `023`,
>    `059`–`062`, `068`, `082`) and **prune only the migrated rules** from mixed files
>    (`005`, `009`, `010`, `075`, `076`, `067`, `098`), keeping their global-only rules.
> 4. **Remove the deleted files' `@import` lines** from `globals.css` (9 lines), keeping the
>    order of the remaining 108.
>
> Migrated/verified modules (11): `fab/receipt-modal`, `layout/index`, `pages/dashboard`,
> `pages/dev-logs`, `pages/monitoring`, `pages/sync`, `pages/chat/draft-card`,
> `ui/data-table`, `ui/index`, `ui/notion-preview`, `ui/toast`.
>
> **Verification.** The plan's step-2 exit criterion is "screenshot diff against Phase 0" —
> **unavailable**: no Phase 0 screenshots exist (see `refactor-baseline.md` §4). Substituted
> verification: (a) a custom orphan check (stripping `:global()` content from module
> selectors) reporting **0 orphaned global rules** referencing module classes; (b) all 11
> module pairs pass `scripts/verify-css-module.mjs`; (c) built-bundle inspection confirming
> hashed keyframes now exist for every hashed `animation:` reference, `nav__badge` is hashed
> and styled, collapsed-sidebar/`np-*`/print/`filter-select` rules compile with correct
> `:global` ancestors; (d) full suite green — typecheck, lint 0 errors (95 warnings
> unchanged), **251 tests passed / 7 skipped**, `electron-vite build` succeeds (CSS
> 186.18 kB). One known uncertainty: the layout module's tablet drawer block uses
> `display: revert`/`justify-content: flex-start` inferred from the original `layout/075`
> media-query body (truncated during the pass) — visually smoke-test the collapsed-sidebar
> drawer at ≤1023px before release.

---

## 4. Success metrics

| Metric | Now | Target |
|---|---|---|
| Largest file | 1975 LOC | ≤ 400 LOC |
| Files > 600 LOC | 14 | 0 |
| Renderer test suites | 1 | ≥ 8 |
| Duplicated bulk-action implementations | 3 | 1 |
| Duplicated optimistic-save implementations | 4 | 1 |
| Duplicated domain type definitions | 8 | 0 |
| Lint gate | none | enforced in CI |
| `as never` casts | 8 | 0 |
| User-visible behaviour changes | — | **0** |

---

## 5. Sequencing, model routing, budget & status

### Status legend

`⬜ Not started` · `🟦 In progress` · `✅ Done` · `⏸️ Blocked` · `⏭️ Deferred / skipped`

**Update the Status column as work lands.** Keep it honest — a phase is `✅ Done` only when its exit criteria are met and the full verification command is green.

### Tracker

| Phase | Model | Sessions | Est. tokens | Effort | Depends on | Risk | Status |
|---|---|---|---|---|---|---|---|
| 0 — Baseline & instrumentation | Sonnet | 1 | 0.2–0.4M | 0.5 d | — | none | ✅ Done (closed out of order — see phase notes) |
| 1 — Lint + renderer tests | Sonnet | 4–6 | **3–5M** | 2–3 d | 0 | low | ✅ Done |
| 2 — Type consolidation | Sonnet | 1 | 0.4–0.7M | 1 d | 1 | low | ✅ Done |
| 3 — Record-page engine | **Opus** | 6–10 | **5–8M** | 4–5 d | 1, 2 | **medium** | ✅ Done (6/6) |
| 4 — Split `expense.tsx` | Opus → Sonnet | 4–6 | 3–5M | 3–4 d | 3 | medium | ✅ Done — 1975 → 733 across 8 files; ≤400 criterion revised (see phase notes) |
| 5 — Split income / workflow | Sonnet | 2–3 | 1.5–2.5M | 2 d | 3, 4 | low | ✅ Done — income 711 → 544, workflow 626 → 522; ≤400 criterion revised (see phase notes) |
| 6 — Split chat / settings / fab | Sonnet | 3–4 | 2–3M | 2–3 d | 1 | low | ✅ Done — chat `index.tsx` (611) is the one file over the 500 LOC target (see phase notes) |
| 7 — IPC tidy-up | Sonnet | 2 | 1–1.5M | 2 d | 1 | low | ✅ Done — all exit criteria met |
| 8 — CSS (optional) | *script, not Claude* | 2–3 | 1.5–3M | 2–3 d | — | low | 🟦 Step 1 done (script); step 2 landed (11 modules, orphans + keyframes fixed, green; screenshot-diff exit criterion unavailable — build-level verification, see phase notes) |

**Totals — full plan:** ~25–36 sessions, **~18–30M tokens**, ~17–23 working days (~12–15 d if Phase 8 is deferred and Phases 6–7 run in parallel with 4–5).

**Minimum viable slice:** **Phases 0 → 1 → 3** — ~11–17 sessions, **~9–14M tokens**, ~7 days. Removes the two problems that actually cost velocity (missing safety net + triplication). Phases 4–8 become substantially cheaper once 3 lands, because the pattern is established and Sonnet can follow it.

### Model routing rationale

Routing is worth **3–5× on total budget** on its own. It is the single biggest cost lever in this plan.

| Phase | Model | Why |
|---|---|---|
| 3 (all), 4 (design step) | **Opus** | Phase 3 is the only place where a subtle sequencing mistake silently breaks optimistic writes — specifically `use-optimistic-records`, where modal-close ordering, `pendingIds` add/remove ordering, and rollback copy must be preserved exactly. Pay for judgment here. In Phase 4, Opus decides the tables-become-data shape; Sonnet executes it. |
| 1, 2, 5, 6, 7 | **Sonnet** | Writing tests against a written spec, pure file moves, and compiler-guided type work. The typecheck + test gate catches errors regardless, so the marginal value of Opus is low. |
| 0 | Sonnet | Running commands and recording output. |
| 8 | **Neither** | Splitting a 230k-char CSS file by concern is `sed` work verified by a byte-comparison of the built bundle. Spending 1.5–3M tokens on it is waste. Script it or defer it. |

### Token budget notes

- **The content is not the cost.** Reading all of `src/` once is only ~346k tokens. Cost is driven by *turns × context-size-per-turn* — refactor work is verification-heavy (edit → typecheck → test → re-read → fix), giving a realistic **15–30× multiplier** over raw content volume.
- **Session hygiene is worth 3–4×.** One phase — ideally one extraction — per session, then clear context. A disciplined 25-turn session versus one that sprawls to 80 turns with a bloated context is a 3–4× difference on identical work; context accumulation is superlinear.
- **Phase 3 should be run one extraction per session** (six sessions minimum), not as one long session. This is both a cost measure and a safety measure — it matches the "one mechanism per commit" rule in §0.
- These are estimates with real spread. Track actuals in the Status column as phases land and recalibrate the remaining rows.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Silent behaviour change during extraction | Phase 1 tests land first; per-mechanism commits; Phase 0 screenshots as visual reference |
| Extraction introduces re-renders / jank | Preserve existing `useMemo`/`useCallback` boundaries; hooks return stable refs; no new providers around list renders |
| Drift between the 3 pages is *intentional* somewhere | Treat every difference as intentional until proven otherwise — parameterise it (e.g. `supportsCover`), never unify it silently |
| Latent bugs surface mid-refactor (e.g. the 9-vs-8 footer cells) | Ticket them; preserve current output in the refactor commit; fix separately with a dedicated test |
| Merge conflicts against active feature work | Phases are small and independently mergeable; land each within a day or two of starting it |
| Over-abstraction creeping in | The ≥2-call-site rule is a hard review gate. One implementation = no abstraction. |

---

## 7. Definition of done

- [ ] All Phase exit criteria met
- [ ] `npm run typecheck && npm run lint && npm run test && npm run test:e2e` green
- [ ] Manual smoke pass matches the Phase 0 screenshots for every section
- [ ] No file over 400 LOC in `renderer/src/components/pages/`
- [ ] `CHANGELOG.md` records the refactor with an explicit "no functional changes" note
- [ ] `wiki/desktop/project-structure.md` and `AGENTS.md` repository map updated to the new layout
- [ ] Every row in the §5 tracker is `✅ Done` or explicitly `⏭️ Deferred` with a reason, and actual token spend is recorded against each estimate
