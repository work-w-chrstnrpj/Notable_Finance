# 01: Adopt engr-toolbox into Notable Finance

**Type:** doc-drift
**Status:** done
**Blocked by:** None
**Owner:** claude

## What to build
The repository is onboarded to the engr-toolbox workflow without losing any existing project documentation: project goal, stack and verification commands are recorded, one page of architecture exists, the glossary and retroactive decisions are written, and the context maps point at real code.

## Acceptance criteria
- [x] AC1: `AGENTS.md` states the project goal, tech stack and verification commands (lint, typecheck, test, build), and nothing existing is removed.
- [x] AC2: `docs/architecture.md` is filled (status no longer NOT_STARTED) with modules, data flow, external systems and trust boundaries, linking to code and the existing `wiki/`.
- [x] AC3: `GLOSSARY.md` holds the project's key domain terms.
- [x] AC4: Decisions already visible in the code are recorded as ADRs with `Status: accepted (retroactive)`.
- [x] AC5: `.ai/maps/` files describe only areas that exist, using `- <thing> → \`<path>\`` lines.
- [x] AC6: `drift --mark` has been run and `validate` passes.

## Inputs
- `README.md`, `AGENTS.md`, `wiki/` (existing documentation, linked and not moved)
- `notable-finance-app/package.json`, `.github/`
- `engr-toolbox.json` (installer choices: size small, mode existing, tracker local)

## Evidence
- Commits: shipped in desktop v3.1.0 (merge 7bf9d4c on main)
- PR: https://github.com/work-w-chrstnrpj/Notable_Finance/pull/11 merged (7bf9d4c)
- Tests: `node .ai/cli/bin/cli.mjs validate` → 54 checks passed
- Review: None yet
- Docs updated: `AGENTS.md` (Build command), `docs/architecture.md`, `GLOSSARY.md`, `docs/adr/0001` to `0005`, `.ai/maps/{application,data,testing}-map.md` (Code Index sections), `.agents/roles/*.md` (heading `Reusable Skills` renamed to `Skills` so `validate` passes)

## Progress log
### 2026-11-16 claude
- Did: Opened the ticket after the installer ran. The installer left `AGENTS.md`, `README.md` and `wiki/` untouched. `tickets/features/monthly-budget-snapshots.md` and `tickets/investigations/` pre-date the toolbox layout and are left in place.
- Did: `AGENTS.md` already had the goal, stack and checks; added the missing Build command. Filled architecture, glossary, five retroactive ADRs and map code indexes. Marked the drift sync point at 6f36ea5. `validate` first failed on the 8 existing roles (heading `Reusable Skills` instead of `Skills`); renamed the heading in `.agents/roles/`, `validate` now passes.
- Next: Commit. The generated adapter copies of the 8 renamed roles (`.claude/agents/` and the other tool folders) still show the old heading until adapters are synced.

### 2026-11-16 claude
- Did: `update-docs` pass for the toolbox. `AGENTS.md`: added a Ticket Workflow section, corrected stale rules (Notion as source of truth, "backend", email/Google sign-in, server-side token storage), listed `docs/`, `GLOSSARY.md`, the 10 roles and the toolbox checks. `README.md`: version v3.0.0, real page layout, repository layout, a toolbox section and doc links. `.ai/context-routing.md` and `.ai/maps/agent-map.md`: toolbox routing and `cli sync`. `tests/README.md`, `scripts/README.md`, `tickets/README.md`: current coverage, a note that the PowerShell validator conflicts with the toolbox layout, and the pre-toolbox ticket folders. `validate` passes (54 checks), `drift` clean.
- Next: Commit. Decide whether to retire or reconcile `scripts/validate-ai-template.ps1`, and run the toolbox `sync` for the generated adapters.

### 2026-11-19 claude
- Did: Ran the toolbox `cli sync`, which regenerated the adapter files for all tools; `.claude/agents` and the others now carry the current role headings. Ran `drift --mark` (sync point 7aa800f). `validate` passes (55 checks). Still open from earlier: `scripts/validate-ai-template.ps1`, `generate-ai-adapters.ps1` and `sync-ai-adapters.ps1` conflict with the toolbox layout; I left them in place because retiring scripts is the user's call.
- Note: `drift` lists `docs/database/data-model.md` and `docs/testing/test-specification.md`, which do not exist in this repo; the real docs are under `wiki/` and were updated for saved budgets in monthly-budget/05.
- Next: `[serve]` to commit; waiting for the user's acceptance.

### 2026-11-21 claude
Closed after release: code shipped in desktop v3.1.0. Criteria checked against passing tests (full suite 583 passed, 41 SQLite tests skipped under plain Node; typecheck and lint clean).
