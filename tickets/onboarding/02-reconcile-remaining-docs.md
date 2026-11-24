# 02: Reconcile remaining docs with the toolbox

**Type:** doc-drift
**Status:** done
**Blocked by:** None
**Owner:** claude

## What to build
Docs outside the first adoption pass no longer mention the old PowerShell sync, the old 8-role count, or the old pages layout, and the wiki points readers to the toolbox docs (architecture, ADRs, glossary, tickets).

## Acceptance criteria
- [x] AC1: `CONVENTIONS.md`, `.agents/README.md` and the tool-folder READMEs point to the toolbox CLI (`node .ai/cli/bin/cli.mjs sync`) and say 10 roles.
- [x] AC2: `wiki/README.md` links `docs/architecture.md`, `docs/adr/`, `GLOSSARY.md` and `tickets/`.
- [x] AC3: `wiki/desktop/project-structure.md` describes the real pages layout.
- [x] AC4: `validate` passes.

## Inputs
- `tickets/onboarding/01-adopt-project.md` (previous pass)
- Audit in the conversation of 2026-11-16: stale references found by grep

## Evidence
- Commits: shipped in desktop v3.1.0 (merge 7bf9d4c on main)
- PR: https://github.com/work-w-chrstnrpj/Notable_Finance/pull/11 merged (7bf9d4c)
- Tests: `node .ai/cli/bin/cli.mjs validate` → passed; `grep` for `generate-ai-adapters` and `sync-ai-adapters.ps1` in the edited READMEs returns nothing
- Review: None yet
- Docs updated: `CONVENTIONS.md`, `.agents/README.md`, `.cursor/README.md`, `.claude/README.md`, `.codex/README.md`, `.github/README.md`, `.opencode/README.md` and the `agents/` and `skills/` READMEs under `.claude`, `.codex`, `.cursor`, `.github`, `.opencode`, `wiki/README.md`, `wiki/desktop/project-structure.md`

## Progress log
### 2026-11-16 claude
- Did: Claimed after the user's go-ahead: "yes, go ahead" to fix the stale docs listed in the audit.
- Did: Replaced the PowerShell sync references with `node .ai/cli/bin/cli.mjs sync` in the READMEs, set the role count to 10 in `.agents/README.md`, added a toolbox pointer to `CONVENTIONS.md`, added an "Outside the wiki" section to `wiki/README.md`, and reworded the pages comment in `project-structure.md`.
- Next: Commit. Not checked: the `wiki/desktop/` pages beyond `project-structure.md` were not compared line by line with the code, and the generated adapters still carry the old `Reusable Skills` heading until `cli sync` runs.

### 2026-11-19 claude
- Did: `cli sync` has now run, so the generated adapters match `.agents/` (the old `Reusable Skills` heading is gone). `grep` finds no `generate-ai-adapters` or `sync-ai-adapters.ps1` in the Markdown docs. `validate` passes.
- Not checked: the `wiki/desktop/` pages other than `project-structure.md` were still not compared line by line with the code.
- Next: `[serve]` to commit; waiting for the user's acceptance.

### 2026-11-21 claude
Closed after release: code shipped in desktop v3.1.0. Criteria checked against passing tests (full suite 583 passed, 41 SQLite tests skipped under plain Node; typecheck and lint clean).
