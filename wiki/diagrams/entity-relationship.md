# Entity Relationship Diagram

## Scope

This diagram models the planned app domain and sync metadata while preserving Notion as the source of truth for finance records.

```mermaid
erDiagram
  ACCOUNT ||--o{ INCOME : receives
  ACCOUNT ||--o{ INCOME : transacts
  INCOME_CATEGORY ||--o{ INCOME : classifies
  INCOME ||--o{ TRANSACTION_VIEW : filtered_as

  ACCOUNT ||--o{ EXPENSE : pays
  EXPENSE_CATEGORY ||--o{ EXPENSE : classifies
  EXPENSE ||--o{ EXPENSE_SCHEDULER_VIEW : filtered_as

  SYNC_RUN ||--o{ SYNC_CHANGE : records
  NOTION_CONNECTION ||--o{ NOTION_DATA_SOURCE_MAPPING : maps
  NOTION_CONNECTION ||--o{ SYNC_RUN : executes

  ACCOUNT {
    string id
    string notionPageId
    string accountName
    string accountType
    decimal startingBalance
    decimal creditLimit
    int billingDay
    int dueDay
    boolean inactive
    decimal currentBalance COMPUTED
    decimal availableLimit COMPUTED
  }

  INCOME_CATEGORY {
    string id
    string notionPageId
    string sourceOfIncome
    decimal monthlyEarnings COMPUTED
    decimal monthlyExpenditure COMPUTED
    decimal earningPercentage COMPUTED
  }

  INCOME {
    string id
    string notionPageId
    string accountId
    string incomeCategoryId
    string transactedAccountId
    string name
    date date
    decimal grossIncome
    decimal capitalExpenditure
    decimal netIncome COMPUTED
    decimal transactionAmount COMPUTED
  }

  TRANSACTION_VIEW {
    string id
    string backingIncomeId
    string transactionType
  }

  EXPENSE_CATEGORY {
    string id
    string notionPageId
    string categoryName
    decimal monthlyBudget
    decimal upcomingBudget
    string auxiliary
    decimal spending COMPUTED
    decimal remaining COMPUTED
    string overview COMPUTED
  }

  EXPENSE {
    string id
    string notionPageId
    string accountId
    string expenseCategoryId
    string purchaseDescription
    date purchaseDate
    date datePaid
    decimal expenseAmount
    decimal interest
    string paymentStatus
    string paymentFrequency
    int periodCount
    int paidPeriod
    string pasabuyer
    string pasabuyStatus
    int pasabuyPaidPeriod
    decimal grossPrice COMPUTED
    decimal installmentAmount COMPUTED
    decimal paidAmount COMPUTED
    decimal remainingBalance COMPUTED
    decimal pasabuyerBalance COMPUTED
  }

  EXPENSE_SCHEDULER_VIEW {
    string id
    string backingExpenseId
    string schedulerViewType
  }

  NOTION_CONNECTION {
    string id
    string workspaceId
    string tokenSecretRef
    string status
  }

  NOTION_DATA_SOURCE_MAPPING {
    string id
    string notionConnectionId
    string entityType
    string dataSourceId
    string displayName
    datetime lastSchemaValidatedAt
  }

  SYNC_RUN {
    string id
    string notionConnectionId
    string direction
    string status
    datetime startedAt
    datetime completedAt
  }

  SYNC_CHANGE {
    string id
    string syncRunId
    string entityType
    string notionPageId
    string operation
    string status
    string errorCode
  }
```

## Rules

- `notionPageId` maps app records back to their Notion pages.
- Transaction views are filtered workflows over Incomes, not separate canonical records.
- Expense Scheduler views are filtered workflows over Expenses, not separate canonical records.
- Computed fields are read from Notion or derived for display and must not be submitted in mutation payloads.
- Sync metadata is supporting state only.
- Notion data source mappings belong in backend configuration or server-side metadata, not frontend code.
