# Application

This folder now contains the first Next.js frontend foundation for Notable Finance.

Current responsibilities:

- App-first finance workspace shell using Next.js App Router.
- Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, Receivables, Sync Center, and Settings routes.
- Mock Notion-backed DTO data used only until backend endpoints are available.
- Writable-field-focused create/edit form foundations.
- Read-only display treatment for computed Notion fields.
- Sync status, pending operation, failed operation, schema health, and refresh-from-snapshot UX foundations.
- Typed backend API client boundary for `/api/v1` calls.

Rules:

- Do not call Notion directly from the frontend.
- Do not store Notion tokens or server secrets here.
- Preserve live Notion select labels exactly in app labels unless a later display-label mapping is approved.
- Replace mock data through the backend API boundary as service contracts become available.

Commands:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```
