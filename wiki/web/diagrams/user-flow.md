# User Flow Diagram

## Main Finance Workflow

```mermaid
flowchart TD
    Start[Open app] --> Auth{Authenticated?}
    Auth -->|No| Login[Login or unlock app]
    Login --> Pull
    Auth -->|Yes| Pull[Pull latest Notion data]
    Pull --> Dashboard[View dashboard and lists]
    Dashboard --> Action{Choose action}
    Action --> View[View record details]
    Action --> Create[Create supported record]
    Action --> Edit[Edit supported writable fields]
    Action --> Delete[Request delete]
    View --> Dashboard
    Create --> Validate[Validate input]
    Edit --> Validate
    Delete --> Confirm[Confirm action]
    Confirm --> Queue[Queue pending operation]
    Validate -->|Invalid| FormError[Show field errors]
    FormError --> Create
    Validate -->|Valid| Queue
    Queue --> Sync[Sync changes]
    Sync --> Push[Push to Notion]
    Push -->|Success| Repull[Pull latest Notion data]
    Push -->|Failure| SyncError[Show sync error]
    Repull --> Refresh[Refresh UI]
    Refresh --> Dashboard
    SyncError --> Dashboard
```

## Form Rule

Forms show writable fields only. Computed fields from Notion appear in detail, list, or dashboard views as read-only values.

Forms are for supported transactional records only. Accounts, Income Categories, and Expense Categories are maintained in Notion and appear in the app as reference/configuration data.

Normal Income forms show only income-related fields and hide transaction-only fields such as `Transacted Account`. Expense forms adapt to the selected account, category, and view so credit-card and Pasabuy fields appear only when relevant.

## Sync Rule

The successful ending state is not "local form saved." The successful ending state is "Notion accepted the change, latest Notion data was pulled, and the UI refreshed from that data."
