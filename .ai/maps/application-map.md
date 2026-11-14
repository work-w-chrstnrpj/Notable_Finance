# Application Map

Use this map for finance UI work in the desktop app (`notable-finance-app/`).

## Read First

- `wiki/shared/product-specification.md`
- `wiki/desktop/desktop-architecture.md`
- `wiki/desktop/project-structure.md`
- `notable-finance-app/README.md`

## Entry Points

- `notable-finance-app/src/renderer/src/components/finance-workspace.tsx`: app shell, section routing, hidden-section handling.
- `notable-finance-app/src/renderer/src/components/pages/`: one directory per page (`income/`, `expense/`, `workflow/` for Transfer, CC Payment, Alkansya, Borrowings and Receivables).
- `notable-finance-app/src/renderer/src/features/records/`: shared record-page engine (selection, filters, search, bulk actions, receipts).
- `notable-finance-app/src/renderer/src/lib/api-client.ts`: renderer data layer over `window.api`.
- `notable-finance-app/src/renderer/src/lib/finance-rules.ts`: field-visibility and workflow guardrails.

## Boundaries

- The renderer calls `window.api` only; it never calls Notion and never holds secrets.
- Forms show writable fields only; computed fields are read-only display values.
- Live Notion select labels are preserved exactly in app labels.
