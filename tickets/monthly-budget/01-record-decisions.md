# 01: Record the saved-budgets decisions

**Type:** doc-drift
**Status:** in-review
**Blocked by:** None
**Owner:** claude

## What to build
The decisions made while grilling the saved-budgets feature are written into the spec, the glossary and an ADR, so the spec and tickets that follow start from settled answers.

## Acceptance criteria
- [x] AC1: The open questions in `wiki/desktop/monthly-budget-snapshots.md` are closed with the decisions from the 2026-11-16 grilling.
- [x] AC2: `GLOSSARY.md` defines Saved budget (UI label "Saved budgets", table `monthly_budget_snapshots`) and Budget source.
- [x] AC3: `docs/adr/0006-saved-budgets-local-only.md` records that saved budgets are stored locally only, with no Notion mirror.
- [x] AC4: `validate` passes.

## Inputs
- `wiki/desktop/monthly-budget-snapshots.md` (the spec)
- `tickets/features/monthly-budget-snapshots.md` (earlier draft ticket, not in the toolbox layout)
- `docs/adr/0004-derived-values-computed-not-stored.md`

## Evidence
- Commits: pending (changes are uncommitted)
- PR:
- Tests: `node .ai/cli/bin/cli.mjs validate`
- Review:
- Docs updated: `wiki/desktop/monthly-budget-snapshots.md` (status, terms, non-goals, chat, edge cases, section 16 Decisions), `GLOSSARY.md` (Saved budget, Budget source), `docs/adr/0006-saved-budgets-local-only.md`

## Progress log
### 2026-11-16 claude
- Did: Claimed after the user's go-ahead: "yes to all" on the ticket draft in round 2 of `grill-with-docs`.
- Decisions: UI name "Saved budgets" (table stays `monthly_budget_snapshots`); Quarterly stays 4 months, changing it is a separate ticket; Edit budgets and CSV use the category list Monitoring shows; CSV import overwrites matching rows with a skip-existing-months option; saving the current or a future month is allowed; a category missing from a saved month shows 0; delete asks a normal confirm for every month; chat parity deferred to the last phase and defaults to Notion budgets; the Need/Wants/Savings split stays current-only; work splits into four tickets under `tickets/monthly-budget/`, one per spec phase.
- Did: Updated the spec (section 16 now lists the 11 decisions), the glossary and added ADR-0006. `validate` passes.
- Next: `/to-spec` then `/to-tickets` to create the four implementation tickets; mark `tickets/features/monthly-budget-snapshots.md` as superseded then.
