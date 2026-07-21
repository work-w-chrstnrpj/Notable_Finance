# Wiki Index

This folder is the project intent and operating record for Notable Finance.

## Read First

1. `product-specification/product-specification.md`
2. `tdd/tdd.md`
3. `project-structure/project-structure.md`
4. `development-plan/development-plan.md`

## Planning And Contracts

- `api/api-specification.md`: planned backend API contract.
- `database/data-model.md`: Notion data source and field access contract.
- `testing/test-specification.md`: planned verification strategy.
- `deployment/deployment.md`: deployment and operations requirements.
- `commands/commands.md`: safe command reference.

## Diagrams

- `diagrams/context-diagram.md`
- `diagrams/data-flow.md`
- `diagrams/entity-relationship.md`
- `diagrams/user-flow.md`

## Rules

- Notion is the source of truth.
- Accounts, Income Categories, and Expense Categories are Notion-maintained reference/configuration data in the app.
- Monthly Monitoring is in app scope as a read-focused monitoring section, with selected-month values calculated from scoped Income and Expense records.
- Draft files with `-draft` in the name are not canonical.
- Keep wiki pages concise, current, and tied to implementation truth as code is added.
