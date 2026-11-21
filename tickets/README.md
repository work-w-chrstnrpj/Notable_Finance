# Tickets

All work lives here. Every ticket ends with evidence.

```text
tickets/
  BOARD.md              ← generated summary, read this first
  <feature>/
    spec.md             ← from /to-spec
    01-<slug>.md        ← one file per ticket, ID <feature>/01
    02-<slug>.md
```

- Format, states and rules: the `tickets` skill (`.agents/skills/tickets/SKILL.md`).
- Create tickets with `/to-tickets`, work them with `/implement`, triage incoming ones with `/triage`.
- See the board: `node .ai/cli/bin/cli.mjs status`. Rewrite `BOARD.md`: `status --write`.
- A `done` ticket with empty Evidence fails `validate`.
- Reference the ticket ID in every commit: `git commit -m "feat: add export [orders/03]"`.

## Existing folders

- `onboarding/`: the adoption ticket for this toolbox.
- `investigations/`: investigation reports written before the toolbox (not tickets).
- `features/`: a ticket draft from before the toolbox layout (`monthly-budget-snapshots.md`). When that feature starts, move it to `tickets/monthly-budget/` through `/to-spec` and `/to-tickets`, linking `wiki/desktop/monthly-budget-snapshots.md` as the spec.
