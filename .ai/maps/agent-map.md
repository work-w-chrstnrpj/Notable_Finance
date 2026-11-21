# Agent Map

Use this file to route work to the smallest useful role and skill.

## Canonical Roles

| Task | Primary Role | Supporting Roles |
| --- | --- | --- |
| Architecture, module boundaries, and technical risk | System Architect | Security Engineer, implementation role |
| Requirements, acceptance criteria, and planning | Product & Planning Manager | System Architect, SQA Engineer |
| User interface or client behavior | Frontend UI/UX Developer | SQA Engineer, Security Engineer |
| Services, APIs, data, integrations, jobs, or workers | Backend & Database Engineer | System Architect, Security Engineer, SQA Engineer |
| Deployment, runtime config, CI/CD, and monitoring | DevOps Engineer | Security Engineer, Technical Documentation Specialist |
| Secrets, auth, authorization, unsafe inputs, and sensitive workflows | Security Engineer | System Architect, implementation role |
| Test plans, manual cases, automated tests, regressions, and bug reports | SQA Engineer | Relevant implementation role |
| Setup, API docs, operations docs, changelog, and onboarding | Technical Documentation Specialist | Relevant implementation role |

Toolbox roles: `builder` owns dev and bug tickets (test-first, evidence); `reviewer` is read-only and reviews a diff against the spec and ADRs. Use the project roles above for domain checklists.

## Common Skill Routing

| Work | Skill |
| --- | --- |
| Not sure what to do next | `next` |
| Brainstorm or clarify a feature | `grill-with-docs` |
| Turn a decision into a spec, then tickets | `to-spec`, then `to-tickets` |
| Build a ticket test-first | `implement`, `tdd` |
| File a bug | `report-bug` |
| Record a term or decision | `domain-modeling` |
| Run workflow commands (board, validate, drift) | `cli` |
| Plan a change | `plan-code-change` |
| Implement a change | `execute-code-change` |
| Implement a feature | `execute-code-change` |
| Fix a bug | `investigate-issue`, then `execute-code-change` |
| Investigate why an issue occurred | `investigate-issue` |
| Generate an RCA report | `generate-rca` |
| Review a patch | `code-review` |
| Add automated tests | `write-automated-test-cases` |
| Create manual test cases | `create-manual-test-cases` |
| Execute manual test cases | `execute-manual-test-cases` |
| Update docs | `update-docs` |
| Review security | Security Engineer role with `code-review` |
| Prepare for release | `release-check` |

## Tool Adapter Routing

Treat `.agents/roles/` and `.agents/skills/` as canonical. After changing either source, run `node .ai/cli/bin/cli.mjs sync` to refresh generated adapters. The older `scripts/sync-ai-adapters.ps1` (PowerShell) predates the toolbox; see `scripts/README.md`.

- Claude adapters in `.claude/`
- Codex agents in `.codex/agents/`
- Cursor rules and skills in `.cursor/`
- GitHub Copilot agents and skills in `.github/`
- OpenCode agents and skills in `.opencode/`
