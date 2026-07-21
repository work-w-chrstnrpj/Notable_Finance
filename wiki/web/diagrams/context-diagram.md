# Context Diagram

```mermaid
flowchart LR
    User[Owner User]
    Browser[Finance UI]
    API[Backend API]
    NotionAPI[Notion API]
    Workspace[(Financial Database 24-26)]
    OptionalStore[(Optional App Metadata Store)]

    User -->|Finance workflows| Browser
    Browser -->|Authenticated app API calls| API
    API -->|Read/write via server-side token| NotionAPI
    NotionAPI --> Workspace
    Workspace --> NotionAPI
    API -->|Sync logs, sessions, cache if added| OptionalStore
    API -->|Clean responses and errors| Browser
    Browser -->|Forms and dashboards| User
```

## Boundary Notes

- Notion is the source of truth for finance records.
- Accounts and Categories are Notion-maintained reference/configuration data in the app.
- Monthly Monitoring is shown in the app as a read-focused monitoring section, with selected-month values calculated from scoped Income and Expense records.
- The browser never receives the Notion token.
- The backend is the trust boundary for validation, mapping, and sync.
- App metadata storage supports sessions if needed, cache snapshots, pending mutations, conflicts, audit events, and sync logs, but not canonical finance records.
