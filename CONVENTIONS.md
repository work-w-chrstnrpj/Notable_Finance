# Project Conventions

Generated summary for Aider. Canonical sources: `AGENTS.md` and `.agents/`.

## Operating Rules

- Exact source files are truth; maps and indexes are navigation only.
- Update canonical `.agents/` files first, then run `node .ai/cli/bin/cli.mjs sync`.
- All work happens on a ticket in `tickets/` and ends with evidence; reference the ticket ID in each commit (`[feature/NN]`). See `AGENTS.md` (Ticket Workflow).
- Never claim verification passed unless it actually ran.
- Ask approval before destructive, production, secret, or migration operations.

## Canonical AI Structure

- Roles: `.agents/roles/`
- Skills: `.agents/skills/` (reusable workflows only)
- Overlays: `.agents/overlays/` (Mentor, Coach)
- Workflows: `.agents/workflows/`
- Tool policies: `.agents/tools/`
- Tickets, architecture, decisions, language: `tickets/`, `docs/architecture.md`, `docs/adr/`, `GLOSSARY.md`

See `.agents/tools/verification-policy.md` and `.agents/tools/adapter-generation-policy.md`.
