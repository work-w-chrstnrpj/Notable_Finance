# Data Flow Diagram

## Scope

The app is a finance UI and sync layer. Notion remains the source of truth.

## Level 0

```mermaid
flowchart LR
    User[User]
    App[Finance App]
    Backend[Backend API]
    Notion[Notion API]
    Workspace[(Notion Finance Databases)]

    User -->|View reference data; create/edit/delete supported records; sync| App
    App -->|API requests| Backend
    Backend -->|Read/write records| Notion
    Notion -->|Persist finance records and current Notion state| Workspace
    Workspace -->|Latest records, reference data, and current computed account state| Notion
    Notion -->|Responses and errors| Backend
    Backend -->|Clean data and sync status| App
    App -->|Forms, dashboards, errors| User
```

## Level 1: Pull And View

```mermaid
flowchart TD
    UI[Finance UI] --> Pull[Pull Latest Data]
    Pull --> Adapter[Notion Adapter]
    Adapter --> Accounts[(Accounts)]
    Adapter --> IncomeCategories[(Income Categories)]
    Adapter --> Incomes[(Incomes)]
    Adapter --> Transactions[(Transaction Views)]
    Adapter --> ExpenseCategories[(Expense Categories)]
    Adapter --> Expenses[(Expenses)]
    Adapter --> ExpenseScheduler[(Expense Scheduler Views)]
    Adapter --> Normalize[Normalize Records]
    Normalize --> Validate[Validate Mapping]
    Validate --> Cache[(Temporary Read Cache)]
    Cache --> Views[Dashboards, Lists, Details]
    Views --> UI
```

## Level 1: Mutation Sync

```mermaid
flowchart TD
    User[User] --> Form[Transactional Writable Field Form]
    Form --> Validate[Backend Validation]
    Validate --> Reject[Validation Error]
    Validate --> ChangeSet[Pending Change Set]
    ChangeSet --> Push[Push To Notion]
    Push --> Notion[Notion API]
    Notion --> Success[Write Success]
    Notion --> Failure[Write Failure]
    Success --> Pull[Pull Fresh Notion Data]
    Pull --> Refresh[Refresh UI From Notion]
    Failure --> Error[User-Safe Error And Sync Log]
    Reject --> User
    Refresh --> User
    Error --> User
```

## Data Stores

| Store | Canonical? | Purpose |
| --- | --- | --- |
| Notion finance databases | Yes | Accounts and categories as reference/configuration data; incomes, transactions through income views, expenses, and expense scheduler through expense views |
| Temporary read cache | No | Faster UI rendering and post-sync refresh |
| Pending changes | No | Holds user changes until commit |
| Sync logs/audit logs | No | Operational troubleshooting and user feedback |
| Session/auth store | No | Access control if implemented |

## Sensitive Boundaries

- Browser/frontend boundary: no Notion token.
- Backend boundary: validates input and owns Notion token use.
- Notion boundary: canonical persistence and computed values.
- Reporting boundary: selected-month Dashboard, Monthly Monitoring, and category metrics are calculated by app/shared logic from scoped records, not from Notion category or Monthly Monitoring formulas.
- Logs boundary: no raw secrets or unnecessary sensitive finance payloads.
