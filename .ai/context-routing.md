# Context Routing

Use this guide before reading broad wiki pages or source folders.

## Default Flow

1. Read `AGENTS.md`.
2. Identify the task type and lead role from `.ai/maps/agent-map.md` or `.ai/maps/agent-map.md` if the project creates one.
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

## Hard Rule

Maps, generated indexes, graphs, summaries, and embeddings are navigation aids. They are not implementation truth. Always read exact source files before edits.
