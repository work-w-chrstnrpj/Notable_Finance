# Context Routing

Use this guide before reading broad wiki pages or source folders.

## Default Flow

1. Read `AGENTS.md`.
2. Identify the task type and lead role from `.ai/maps/agent-map.md`. Read `tickets/BOARD.md` and the ticket you are working; all work happens on a ticket.
3. Pick the smallest relevant map from `.ai/maps/`.
4. Inspect generated index files only if file discovery is still unclear.
5. Use search or approved context tools for exact symbol, route, dependency, and document discovery.
6. Read exact source files, tests, contracts, wiki pages, or configs.
7. Edit narrowly, then verify.

## Task Routing

| Task Type | Read First | Then Inspect |
| --- | --- | --- |
| Application behavior | `.ai/maps/application-map.md` | Entry points, feature modules, state, tests |
| Data model or persistence | `.ai/maps/data-map.md` | Schemas, repositories, migrations, data wiki pages |
| Tests or failing checks | `.ai/maps/testing-map.md` | Exact failing test, subject file, setup |
| Architecture or why something is built this way | `docs/architecture.md`, `docs/adr/` | `wiki/desktop/desktop-architecture.md`, the module's source |
| Domain wording | `GLOSSARY.md` | `wiki/shared/finance-domain-glossary.md` |
| Ticket, workflow, or what to do next | `tickets/BOARD.md`, `.agents/workflows/main-flow.md` | The ticket file, `tickets` skill |
| Proposed features | `wiki/desktop/` page named in the ticket | `tickets/<feature>/` |

## Hard Rule

Maps, generated indexes, graphs, summaries, and embeddings are navigation aids. They are not implementation truth. Always read exact source files before edits.
