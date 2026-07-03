# Application

This folder is reserved for the future Notion Finance user interface.

Planned responsibilities:

- Finance dashboard, list, detail, and form screens.
- Accounts, income categories, incomes, transactions, expense categories, expenses, and expense scheduler views.
- Writable-field-only create/edit forms.
- Read-only display of Notion computed fields.
- Sync status, pending changes, failed operations, and schema health UI.
- Direct-save forms and explicit queued Sync button flows.
- Calls to the backend service API only.

Rules:

- Do not call Notion directly from the frontend.
- Do not store Notion tokens or server secrets here.
- Preserve live Notion select labels exactly in app labels unless a later display-label mapping is approved.
- Do not add framework-specific files until the implementation scaffolding task begins.
